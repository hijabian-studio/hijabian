/* =========================================================
   HIJABIAN - CATALOGUE LOGIC
   Shared by courses.html and products.html
========================================================= */

(function () {
  "use strict";

  const CART_KEY = "hijabian_cart";
  const pageType = document.body.dataset.catalogue;

  let allItems = [];
  let categories = [];
  let settings = {};
  let activeCategory = "all";
  let searchQuery = "";

  function formatPrice(amount, currency) {
    const symbol = settings.currencySymbol || "Rs";
    return symbol + " " + Number(amount).toLocaleString("en-PK");
  }

  function dualPriceHtml(item) {
    const current = formatPrice(item.price, item.currency);
    if (item.originalPrice && Number(item.originalPrice) > Number(item.price)) {
      return '<div class="card-price dual"><span class="price-current">' + current + '</span><span class="price-original">' + formatPrice(item.originalPrice, item.currency) + '</span></div>';
    }
    return '<div class="card-price">' + current + '</div>';
  }

  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; }
  }

  function updateHeaderBadge() {
    const badge = document.getElementById("cart-badge");
    if (!badge) return;
    const count = getCart().reduce(function (sum, item) { return sum + (item.quantity || 0); }, 0);
    badge.textContent = count > 0 ? String(count) : "";
    badge.setAttribute("data-count", String(count));
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateHeaderBadge();
  }

  function showToast(message) {
    var toast = document.getElementById("hijabian-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "hijabian-toast";
      toast.className = "toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () { toast.classList.remove("show"); }, 2600);
  }

  function categoryName(slug) {
    var cat = categories.find(function (c) { return c.slug === slug; });
    return cat ? cat.name : slug;
  }

  function addToCart(item, variantId) {
    var cart = getCart();
    var lineId = item.id;
    var title = item.title;
    var price = item.price;
    var image = item.image;
    var meta = {};
    if (item.type === "physical" && variantId) {
      var variant = (item.variants || []).find(function (v) { return v.id === variantId; });
      if (variant) {
        lineId = item.id + "__" + variant.id;
        title = item.title + " (" + variant.name + ")";
        meta = { colour: variant.colour, size: variant.size, sku: variant.sku };
      }
    }
    if (item.type === "course") {
      meta = { duration: item.duration, startDate: item.startDate, platform: item.platform, live: true };
    }
    var existing = cart.find(function (c) { return c.lineId === lineId; });
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        lineId: lineId,
        id: item.id,
        type: item.typeitem.type,
        title: title,
        price: price,
        currency: item.currency || "PKR",
        image: image,
        quantity: 1,
        meta: meta
      });
    }
    saveCart(cart);
    showToast("Added to cart");
  }

  function renderFilters() {
    var container = document.getElementById("category-filters");
    if (!container) return;
    var relevant = categories.filter(function (c) {
      if (pageType === "courses") return c.type.indexOf("course") !== -1;
      return c.type.indexOf("product") !== -1;
    });
    var html = '<button class="filter-btn active" data-category="all">All</button>';
    relevant.forEach(function (c) {
      html += '<button class="filter-btn" data-category="' + c.slug + '">' + c.name + '</button>';
    });
    container.innerHTML = html;
    container.querySelectorAll(".filter-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        container.querySelectorAll(".filter-btn").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        activeCategory = btn.dataset.category;
        renderGrid();
      });
    });
  }

  function getFilteredItems() {
    return allItems.filter(function (item) {
      if (item.status !== "published") return false;
      if (pageType === "courses" && item.registrationStatus !== "open") return false;
      if (pageType === "products" && item.stock !== undefined && item.stock <= 0) return false;
      if (activeCategory !== "all" && item.category !== activeCategory) return false;
      if (searchQuery) {
        var q = searchQuery.toLowerCase();
        var hay = (item.title + " " + item.shortDescription + " " + (item.description || "")).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  function renderCourseCard(item) {
    return '<article class="catalogue-card" data-id="' + item.id + '">' +
      '<div class="catalogue-card-image">' +
        '<img src="' + item.image + '" alt="' + item.title + '" loading="lazy">' +
        '<span class="card-badge live">Live Online</span>' +
      '</div>' +
      '<div class="catalogue-card-body">' +
        '<div class="card-category">' + categoryName(item.category) + '</div>' +
        '<h3>' + item.title + '</h3>' +
        '<p class="card-desc">' + item.shortDescription + '</p>' +
        '<div class="card-meta">' +
          '<span>' + (item.duration || '') + '</span>' +
          '<span>Starts ' + (item.startDate || 'TBA') + '</span>' +
          '<span>' + (item.platform || 'Live') + '</span>' +
        '</div>' +
        dualPriceHtml(item) +
        '<div class="card-actions">' +
          '<button class="secondary-btn btn-details" data-id="' + item.id + '">Details</button>' +
          '<button class="primary-btn btn-add" data-id="' + item.id + '">Add to Cart</button>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function renderProductCard(item) {
    return '<article class="catalogue-card" data-id="' + item.id + '">' +
      '<div class="catalogue-card-image">' +
        '<img src="' + item.image + '" alt="' + item.title + '" loading="lazy">' +
        '<span class="card-badge">Product</span>' +
      '</div>' +
      '<div class="catalogue-card-body">' +
        '<div class="card-category">' + categoryName(item.category) + '</div>' +
        '<h3>' + item.title + '</h3>' +
        '<p class="card-desc">' + item.shortDescription + '</p>' +
        '<div class="card-meta">' +
          (item.stock !== undefined ? '<span>' + item.stock + ' in stock</span>' : '') +
          (item.colour ? '<span>' + item.colour + '</span>' : '') +
        '</div>' +
        '<div class="card-price">' + formatPrice(item.price, item.currency) + '</div>' +
        '<div class="card-actions">' +
          '<button class="secondary-btn btn-details" data-id="' + item.id + '">Details</button>' +
          '<button class="primary-btn btn-add" data-id="' + item.id + '">Add to Cart</button>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function renderGrid() {
    var grid = document.getElementById("catalogue-grid");
    var empty = document.getElementById("empty-state");
    if (!grid) return;
    var items = getFilteredItems();
    if (items.length === 0) {
      grid.innerHTML = "";
      if (empty) empty.style.display = "block";
      return;
    }
    if (empty) empty.style.display = "none";
    grid.innerHTML = items.map(function (item) {
      return pageType === "courses" ? renderCourseCard(item) : renderProductCard(item);
    }).join("");
    grid.querySelectorAll(".btn-details").forEach(function (btn) {
      btn.addEventListener("click", function () { openModal(btn.dataset.id); });
    });
    grid.querySelectorAll(".btn-add").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var item = allItems.find(function (i) { return i.id === btn.dataset.id; });
        if (!item) return;
        if (item.type === "physical" && item.variants && item.variants.length > 0) openModal(item.id);
        else addToCart(item);
      });
    });
  }

  function openModal(id) {
    var item = allItems.find(function (i) { return i.id === id; });
    if (!item) return;
    var overlay = document.getElementById("catalogue-modal");
    var content = document.getElementById("modal-content");
    if (!overlay || !content) return;
    var metaHtml = "";
    var listsHtml = "";
    var variantHtml = "";
    if (item.type === "course") {
      metaHtml =
        '<div><strong>Duration</strong>' + (item.duration || '—') + '</div>' +
        '<div><strong>Start Date</strong>' + (item.startDate || 'TBA') + '</div>' +
        '<div><strong>Schedule</strong>' + (item.schedule || '—') + '</div>' +
        '<div><strong>Platform</strong>' + (item.platform || 'Live online') + '</div>' +
        '<div><strong>Instructor</strong>' + (item.instructor || '—') + '</div>' +
        '<div><strong>Seats</strong>' + (item.availableSeats != null ? item.availableSeats + ' available' : '—') + '</div>';
      if (item.learningOutcomes && item.learningOutcomes.length) {
        listsHtml += '<h4 class="modal-section-title">Learning Outcomes</h4><ul class="modal-list">' +
          item.learningOutcomes.map(function (o) { return '<li>' + o + '</li>'; }).join('') + '</ul>';
      }
      if (item.requirements && item.requirements.length) {
        listsHtml += '<h4 class="modal-section-title">Requirements</h4><ul class="modal-list">' +
          item.requirements.map(function (o) { return '<li>' + o + '</li>'; }).join('') + '</ul>';
      }
      listsHtml += '<p style="margin-top:16px;font-size:0.9rem;color:var(--rose-dark);font-weight:600;">This is a LIVE online class conducted via ' +
        (item.platform || 'Zoom / Google Meet') + '. It is not a recorded course.</p>';
    }
    if (item.type === "physical") {
      metaHtml =
        '<div><strong>SKU</strong>' + (item.sku || '—') + '</div>' +
        '<div><strong>Stock</strong>' + (item.stock != null ? item.stock : '—') + '</div>' +
        '<div><strong>Colour</strong>' + (item.colour || '—') + '</div>' +
        '<div><strong>Size</strong>' + (item.size || '—') + '</div>';
      if (item.shippingInfo) {
        listsHtml += '<h4 class="modal-section-title">Shipping</h4><p style="color:var(--text-light);font-size:0.92rem;">' + item.shippingInfo + '</p>';
      }
      if (item.variants && item.variants.length > 0) {
        variantHtml = '<div class="variant-selector"><label for="variant-select">Select option</label><select id="variant-select">' +
          item.variants.map(function (v) {
            return '<option value="' + v.id + '">' + v.name + (v.stock != null ? ' (' + v.stock + ' left)' : '') + '</option>';
          }).join('') + '</select></div>';
      }
    }
    var priceBlock = item.type === "course"
      ? dualPriceHtml(item).replace('card-price', 'modal-price')
      : '<div class="modal-price">' + formatPrice(item.price, item.currency) + '</div>';
    content.innerHTML =
      '<button class="modal-close" id="modal-close" aria-label="Close">&times;</button>' +
      '<img class="modal-image" src="' + item.image + '" alt="' + item.title + '">' +
      '<div class="modal-body">' +
        '<div class="card-category">' + categoryName(item.category) + '</div>' +
        '<h2>' + item.title + '</h2>' +
        priceBlock +
        '<div class="modal-meta">' + metaHtml + '</div>' +
        '<div class="modal-description">' + (item.description || item.shortDescription) + '</div>' +
        listsHtml +
        variantHtml +
        '<div class="modal-actions"><button class="primary-btn" id="modal-add-btn">Add to Cart</button></div>' +
      '</div>';
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
    document.getElementById("modal-close").addEventListener("click", closeModal);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) closeModal(); });
    document.getElementById("modal-add-btn").addEventListener("click", function () {
      var variantId = null;
      var select = document.getElementById("variant-select");
      if (select) variantId = select.value;
      addToCart(item, variantId);
      closeModal();
    });
  }

  function closeModal() {
    var overlay = document.getElementById("catalogue-modal");
    if (overlay) overlay.classList.remove("active");
    document.body.style.overflow = "";
  }

  async function init() {
    var loading = document.getElementById("loading-state");
    try {
      var results = await Promise.all([
        fetch("data/courses.json"),
        fetch("data/products.json"),
        fetch("data/categories.json"),
        fetch("data/settings.json")
      ]);
      var coursesRes = results[0], productsRes = results[1], catsRes = results[2], settingsRes = results[3];
      if (!coursesRes.ok || !productsRes.ok || !catsRes.ok || !settingsRes.ok) {
        throw new Error("Failed to load catalogue data");
      }
      var coursesData = await coursesRes.json();
      var productsData = await productsRes.json();
      var catsData = await catsRes.json();
      settings = await settingsRes.json();
      categories = catsData.categories || [];
      var courseList = coursesData.courses || [];
      if (pageType === "courses" && courseList.length < 50) {
        var partSlugs = ["freelancing","digital-marketing","graphic-design","content-writing","ecommerce","web-development","ai-data","professional","vocational","online-teaching"];
        var partResults = await Promise.all(partSlugs.map(function (s) {
          return fetch("data/courses-" + s + ".json").then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
        }));
        var seen = {};
        courseList.forEach(function (c) { seen[c.id] = true; });
        partResults.forEach(function (part) {
          if (part && Array.isArray(part.courses)) {
            part.courses.forEach(function (c) {
              if (!seen[c.id]) {
                courseList.push(c);
                seen[c.id] = true;
              }
            });
          }
        });
      }
      if (pageType === "courses") {
        allItems = courseList.map(function (c) { var o = Object.assign({}, c); o.type = "course"; return o; });
      } else {
        allItems = (productsData.products || []).map(function (p) { var o = Object.assign({}, p); o.type = "physical"; return o; });
      }
      if (loading) loading.style.display = "none";
      renderFilters();
      renderGrid();
      updateHeaderBadge();
      var searchInput = document.getElementById("catalogue-search");
      if (searchInput) {
        searchInput.addEventListener("input", function (e) {
          searchQuery = e.target.value.trim();
          renderGrid();
        });
      }
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeModal();
      });
    } catch (err) {
      console.error(err);
      if (loading) loading.innerHTML = "<p>Unable to load catalogue. Please refresh the page.</p>";
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
