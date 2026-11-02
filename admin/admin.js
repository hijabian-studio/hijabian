/* =========================================================
   HIJABIAN ADMIN PANEL – UI ONLY
   Changes are held in memory / localStorage for preview.
   Production save requires Cloudflare Worker backend.
========================================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "hijabian_admin_preview";
  const state = {
    courses: [],
    products: [],
    categories: [],
    settings: {},
    section: "dashboard",
    editingCourse: null,
    editingProduct: null
  };

  /* ---------- Storage helpers ---------- */

  function loadPreview() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
    } catch {
      return null;
    }
  }

  function savePreview() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        courses: state.courses,
        products: state.products,
        categories: state.categories,
        settings: state.settings,
        savedAt: new Date().toISOString()
      })
    );
  }

  function showNotice(msg, type) {
    const el = document.getElementById("admin-notice");
    if (!el) return;
    el.textContent = msg;
    el.className = "preview-banner" + (type === "error" ? " error" : "");
    el.style.display = "block";
    clearTimeout(el._t);
    el._t = setTimeout(() => {
      el.style.display = "none";
    }, 4000);
  }

  function slugify(text) {
    return String(text || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function uid(prefix) {
    return prefix + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function formatPrice(n) {
    return "Rs " + Number(n || 0).toLocaleString("en-PK");
  }

  /* ---------- Navigation ---------- */

  function showSection(name) {
    state.section = name;
    document.querySelectorAll(".section").forEach((s) => s.classList.remove("active"));
    const sec = document.getElementById("section-" + name);
    if (sec) sec.classList.add("active");

    document.querySelectorAll(".admin-nav button").forEach((b) => {
      b.classList.toggle("active", b.dataset.section === name);
    });

    const titles = {
      dashboard: "Dashboard",
      courses: "Course Management",
      products: "Product Management",
      categories: "Categories",
      media: "Media",
      settings: "Settings"
    };
    const titleEl = document.getElementById("page-title");
    if (titleEl) titleEl.textContent = titles[name] || "Admin";

    if (name === "dashboard") renderDashboard();
    if (name === "courses") renderCoursesTable();
    if (name === "products") renderProductsTable();
    if (name === "categories") renderCategories();
    if (name === "settings") renderSettingsForm();

    // close mobile sidebar
    document.getElementById("admin-sidebar")?.classList.remove("open");
  }

  /* ---------- Dashboard ---------- */

  function renderDashboard() {
    const pubCourses = state.courses.filter((c) => c.status === "published").length;
    const draftCourses = state.courses.filter((c) => c.status === "draft" || c.status === "unpublished").length;
    const pubProducts = state.products.filter((p) => p.status === "published").length;
    const draftProducts = state.products.filter((p) => p.status !== "published").length;

    document.getElementById("stat-pub-courses").textContent = pubCourses;
    document.getElementById("stat-draft-courses").textContent = draftCourses;
    document.getElementById("stat-pub-products").textContent = pubProducts;
    document.getElementById("stat-draft-products").textContent = draftProducts;
  }

  /* ---------- Courses ---------- */

  function renderCoursesTable() {
    const tbody = document.getElementById("courses-tbody");
    if (!tbody) return;

    if (!state.courses.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-table">No courses yet. Add your first course.</td></tr>`;
      return;
    }

    tbody.innerHTML = state.courses
      .map((c) => {
        const statusClass =
          c.status === "published"
            ? "status-published"
            : c.status === "draft"
            ? "status-draft"
            : "status-unpublished";
        return `<tr>
          <td><img class="thumb" src="../${c.image || "images/Banner-Image.webp"}" alt=""></td>
          <td><strong>${escapeHtml(c.title)}</strong><br><span style="font-size:0.8rem;color:var(--text-light)">${escapeHtml(c.category || "")}</span></td>
          <td>${formatPrice(c.price)}</td>
          <td>${escapeHtml(c.startDate || "—")}<br><span style="font-size:0.8rem;color:var(--text-light)">${escapeHtml(c.duration || "")}</span></td>
          <td><span class="status-pill ${statusClass}">${c.status || "draft"}</span></td>
          <td>
            <div class="btn-row">
              <button class="btn btn-outline btn-sm" data-edit-course="${c.id}">Edit</button>
              <button class="btn btn-outline btn-sm" data-toggle-course="${c.id}">${c.status === "published" ? "Unpublish" : "Publish"}</button>
              <button class="btn btn-danger btn-sm" data-delete-course="${c.id}">Delete</button>
            </div>
          </td>
        </tr>`;
      })
      .join("");

    tbody.querySelectorAll("[data-edit-course]").forEach((b) =>
      b.addEventListener("click", () => openCourseModal(b.dataset.editCourse))
    );
    tbody.querySelectorAll("[data-toggle-course]").forEach((b) =>
      b.addEventListener("click", () => toggleCourseStatus(b.dataset.toggleCourse))
    );
    tbody.querySelectorAll("[data-delete-course]").forEach((b) =>
      b.addEventListener("click", () => deleteCourse(b.dataset.deleteCourse))
    );
  }

  function openCourseModal(id) {
    state.editingCourse = id || null;
    const c = id ? state.courses.find((x) => x.id === id) : null;
    const form = document.getElementById("course-form");
    form.reset();

    document.getElementById("course-modal-title").textContent = c ? "Edit Course" : "Add Course";
    setVal("course-id", c?.id || "");
    setVal("course-title", c?.title || "");
    setVal("course-slug", c?.slug || "");
    setVal("course-category", c?.category || "");
    setVal("course-short", c?.shortDescription || "");
    setVal("course-desc", c?.description || "");
    setVal("course-price", c?.price ?? "");
    setVal("course-image", c?.image || "");
    setVal("course-duration", c?.duration || "");
    setVal("course-schedule", c?.schedule || "");
    setVal("course-start", c?.startDate || "");
    setVal("course-platform", c?.platform || "Zoom");
    setVal("course-instructor", c?.instructor || "");
    setVal("course-seats", c?.availableSeats ?? "");
    setVal("course-reg-status", c?.registrationStatus || "open");
    setVal("course-status", c?.status || "draft");

    renderListEditor("course-outcomes", c?.learningOutcomes || []);
    renderListEditor("course-requirements", c?.requirements || []);
    updateImagePreview("course-image", "course-image-preview");

    document.getElementById("course-modal").classList.add("active");
  }

  function saveCourse(e) {
    e.preventDefault();
    const title = getVal("course-title");
    if (!title) {
      showNotice("Title is required.", "error");
      return;
    }

    const id = getVal("course-id") || uid("course");
    const existing = state.courses.findIndex((c) => c.id === id);
    const now = new Date().toISOString();

    const record = {
      id,
      type: "course",
      title,
      slug: getVal("course-slug") || slugify(title),
      category: getVal("course-category"),
      shortDescription: getVal("course-short"),
      description: getVal("course-desc"),
      price: Number(getVal("course-price")) || 0,
      currency: "PKR",
      image: getVal("course-image") || "images/Banner-Image.webp",
      status: getVal("course-status") || "draft",
      duration: getVal("course-duration"),
      schedule: getVal("course-schedule"),
      startDate: getVal("course-start"),
      platform: getVal("course-platform"),
      instructor: getVal("course-instructor"),
      availableSeats: getVal("course-seats") === "" ? null : Number(getVal("course-seats")),
      registrationStatus: getVal("course-reg-status") || "open",
      learningOutcomes: readListEditor("course-outcomes"),
      requirements: readListEditor("course-requirements"),
      createdAt: existing >= 0 ? state.courses[existing].createdAt : now,
      updatedAt: now
    };

    if (existing >= 0) state.courses[existing] = record;
    else state.courses.push(record);

    savePreview();
    closeModal("course-modal");
    renderCoursesTable();
    renderDashboard();
    showNotice("Course saved in preview mode only. Backend required to publish to the live site.");
  }

  function toggleCourseStatus(id) {
    const c = state.courses.find((x) => x.id === id);
    if (!c) return;
    c.status = c.status === "published" ? "unpublished" : "published";
    if (c.status === "published") c.registrationStatus = c.registrationStatus || "open";
    c.updatedAt = new Date().toISOString();
    savePreview();
    renderCoursesTable();
    renderDashboard();
    showNotice("Status updated in preview mode only.");
  }

  function deleteCourse(id) {
    if (!confirm("Delete this course from the preview catalogue?")) return;
    state.courses = state.courses.filter((c) => c.id !== id);
    savePreview();
    renderCoursesTable();
    renderDashboard();
    showNotice("Course removed from preview.");
  }

  /* ---------- Products ---------- */

  function renderProductsTable() {
    const tbody = document.getElementById("products-tbody");
    if (!tbody) return;

    if (!state.products.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-table">No products yet. Add your first product.</td></tr>`;
      return;
    }

    tbody.innerHTML = state.products
      .map((p) => {
        const statusClass = p.status === "published" ? "status-published" : "status-draft";
        return `<tr>
          <td><img class="thumb" src="../${p.image || "images/online-store.webp"}" alt=""></td>
          <td><strong>${escapeHtml(p.title)}</strong><br><span style="font-size:0.8rem;color:var(--text-light)">${escapeHtml(p.sku || "")}</span></td>
          <td>${formatPrice(p.price)}</td>
          <td>${p.stock != null ? p.stock : "—"}</td>
          <td><span class="status-pill ${statusClass}">${p.status || "draft"}</span></td>
          <td>
            <div class="btn-row">
              <button class="btn btn-outline btn-sm" data-edit-product="${p.id}">Edit</button>
              <button class="btn btn-outline btn-sm" data-toggle-product="${p.id}">${p.status === "published" ? "Unpublish" : "Publish"}</button>
              <button class="btn btn-danger btn-sm" data-delete-product="${p.id}">Delete</button>
            </div>
          </td>
        </tr>`;
      })
      .join("");

    tbody.querySelectorAll("[data-edit-product]").forEach((b) =>
      b.addEventListener("click", () => openProductModal(b.dataset.editProduct))
    );
    tbody.querySelectorAll("[data-toggle-product]").forEach((b) =>
      b.addEventListener("click", () => toggleProductStatus(b.dataset.toggleProduct))
    );
    tbody.querySelectorAll("[data-delete-product]").forEach((b) =>
      b.addEventListener("click", () => deleteProduct(b.dataset.deleteProduct))
    );
  }

  function openProductModal(id) {
    state.editingProduct = id || null;
    const p = id ? state.products.find((x) => x.id === id) : null;
    document.getElementById("product-form").reset();
    document.getElementById("product-modal-title").textContent = p ? "Edit Product" : "Add Product";

    setVal("product-id", p?.id || "");
    setVal("product-title", p?.title || "");
    setVal("product-slug", p?.slug || "");
    setVal("product-category", p?.category || "physical-products");
    setVal("product-short", p?.shortDescription || "");
    setVal("product-desc", p?.description || "");
    setVal("product-price", p?.price ?? "");
    setVal("product-image", p?.image || "");
    setVal("product-sku", p?.sku || "");
    setVal("product-stock", p?.stock ?? "");
    setVal("product-colour", p?.colour || "");
    setVal("product-size", p?.size || "");
    setVal("product-shipping", p?.shippingInfo || "");
    setVal("product-status", p?.status || "draft");

    renderVariants(p?.variants || []);
    updateImagePreview("product-image", "product-image-preview");
    document.getElementById("product-modal").classList.add("active");
  }

  function saveProduct(e) {
    e.preventDefault();
    const title = getVal("product-title");
    if (!title) {
      showNotice("Title is required.", "error");
      return;
    }

    const id = getVal("product-id") || uid("prod");
    const existing = state.products.findIndex((p) => p.id === id);
    const now = new Date().toISOString();

    const record = {
      id,
      type: "physical",
      title,
      slug: getVal("product-slug") || slugify(title),
      category: getVal("product-category"),
      shortDescription: getVal("product-short"),
      description: getVal("product-desc"),
      price: Number(getVal("product-price")) || 0,
      currency: "PKR",
      image: getVal("product-image") || "images/online-store.webp",
      status: getVal("product-status") || "draft",
      sku: getVal("product-sku"),
      stock: getVal("product-stock") === "" ? null : Number(getVal("product-stock")),
      colour: getVal("product-colour"),
      size: getVal("product-size"),
      shippingInfo: getVal("product-shipping"),
      variants: readVariants(),
      createdAt: existing >= 0 ? state.products[existing].createdAt : now,
      updatedAt: now
    };

    if (existing >= 0) state.products[existing] = record;
    else state.products.push(record);

    savePreview();
    closeModal("product-modal");
    renderProductsTable();
    renderDashboard();
    showNotice("Product saved in preview mode only. Backend required to publish to the live site.");
  }

  function toggleProductStatus(id) {
    const p = state.products.find((x) => x.id === id);
    if (!p) return;
    p.status = p.status === "published" ? "unpublished" : "published";
    p.updatedAt = new Date().toISOString();
    savePreview();
    renderProductsTable();
    renderDashboard();
    showNotice("Status updated in preview mode only.");
  }

  function deleteProduct(id) {
    if (!confirm("Delete this product from the preview catalogue?")) return;
    state.products = state.products.filter((p) => p.id !== id);
    savePreview();
    renderProductsTable();
    renderDashboard();
    showNotice("Product removed from preview.");
  }

  /* ---------- Variants & list editors ---------- */

  function renderVariants(variants) {
    const box = document.getElementById("variants-list");
    box.innerHTML = "";
    (variants.length ? variants : [{ id: uid("var"), name: "", colour: "", size: "", stock: "", sku: "" }]).forEach(
      (v) => addVariantRow(v)
    );
  }

  function addVariantRow(v) {
    const box = document.getElementById("variants-list");
    const row = document.createElement("div");
    row.className = "variant-row";
    row.innerHTML = `
      <input type="text" placeholder="Name" value="${escapeAttr(v.name || "")}" data-v="name">
      <input type="text" placeholder="Colour" value="${escapeAttr(v.colour || "")}" data-v="colour">
      <input type="text" placeholder="Size" value="${escapeAttr(v.size || "")}" data-v="size">
      <input type="number" placeholder="Stock" value="${v.stock != null ? v.stock : ""}" data-v="stock">
      <button type="button" class="btn btn-danger btn-sm" title="Remove">×</button>
      <input type="hidden" data-v="id" value="${escapeAttr(v.id || uid("var"))}">
      <input type="hidden" data-v="sku" value="${escapeAttr(v.sku || "")}">
    `;
    row.querySelector("button").addEventListener("click", () => row.remove());
    box.appendChild(row);
  }

  function readVariants() {
    return Array.from(document.querySelectorAll("#variants-list .variant-row"))
      .map((row) => {
        const get = (k) => row.querySelector(`[data-v="${k}"]`)?.value || "";
        const name = get("name");
        if (!name) return null;
        return {
          id: get("id") || uid("var"),
          name,
          colour: get("colour"),
          size: get("size"),
          stock: get("stock") === "" ? null : Number(get("stock")),
          sku: get("sku") || ""
        };
      })
      .filter(Boolean);
  }

  function renderListEditor(containerId, items) {
    const box = document.getElementById(containerId);
    box.innerHTML = "";
    (items.length ? items : [""]).forEach((text) => {
      const row = document.createElement("div");
      row.className = "list-editor-item";
      row.innerHTML = `<input type="text" value="${escapeAttr(text)}"><button type="button" class="btn btn-danger btn-sm">×</button>`;
      row.querySelector("button").addEventListener("click", () => row.remove());
      box.appendChild(row);
    });
  }

  function readListEditor(containerId) {
    return Array.from(document.querySelectorAll("#" + containerId + " input"))
      .map((i) => i.value.trim())
      .filter(Boolean);
  }

  function addListItem(containerId) {
    const box = document.getElementById(containerId);
    const row = document.createElement("div");
    row.className = "list-editor-item";
    row.innerHTML = `<input type="text" value=""><button type="button" class="btn btn-danger btn-sm">×</button>`;
    row.querySelector("button").addEventListener("click", () => row.remove());
    box.appendChild(row);
  }

  /* ---------- Categories ---------- */

  function renderCategories() {
    const tbody = document.getElementById("categories-tbody");
    if (!tbody) return;
    tbody.innerHTML = state.categories
      .map(
        (c) => `<tr>
        <td>${escapeHtml(c.name)}</td>
        <td>${escapeHtml(c.slug)}</td>
        <td>${(c.type || []).join(", ")}</td>
        <td><span class="status-pill ${c.status === "published" ? "status-published" : "status-draft"}">${c.status || "published"}</span></td>
      </tr>`
      )
      .join("");
  }

  /* ---------- Settings ---------- */

  function renderSettingsForm() {
    const s = state.settings || {};
    setVal("set-business", s.businessName || "");
    setVal("set-tagline", s.tagline || "");
    setVal("set-whatsapp", s.whatsappNumber || "");
    setVal("set-phone-display", s.phoneDisplay || "");
    setVal("set-currency", s.currency || "PKR");
    setVal("set-currency-symbol", s.currencySymbol || "Rs");
    setVal("set-facebook", s.social?.facebook || "");
    setVal("set-instagram", s.social?.instagram || "");
    setVal("set-tiktok", s.social?.tiktok || "");
    setVal("set-youtube", s.social?.youtube || "");
  }

  function saveSettings(e) {
    e.preventDefault();
    state.settings = {
      ...state.settings,
      businessName: getVal("set-business"),
      tagline: getVal("set-tagline"),
      whatsappNumber: getVal("set-whatsapp").replace(/[^0-9]/g, ""),
      phoneDisplay: getVal("set-phone-display"),
      currency: getVal("set-currency") || "PKR",
      currencySymbol: getVal("set-currency-symbol") || "Rs",
      social: {
        facebook: getVal("set-facebook"),
        instagram: getVal("set-instagram"),
        tiktok: getVal("set-tiktok"),
        youtube: getVal("set-youtube")
      },
      updatedAt: new Date().toISOString()
    };
    savePreview();
    showNotice("Settings saved in preview mode only. Backend required to update the live site.");
  }

  /* ---------- Media helpers ---------- */

  function updateImagePreview(inputId, previewId) {
    const path = getVal(inputId);
    const img = document.getElementById(previewId);
    if (!img) return;
    if (path) {
      img.src = path.startsWith("http") || path.startsWith("data:") ? path : "../" + path;
      img.classList.add("visible");
    } else {
      img.classList.remove("visible");
    }
  }

  function handleLocalImage(fileInputId, pathInputId, previewId) {
    const fileInput = document.getElementById(fileInputId);
    const file = fileInput?.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showNotice("Please select an image file.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      // Preview only – real upload requires backend
      setVal(pathInputId, file.name);
      const img = document.getElementById(previewId);
      if (img) {
        img.src = reader.result;
        img.classList.add("visible");
      }
      showNotice("Image preview only. Upload to the repository requires the secure backend.");
    };
    reader.readAsDataURL(file);
  }

  /* ---------- Utils ---------- */

  function getVal(id) {
    return document.getElementById(id)?.value?.trim() || "";
  }
  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val ?? "";
  }
  function closeModal(id) {
    document.getElementById(id)?.classList.remove("active");
  }
  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&")
      .replace(/</g, "<")
      .replace(/>/g, ">")
      .replace(/"/g, """);
  }
  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, "&#39;");
  }

  function fillCategorySelects() {
    const opts = state.categories
      .map((c) => `<option value="${escapeAttr(c.slug)}">${escapeHtml(c.name)}</option>`)
      .join("");
    ["course-category", "product-category"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = opts || `<option value="">No categories</option>`;
    });
  }

  /* ---------- Init ---------- */

  async function init() {
    // Nav
    document.querySelectorAll(".admin-nav button").forEach((btn) => {
      btn.addEventListener("click", () => showSection(btn.dataset.section));
    });

    document.getElementById("btn-add-course")?.addEventListener("click", () => openCourseModal(null));
    document.getElementById("btn-add-product")?.addEventListener("click", () => openProductModal(null));
    document.getElementById("course-form")?.addEventListener("submit", saveCourse);
    document.getElementById("product-form")?.addEventListener("submit", saveProduct);
    document.getElementById("settings-form")?.addEventListener("submit", saveSettings);

    document.getElementById("btn-add-outcome")?.addEventListener("click", () => addListItem("course-outcomes"));
    document.getElementById("btn-add-requirement")?.addEventListener("click", () => addListItem("course-requirements"));
    document.getElementById("btn-add-variant")?.addEventListener("click", () => addVariantRow({}));

    document.getElementById("course-image")?.addEventListener("input", () =>
      updateImagePreview("course-image", "course-image-preview")
    );
    document.getElementById("product-image")?.addEventListener("input", () =>
      updateImagePreview("product-image", "product-image-preview")
    );
    document.getElementById("course-image-file")?.addEventListener("change", () =>
      handleLocalImage("course-image-file", "course-image", "course-image-preview")
    );
    document.getElementById("product-image-file")?.addEventListener("change", () =>
      handleLocalImage("product-image-file", "product-image", "product-image-preview")
    );

    document.getElementById("course-title")?.addEventListener("input", (e) => {
      if (!getVal("course-id")) setVal("course-slug", slugify(e.target.value));
    });
    document.getElementById("product-title")?.addEventListener("input", (e) => {
      if (!getVal("product-id")) setVal("product-slug", slugify(e.target.value));
    });

    document.querySelectorAll("[data-close-modal]").forEach((b) => {
      b.addEventListener("click", () => closeModal(b.dataset.closeModal));
    });

    document.getElementById("mobile-toggle")?.addEventListener("click", () => {
      document.getElementById("admin-sidebar")?.classList.toggle("open");
    });

    // Load data
    const preview = loadPreview();
    try {
      const [cRes, pRes, catRes, sRes] = await Promise.all([
        fetch("../data/courses.json"),
        fetch("../data/products.json"),
        fetch("../data/categories.json"),
        fetch("../data/settings.json")
      ]);

      const coursesData = cRes.ok ? await cRes.json() : { courses: [] };
      const productsData = pRes.ok ? await pRes.json() : { products: [] };
      const catsData = catRes.ok ? await catRes.json() : { categories: [] };
      const settingsData = sRes.ok ? await sRes.json() : {};

      if (preview) {
        state.courses = preview.courses || coursesData.courses || [];
        state.products = preview.products || productsData.products || [];
        state.categories = preview.categories || catsData.categories || [];
        state.settings = preview.settings || settingsData;
        showNotice("Loaded local preview data. Live site is unchanged until the backend is connected.");
      } else {
        state.courses = coursesData.courses || [];
        state.products = productsData.products || [];
        state.categories = catsData.categories || [];
        state.settings = settingsData;
      }
    } catch (err) {
      console.error(err);
      if (preview) {
        state.courses = preview.courses || [];
        state.products = preview.products || [];
        state.categories = preview.categories || [];
        state.settings = preview.settings || {};
      }
      showNotice("Could not load live catalogue JSON. Using preview data if available.", "error");
    }

    fillCategorySelects();
    showSection("dashboard");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
