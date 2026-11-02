/* =========================================================
   HIJABIAN - CATALOGUE LOGIC
   Shared by courses.html and products.html
========================================================= */

(function () {
  "use strict";

  const CART_KEY = "hijabian_cart";
  const pageType = document.body.dataset.catalogue; // "courses" | "products"

  let allItems = [];
  let categories = [];
  let settings = {};
  let activeCategory = "all";
  let searchQuery = "";

  /* ---------- Utilities ---------- */

  function formatPrice(amount, currency) {
    const symbol = settings.currencySymbol || "Rs";
    return symbol + " " + Number(amount).toLocaleString("en-PK");
  }

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function showToast(message) {
    let toast = document.getElementById("hijabian-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "hijabian-toast";
      toast.className = "toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function categoryName(slug) {
    const cat = categories.find((c) => c.slug === slug);
    return cat ? cat.name : slug;
  }

  /* ---------- Cart ---------- */

  function addToCart(item, variantId) {
    const cart = getCart();
    let lineId = item.id;
    let title = item.title;
    let price = item.price;
    let image = item.image;
    let meta = {};

    if (item.type === "physical" && variantId) {
      const variant = (item.variants || []).find((v) => v.id === variantId);
      if (variant) {
        lineId = item.id + "__" + variant.id;
        title = item.title + " (" + variant.name + ")";
        meta = { colour: variant.colour, size: variant.size, sku: variant.sku };
      }
    }

    if (item.type === "course") {
      meta = {
        duration: item.duration,
        startDate: item.startDate,
        platform: item.platform,
        live: true
      };
    }

    const existing = cart.find((c) => c.lineId === lineId);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        lineId,
        id: item.id,
        type: item.type,
        title,
        price,
        currency: item.currency || "PKR",
        image,
        quantity: 1,
        meta
      });
    }

    saveCart(cart);
    showToast("Added to cart");
  }

  /* ---------- Rendering ---------- */

  function renderFilters() {
    const container = document.getElementById("category-filters");
    if (!container) return;

    const relevant = categories.filter((c) => {
      if (pageType === "courses") return c.type.includes("course");
      return c.type.includes("product");
    });

    let html = `<button class="filter-btn active" data-category="all">All</button>`;
    relevant.forEach((c) => {
      html += `<button class="filter-btn" data-category="${c.slug}">${c.name}</button>`;
    });
    container.innerHTML = html;

    container.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        container.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        activeCategory = btn.dataset.category;
        renderGrid();
      });
    });
  }

  function getFilteredItems() {
    return allItems.filter((item) => {
      if (item.status !== "published") return false;

      if (pageType === "courses") {
        if (item.registrationStatus !== "open") return false;
      }
      if (pageType === "products") {
        if (item.stock !== undefined && item.stock <= 0) return false;
      }

      if (activeCategory !== "all" && item.category !== activeCategory) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const hay = (item.title + " " + item.shortDescription + " " + (item.description || "")).toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }

  function renderCourseCard(item) {
    return `
      <article class="catalogue-card" data-id="${item.id}">
        <div class="catalogue-card-image">
          <img src="${item.image}" alt="${item.title}" loading="lazy">
          <span class="card-badge live">Live Online</span>
        </div>
        <div class="catalogue-card-body">
          <div class="card-category">${categoryName(item.category)}</div>
          <h3>${item.title}</h3>
          <p class="card-desc">${item.shortDescription}</p>
          <div class="card-meta">
            <span>${item.duration || ""}</span>
            <span>Starts ${item.startDate || "TBA"}</span>
            <span>${item.platform || "Live"}</span>
          </div>
          <div class="card-price">${formatPrice(item.price, item.currency)}</div>
          <div class="card-actions">
            <button class="secondary-btn btn-details" data-id="${item.id}">Details</button>
            <button class="primary-btn btn-add" data-id="${item.id}">Add to Cart</button>
          </div>
        </div>
      </article>`;
  }

  function renderProductCard(item) {
    return `
      <article class="catalogue-card" data-id="${item.id}">
        <div class="catalogue-card-image">
          <img src="${item.image}" alt="${item.title}" loading="lazy">
          <span class="card-badge">Product</span>
        </div>
        <div class="catalogue-card-body">
          <div class="card-category">${categoryName(item.category)}</div>
          <h3>${item.title}</h3>
          <p class="card-desc">${item.shortDescription}</p>
          <div class="card-meta">
            ${item.stock !== undefined ? `<span>${item.stock} in stock</span>` : ""}
            ${item.colour ? `<span>${item.colour}</span>` : ""}
          </div>
          <div class="card-price">${formatPrice(item.price, item.currency)}</div>
          <div class="card-actions">
            <button class="secondary-btn btn-details" data-id="${item.id}">Details</button>
            <button class="primary-btn btn-add" data-id="${item.id}">Add to Cart</button>
          </div>
        </div>
      </article>`;
  }

  function renderGrid() {
    const grid = document.getElementById("catalogue-grid");
    const empty = document.getElementById("empty-state");
    if (!grid) return;

    const items = getFilteredItems();

    if (items.length === 0) {
      grid.innerHTML = "";
      if (empty) empty.style.display = "block";
      return;
    }

    if (empty) empty.style.display = "none";

    grid.innerHTML = items
      .map((item) => (pageType === "courses" ? renderCourseCard(item) : renderProductCard(item)))
      .join("");

    grid.querySelectorAll(".btn-details").forEach((btn) => {
      btn.addEventListener("click", () => openModal(btn.dataset.id));
    });

    grid.querySelectorAll(".btn-add").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = allItems.find((i) => i.id === btn.dataset.id);
        if (!item) return;
        if (item.type === "physical" && item.variants && item.variants.length > 0) {
          openModal(item.id); // force variant selection
        } else {
          addToCart(item);
        }
      });
    });
  }

  /* ---------- Modal ---------- */

  function openModal(id) {
    const item = allItems.find((i) => i.id === id);
    if (!item) return;

    const overlay = document.getElementById("catalogue-modal");
    const content = document.getElementById("modal-content");
    if (!overlay || !content) return;

    let metaHtml = "";
    let listsHtml = "";
    let variantHtml = "";

    if (item.type === "course") {
      metaHtml = `
        <div><strong>Duration</strong>${item.duration || "—"}</div>
        <div><strong>Start Date</strong>${item.startDate || "TBA"}</div>
        <div><strong>Schedule</strong>${item.schedule || "—"}</div>
        <div><strong>Platform</strong>${item.platform || "Live online"}</div>
        <div><strong>Instructor</strong>${item.instructor || "—"}</div>
        <div><strong>Seats</strong>${item.availableSeats != null ? item.availableSeats + " available" : "—"}</div>`;

      if (item.learningOutcomes && item.learningOutcomes.length) {
        listsHtml += `<h4 class="modal-section-title">Learning Outcomes</h4><ul class="modal-list">${item.learningOutcomes.map((o) => `<li>${o}</li>`).join("")}</ul>`;
      }
      if (item.requirements && item.requirements.length) {
        listsHtml += `<h4 class="modal-section-title">Requirements</h4><ul class="modal-list">${item.requirements.map((o) => `<li>${o}</li>`).join("")}</ul>`;
      }

      listsHtml += `<p style="margin-top:16px;font-size:0.9rem;color:var(--rose-dark);font-weight:600;">This is a LIVE online class conducted via ${item.platform || "Zoom / Google Meet"}. It is not a recorded course.</p>`;
    }

    if (item.type === "physical") {
      metaHtml = `
        <div><strong>SKU</strong>${item.sku || "—"}</div>
        <div><strong>Stock</strong>${item.stock != null ? item.stock : "—"}</div>
        <div><strong>Colour</strong>${item.colour || "—"}</div>
        <div><strong>Size</strong>${item.size || "—"}</div>`;

      if (item.shippingInfo) {
        listsHtml += `<h4 class="modal-section-title">Shipping</h4><p style="color:var(--text-light);font-size:0.92rem;">${item.shippingInfo}</p>`;
      }

      if (item.variants && item.variants.length > 0) {
        variantHtml = `
          <div class="variant-selector">
            <label for="variant-select">Select option</label>
            <select id="variant-select">
              ${item.variants.map((v) => `<option value="${v.id}">${v.name}${v.stock != null ? " (" + v.stock + " left)" : ""}</option>`).join("")}
            </select>
          </div>`;
      }
    }

    content.innerHTML = `
      <button class="modal-close" id="modal-close" aria-label="Close">&times;</button>
      <img class="modal-image" src="${item.image}" alt="${item.title}">
      <div class="modal-body">
        <div class="card-category">${categoryName(item.category)}</div>
        <h2>${item.title}</h2>
        <div class="modal-price">${formatPrice(item.price, item.currency)}</div>
        <div class="modal-meta">${metaHtml}</div>
        <div class="modal-description">${item.description || item.shortDescription}</div>
        ${listsHtml}
        ${variantHtml}
        <div class="modal-actions">
          <button class="primary-btn" id="modal-add-btn">Add to Cart</button>
        </div>
      </div>`;

    overlay.classList.add("active");
    document.body.style.overflow = "hidden";

    document.getElementById("modal-close").addEventListener("click", closeModal);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });

    document.getElementById("modal-add-btn").addEventListener("click", () => {
      let variantId = null;
      const select = document.getElementById("variant-select");
      if (select) variantId = select.value;
      addToCart(item, variantId);
      closeModal();
    });
  }

  function closeModal() {
    const overlay = document.getElementById("catalogue-modal");
    if (overlay) overlay.classList.remove("active");
    document.body.style.overflow = "";
  }

  /* ---------- Init ---------- */

  async function init() {
    const loading = document.getElementById("loading-state");
    try {
      const [coursesRes, productsRes, catsRes, settingsRes] = await Promise.all([
        fetch("data/courses.json"),
        fetch("data/products.json"),
        fetch("data/categories.json"),
        fetch("data/settings.json")
      ]);

      if (!coursesRes.ok || !productsRes.ok || !catsRes.ok || !settingsRes.ok) {
        throw new Error("Failed to load catalogue data");
      }

      const coursesData = await coursesRes.json();
      const productsData = await productsRes.json();
      const catsData = await catsRes.json();
      settings = await settingsRes.json();

      categories = catsData.categories || [];

      if (pageType === "courses") {
        allItems = (coursesData.courses || []).map((c) => ({ ...c, type: "course" }));
      } else {
        allItems = (productsData.products || []).map((p) => ({ ...p, type: "physical" }));
      }

      if (loading) loading.style.display = "none";

      renderFilters();
      renderGrid();

      const searchInput = document.getElementById("catalogue-search");
      if (searchInput) {
        searchInput.addEventListener("input", (e) => {
          searchQuery = e.target.value.trim();
          renderGrid();
        });
      }

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeModal();
      });
    } catch (err) {
      console.error(err);
      if (loading) {
        loading.innerHTML = "<p>Unable to load catalogue. Please refresh the page.</p>";
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
