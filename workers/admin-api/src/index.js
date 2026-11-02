/**
 * HIJABIAN Admin API – Cloudflare Worker
 *
 * Browser → Cloudflare Access → this Worker → GitHub Contents API
 *
 * Secrets (wrangler secret put):
 *   GITHUB_TOKEN
 *   ADMIN_SHARED_SECRET   (optional extra header check)
 *
 * Vars (wrangler.toml [vars]):
 *   GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH, ALLOWED_EMAILS
 */

const JSON_PATHS = {
  courses: "data/courses.json",
  products: "data/products.json",
  categories: "data/categories.json",
  settings: "data/settings.json",
};

const IMAGE_PREFIX = "images/";
const MAX_IMAGE_BYTES = 2.5 * 1024 * 1024; // 2.5 MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default {
  async fetch(request, env, ctx) {
    try {
      if (request.method === "OPTIONS") {
        return cors(new Response(null, { status: 204 }), request, env);
      }

      const url = new URL(request.url);
      const path = url.pathname.replace(/\/+$/, "") || "/";

      // Health is public (no catalogue data)
      if (path === "/api/health" && request.method === "GET") {
        return cors(json({ ok: true, service: "hijabian-admin-api" }), request, env);
      }

      // Everything else requires Access identity + optional shared secret
      const authError = requireAuth(request, env);
      if (authError) return cors(authError, request, env);

      if (!env.GITHUB_TOKEN) {
        return cors(json({ error: "Server configuration incomplete." }, 500), request, env);
      }

      // Routes
      if (path === "/api/catalogue" && request.method === "GET") {
        return cors(await handleGetCatalogue(env), request, env);
      }

      if (path === "/api/courses" && request.method === "GET") {
        return cors(await handleGetFile(env, "courses"), request, env);
      }
      if (path === "/api/courses" && request.method === "PUT") {
        return cors(await handlePutCollection(request, env, "courses", validateCoursesPayload), request, env);
      }

      if (path === "/api/products" && request.method === "GET") {
        return cors(await handleGetFile(env, "products"), request, env);
      }
      if (path === "/api/products" && request.method === "PUT") {
        return cors(await handlePutCollection(request, env, "products", validateProductsPayload), request, env);
      }

      if (path === "/api/categories" && request.method === "GET") {
        return cors(await handleGetFile(env, "categories"), request, env);
      }
      if (path === "/api/categories" && request.method === "PUT") {
        return cors(await handlePutCollection(request, env, "categories", validateCategoriesPayload), request, env);
      }

      if (path === "/api/settings" && request.method === "GET") {
        return cors(await handleGetFile(env, "settings"), request, env);
      }
      if (path === "/api/settings" && request.method === "PUT") {
        return cors(await handlePutSettings(request, env), request, env);
      }

      if (path === "/api/upload" && request.method === "POST") {
        return cors(await handleUpload(request, env), request, env);
      }

      return cors(json({ error: "Not found." }, 404), request, env);
    } catch (err) {
      // Never leak internal details or tokens
      console.error("Worker error:", err?.message || err);
      return cors(json({ error: "Unexpected server error." }, 500), request, env);
    }
  },
};

/* ===================== Auth ===================== */

function requireAuth(request, env) {
  // Cloudflare Access sets this when the request passed an Access policy
  const email = (
    request.headers.get("Cf-Access-Authenticated-User-Email") ||
    request.headers.get("cf-access-authenticated-user-email") ||
    ""
  )
    .trim()
    .toLowerCase();

  if (!email) {
    return json(
      {
        error:
          "Unauthorised. Cloudflare Access identity required. Protect this Worker with an Access application.",
      },
      401
    );
  }

  const allowed = String(env.ALLOWED_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (allowed.length === 0) {
    return json(
      {
        error:
          "Server misconfigured: ALLOWED_EMAILS is empty. No admin users are permitted.",
      },
      403
    );
  }

  if (!allowed.includes(email)) {
    return json({ error: "Forbidden. Your account is not authorised for admin access." }, 403);
  }

  // Optional second factor: shared secret known only to the admin UI build/config
  if (env.ADMIN_SHARED_SECRET) {
    const provided = request.headers.get("X-Admin-Secret") || "";
    if (provided !== env.ADMIN_SHARED_SECRET) {
      return json({ error: "Forbidden. Invalid admin secret." }, 403);
    }
  }

  return null;
}

/* ===================== Catalogue handlers ===================== */

async function handleGetCatalogue(env) {
  const [courses, products, categories, settings] = await Promise.all([
    githubGetJson(env, JSON_PATHS.courses),
    githubGetJson(env, JSON_PATHS.products),
    githubGetJson(env, JSON_PATHS.categories),
    githubGetJson(env, JSON_PATHS.settings),
  ]);
  return json({
    courses: courses.data,
    products: products.data,
    categories: categories.data,
    settings: settings.data,
  });
}

async function handleGetFile(env, key) {
  const result = await githubGetJson(env, JSON_PATHS[key]);
  return json({ data: result.data, sha: result.sha });
}

async function handlePutCollection(request, env, key, validator) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const validation = validator(body);
  if (!validation.ok) return json({ error: validation.error }, 400);

  const path = JSON_PATHS[key];
  const current = await githubGetJson(env, path);
  const clientSha = body.sha || null;

  // Require SHA when file already exists to avoid clobbering concurrent edits
  if (current.sha && clientSha && clientSha !== current.sha) {
    return json(
      {
        error: "Conflict. The file was changed elsewhere. Reload and try again.",
        sha: current.sha,
      },
      409
    );
  }

  const payload = validation.data;
  payload.updatedAt = new Date().toISOString();

  const content = JSON.stringify(payload, null, 2) + "\n";
  const result = await githubPutFile(env, path, content, current.sha, `Admin: update ${path}`);

  if (!result.ok) return json({ error: result.error }, result.status || 502);

  return json({ ok: true, sha: result.sha, path });
}

async function handlePutSettings(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const validation = validateSettingsPayload(body);
  if (!validation.ok) return json({ error: validation.error }, 400);

  const path = JSON_PATHS.settings;
  const current = await githubGetJson(env, path);
  const clientSha = body.sha || null;

  if (current.sha && clientSha && clientSha !== current.sha) {
    return json(
      { error: "Conflict. Settings were changed elsewhere. Reload and try again.", sha: current.sha },
      409
    );
  }

  const payload = validation.data;
  payload.updatedAt = new Date().toISOString();

  const content = JSON.stringify(payload, null, 2) + "\n";
  const result = await githubPutFile(env, path, content, current.sha, "Admin: update settings");
  if (!result.ok) return json({ error: result.error }, result.status || 502);

  return json({ ok: true, sha: result.sha, path });
}

async function handleUpload(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const { filename, contentBase64, contentType } = body || {};

  if (!filename || typeof filename !== "string") {
    return json({ error: "filename is required." }, 400);
  }
  if (!contentBase64 || typeof contentBase64 !== "string") {
    return json({ error: "contentBase64 is required." }, 400);
  }
  if (!contentType || !ALLOWED_IMAGE_TYPES.includes(contentType)) {
    return json({ error: "Unsupported image type. Use JPEG, PNG, WebP or GIF." }, 400);
  }

  // Sanitise filename – no path traversal
  const safeName = filename
    .replace(/\\/g, "/")
    .split("/")
    .pop()
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-");

  if (!safeName || safeName.startsWith(".")) {
    return json({ error: "Invalid filename." }, 400);
  }

  // Rough size check from base64 length
  const approxBytes = Math.floor((contentBase64.length * 3) / 4);
  if (approxBytes > MAX_IMAGE_BYTES) {
    return json({ error: "Image too large. Maximum 2.5 MB." }, 400);
  }

  // Only allow under images/products/ or images/courses/
  const folder = body.folder === "courses" ? "images/courses" : "images/products";
  const path = `${folder}/${safeName}`;

  // If file exists, fetch SHA for update
  let sha = null;
  const existing = await githubGetRaw(env, path);
  if (existing.ok && existing.sha) sha = existing.sha;

  const result = await githubPutFileBase64(
    env,
    path,
    contentBase64,
    sha,
    `Admin: upload ${path}`
  );

  if (!result.ok) return json({ error: result.error }, result.status || 502);

  return json({ ok: true, path, sha: result.sha });
}

/* ===================== Validation ===================== */

function validateCoursesPayload(body) {
  if (!body || !Array.isArray(body.courses)) {
    return { ok: false, error: "Body must include a courses array." };
  }
  if (body.courses.length > 500) {
    return { ok: false, error: "Too many courses in one update." };
  }

  const cleaned = [];
  for (const c of body.courses) {
    if (!c || typeof c !== "object") return { ok: false, error: "Invalid course entry." };
    if (!c.id || !c.title) return { ok: false, error: "Each course needs id and title." };
    if (typeof c.price !== "number" || c.price < 0) {
      return { ok: false, error: `Invalid price for course ${c.id}.` };
    }
    const status = c.status || "draft";
    if (!["draft", "published", "unpublished"].includes(status)) {
      return { ok: false, error: `Invalid status for course ${c.id}.` };
    }
    cleaned.push({
      id: String(c.id).slice(0, 80),
      type: "course",
      title: String(c.title).slice(0, 200),
      slug: String(c.slug || "").slice(0, 200),
      category: String(c.category || "").slice(0, 80),
      shortDescription: String(c.shortDescription || "").slice(0, 500),
      description: String(c.description || "").slice(0, 10000),
      price: Number(c.price),
      currency: "PKR",
      image: sanitizeImagePath(c.image),
      status,
      duration: String(c.duration || "").slice(0, 80),
      schedule: String(c.schedule || "").slice(0, 200),
      startDate: String(c.startDate || "").slice(0, 40),
      platform: String(c.platform || "Zoom").slice(0, 40),
      instructor: String(c.instructor || "").slice(0, 120),
      availableSeats: c.availableSeats == null ? null : Number(c.availableSeats),
      registrationStatus: ["open", "closed"].includes(c.registrationStatus)
        ? c.registrationStatus
        : "open",
      learningOutcomes: Array.isArray(c.learningOutcomes)
        ? c.learningOutcomes.map((x) => String(x).slice(0, 300)).slice(0, 30)
        : [],
      requirements: Array.isArray(c.requirements)
        ? c.requirements.map((x) => String(x).slice(0, 300)).slice(0, 30)
        : [],
      createdAt: String(c.createdAt || new Date().toISOString()).slice(0, 40),
      updatedAt: String(c.updatedAt || new Date().toISOString()).slice(0, 40),
    });
  }

  return { ok: true, data: { courses: cleaned } };
}

function validateProductsPayload(body) {
  if (!body || !Array.isArray(body.products)) {
    return { ok: false, error: "Body must include a products array." };
  }
  if (body.products.length > 500) {
    return { ok: false, error: "Too many products in one update." };
  }

  const cleaned = [];
  for (const p of body.products) {
    if (!p || typeof p !== "object") return { ok: false, error: "Invalid product entry." };
    if (!p.id || !p.title) return { ok: false, error: "Each product needs id and title." };
    if (typeof p.price !== "number" || p.price < 0) {
      return { ok: false, error: `Invalid price for product ${p.id}.` };
    }
    const status = p.status || "draft";
    if (!["draft", "published", "unpublished"].includes(status)) {
      return { ok: false, error: `Invalid status for product ${p.id}.` };
    }

    const variants = Array.isArray(p.variants)
      ? p.variants.slice(0, 50).map((v) => ({
          id: String(v.id || "").slice(0, 80),
          name: String(v.name || "").slice(0, 80),
          colour: String(v.colour || "").slice(0, 40),
          size: String(v.size || "").slice(0, 40),
          stock: v.stock == null ? null : Number(v.stock),
          sku: String(v.sku || "").slice(0, 80),
        }))
      : [];

    cleaned.push({
      id: String(p.id).slice(0, 80),
      type: "physical",
      title: String(p.title).slice(0, 200),
      slug: String(p.slug || "").slice(0, 200),
      category: String(p.category || "").slice(0, 80),
      shortDescription: String(p.shortDescription || "").slice(0, 500),
      description: String(p.description || "").slice(0, 10000),
      price: Number(p.price),
      currency: "PKR",
      image: sanitizeImagePath(p.image),
      status,
      sku: String(p.sku || "").slice(0, 80),
      stock: p.stock == null ? null : Number(p.stock),
      colour: String(p.colour || "").slice(0, 40),
      size: String(p.size || "").slice(0, 40),
      shippingInfo: String(p.shippingInfo || "").slice(0, 1000),
      variants,
      createdAt: String(p.createdAt || new Date().toISOString()).slice(0, 40),
      updatedAt: String(p.updatedAt || new Date().toISOString()).slice(0, 40),
    });
  }

  return { ok: true, data: { products: cleaned } };
}

function validateCategoriesPayload(body) {
  if (!body || !Array.isArray(body.categories)) {
    return { ok: false, error: "Body must include a categories array." };
  }
  if (body.categories.length > 100) {
    return { ok: false, error: "Too many categories." };
  }

  const cleaned = body.categories.map((c) => ({
    id: String(c.id || "").slice(0, 80),
    name: String(c.name || "").slice(0, 120),
    slug: String(c.slug || "").slice(0, 80),
    description: String(c.description || "").slice(0, 500),
    image: sanitizeImagePath(c.image),
    type: Array.isArray(c.type) ? c.type.map(String).slice(0, 5) : [],
    order: Number(c.order) || 0,
    status: c.status === "unpublished" ? "unpublished" : "published",
  }));

  return { ok: true, data: { categories: cleaned } };
}

function validateSettingsPayload(body) {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid settings body." };
  }

  const data = {
    businessName: String(body.businessName || "Hijabian").slice(0, 120),
    tagline: String(body.tagline || "").slice(0, 200),
    whatsappNumber: String(body.whatsappNumber || "").replace(/[^0-9]/g, "").slice(0, 20),
    phoneDisplay: String(body.phoneDisplay || "").slice(0, 40),
    currency: String(body.currency || "PKR").slice(0, 8),
    currencySymbol: String(body.currencySymbol || "Rs").slice(0, 8),
    siteUrl: String(body.siteUrl || "").slice(0, 200),
    canonicalDomain: String(body.canonicalDomain || "").slice(0, 200),
    social: {
      facebook: String(body.social?.facebook || "").slice(0, 300),
      instagram: String(body.social?.instagram || "").slice(0, 300),
      tiktok: String(body.social?.tiktok || "").slice(0, 300),
      youtube: String(body.social?.youtube || "").slice(0, 300),
    },
  };

  if (!data.whatsappNumber) {
    return { ok: false, error: "whatsappNumber is required." };
  }

  return { ok: true, data };
}

function sanitizeImagePath(path) {
  const p = String(path || "").replace(/\\/g, "/").replace(/^\/+/, "");
  if (!p) return "images/Banner-Image.webp";
  if (p.includes("..")) return "images/Banner-Image.webp";
  if (!p.startsWith("images/")) return "images/" + p.split("/").pop();
  return p.slice(0, 200);
}

/* ===================== GitHub API ===================== */

function githubHeaders(env, extra = {}) {
  return {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "hijabian-admin-api",
    ...extra,
  };
}

function githubContentsUrl(env, path) {
  const owner = env.GITHUB_OWNER || "hijabian-studio";
  const repo = env.GITHUB_REPO || "hijabian";
  return `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
}

async function githubGetJson(env, path) {
  const res = await fetch(
    `${githubContentsUrl(env, path)}?ref=${encodeURIComponent(env.GITHUB_BRANCH || "main")}`,
    { headers: githubHeaders(env) }
  );

  if (res.status === 404) {
    return { data: defaultEmpty(path), sha: null };
  }

  if (res.status === 403 || res.status === 429) {
    const msg =
      res.status === 429
        ? "GitHub rate limit exceeded. Try again later."
        : "GitHub access denied. Check token permissions.";
    throw new Error(msg);
  }

  if (!res.ok) {
    throw new Error("Failed to read catalogue file from GitHub.");
  }

  const file = await res.json();
  const decoded = JSON.parse(atob(file.content.replace(/\n/g, "")));
  return { data: decoded, sha: file.sha };
}

async function githubGetRaw(env, path) {
  const res = await fetch(
    `${githubContentsUrl(env, path)}?ref=${encodeURIComponent(env.GITHUB_BRANCH || "main")}`,
    { headers: githubHeaders(env) }
  );
  if (res.status === 404) return { ok: false, sha: null };
  if (!res.ok) return { ok: false, sha: null };
  const file = await res.json();
  return { ok: true, sha: file.sha };
}

async function githubPutFile(env, path, textContent, sha, message) {
  const body = {
    message: message || `Admin update ${path}`,
    content: btoa(unescape(encodeURIComponent(textContent))),
    branch: env.GITHUB_BRANCH || "main",
  };
  if (sha) body.sha = sha;

  const res = await fetch(githubContentsUrl(env, path), {
    method: "PUT",
    headers: githubHeaders(env, { "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });

  if (res.status === 409) {
    return { ok: false, status: 409, error: "Conflict updating file. Reload and retry." };
  }
  if (res.status === 403 || res.status === 429) {
    return {
      ok: false,
      status: res.status,
      error:
        res.status === 429
          ? "GitHub rate limit exceeded."
          : "GitHub access denied. Check token permissions.",
    };
  }
  if (!res.ok) {
    return { ok: false, status: 502, error: "Failed to write file to GitHub." };
  }

  const data = await res.json();
  return { ok: true, sha: data.content?.sha || null };
}

async function githubPutFileBase64(env, path, base64Content, sha, message) {
  // content already base64 (from client); strip data-URL prefix if present
  let content = base64Content;
  const comma = content.indexOf(",");
  if (content.startsWith("data:") && comma !== -1) {
    content = content.slice(comma + 1);
  }

  const body = {
    message: message || `Admin upload ${path}`,
    content,
    branch: env.GITHUB_BRANCH || "main",
  };
  if (sha) body.sha = sha;

  const res = await fetch(githubContentsUrl(env, path), {
    method: "PUT",
    headers: githubHeaders(env, { "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    if (res.status === 409) {
      return { ok: false, status: 409, error: "Conflict uploading file." };
    }
    return { ok: false, status: 502, error: "Failed to upload image to GitHub." };
  }

  const data = await res.json();
  return { ok: true, sha: data.content?.sha || null };
}

function defaultEmpty(path) {
  if (path.includes("courses")) return { courses: [] };
  if (path.includes("products")) return { products: [] };
  if (path.includes("categories")) return { categories: [] };
  return {};
}

/* ===================== HTTP helpers ===================== */

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function cors(response, request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = [
    "https://hijabian-studio.github.io",
    "https://hijabian.com",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:8787",
  ];

  // Allow exact origins; also allow empty origin (same-origin / non-browser)
  const headers = new Headers(response.headers);
  if (!origin || allowed.includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin || "*");
  }
  headers.set("Access-Control-Allow-Methods", "GET, PUT, POST, OPTIONS");
  headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, X-Admin-Secret, CF-Access-Client-Id, CF-Access-Client-Secret"
  );
  headers.set("Access-Control-Max-Age", "86400");
  headers.set("Vary", "Origin");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Cache-Control", "no-store");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
