/* =========================================================
   HIJABIAN - SHOPPING CART
========================================================= */

(function () {
  "use strict";

  const CART_KEY = "hijabian_cart";
  let settings = {};
  let catalogueMap = {}; // id -> latest item data for stock/seat checks

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateHeaderBadge();
  }

  function formatPrice(amount) {
    const symbol = settings.currencySymbol || "Rs";
    return symbol + " " + Number(amount).toLocaleString("en-PK");
  }

  function getCartCount() {
    return getCart().reduce((sum, item) => sum + (item.quantity || 0), 0);
  }

  function updateHeaderBadge() {
    const badge = document.getElementById("cart-badge");
    if (!badge) return;
    const count = getCartCount();
    badge.textContent = count > 0 ? String(count) : "";
    badge.setAttribute("data-count", String(count));
  }

  /* Expose for other scripts */
  window.HijabianCart = {
    getCart,
    saveCart,
    getCartCount,
    updateHeaderBadge,
    formatPrice: function (n) {
      return formatPrice(n);
    },
    getSettings: function () {
      return settings;
    }
  };

  function isAvailable(line) {
    const source = catalogueMap[line.id];
    if (!source) return { ok: true, reason: "" }; // allow if catalogue not loaded yet

    if (source.status && source.status !== "published") {
      return { ok: false, reason: "This item is no longer available." };
    }

    if (line.type === "course") {
      if (source.registrationStatus && source.registrationStatus !== "open") {
        return { ok: false, reason: "Registration is currently closed." };
      }
      if (source.availableSeats != null && source.availableSeats < line.quantity) {
        return {
          ok: false,
          reason: "Only " + source.availableSeats + " seat(s) remaining."
        };
      }
    }

    if (line.type === "physical") {
      if (source.stock != null && source.stock < line.quantity) {
        return {
          ok: false,
          reason: "Only " + source.stock + " in stock."
        };
      }
      // variant stock
      if (line.meta && line.meta.sku && source.variants) {
        const variant = source.variants.find(
          (v) => v.sku === line.meta.sku || v.id === (line.lineId || "").split("__")[1]
        );
        if (variant && variant.stock != null && variant.stock < line.quantity) {
          return {
            ok: false,
            reason: "Only " + variant.stock + " of this option left."
          };
        }
      }
    }

    return { ok: true, reason: "" };
  }

  function calcTotals(cart) {
    let subtotal = 0;
    let hasUnavailable = false;
    cart.forEach((line) => {
      const check = isAvailable(line);
      if (!check.ok) hasUnavailable = true;
      subtotal += line.price * line.quantity;
    });
    return { subtotal, grandTotal: subtotal, hasUnavailable };
  }

  function renderCart() {
    const cart = getCart();
    const emptyEl = document.getElementById("cart-empty");
    const layoutEl = document.getElementById("cart-layout");
    const itemsEl = document.getElementById("cart-items");
    const summaryEl = document.getElementById("cart-summary");

    if (!itemsEl) return;

    if (cart.length === 0) {
      if (emptyEl) emptyEl.style.display = "block";
      if (layoutEl) layoutEl.style.display = "none";
      return;
    }

    if (emptyEl) emptyEl.style.display = "none";
    if (layoutEl) layoutEl.style.display = "grid";

    itemsEl.innerHTML = cart
      .map((line) => {
        const check = isAvailable(line);
        const lineTotal = line.price * line.quantity;
        const typeLabel = line.type === "course" ? "Live Course" : "Physical Product";
        let metaParts = [];
        if (line.meta) {
          if (line.meta.colour) metaParts.push(line.meta.colour);
          if (line.meta.size) metaParts.push(line.meta.size);
          if (line.meta.platform) metaParts.push(line.meta.platform);
          if (line.meta.startDate) metaParts.push("Starts " + line.meta.startDate);
          if (line.meta.duration) metaParts.push(line.meta.duration);
        }

        return `
          <article class="cart-item ${check.ok ? "" : "unavailable"}" data-line-id="${line.lineId}">
            <img class="cart-item-image" src="${line.image}" alt="${line.title}" loading="lazy">
            <div class="cart-item-info">
              <div class="cart-item-type">${typeLabel}</div>
              <h3>${line.title}</h3>
              ${metaParts.length ? `<div class="cart-item-meta">${metaParts.join(" · ")}</div>` : ""}
              <div class="cart-item-price">${formatPrice(line.price)} each</div>
              ${check.ok ? "" : `<div class="cart-item-warning">${check.reason}</div>`}
            </div>
            <div class="cart-item-actions">
              <div class="qty-controls">
                <button type="button" class="qty-minus" aria-label="Decrease quantity">−</button>
                <span>${line.quantity}</span>
                <button type="button" class="qty-plus" aria-label="Increase quantity">+</button>
              </div>
              <div class="cart-item-line-total">${formatPrice(lineTotal)}</div>
              <button type="button" class="cart-item-remove">Remove</button>
            </div>
          </article>`;
      })
      .join("");

    // Bind controls
    itemsEl.querySelectorAll(".cart-item").forEach((el) => {
      const lineId = el.dataset.lineId;

      el.querySelector(".qty-minus").addEventListener("click", () => {
        changeQty(lineId, -1);
      });
      el.querySelector(".qty-plus").addEventListener("click", () => {
        changeQty(lineId, 1);
      });
      el.querySelector(".cart-item-remove").addEventListener("click", () => {
        removeLine(lineId);
      });
    });

    // Summary
    const totals = calcTotals(cart);
    if (summaryEl) {
      summaryEl.innerHTML = `
        <h2>Order Summary</h2>
        <div class="summary-row">
          <span>Items (${getCartCount()})</span>
          <span>${formatPrice(totals.subtotal)}</span>
        </div>
        <div class="summary-row total">
          <span>Total</span>
          <span>${formatPrice(totals.grandTotal)}</span>
        </div>
        ${
          totals.hasUnavailable
            ? `<p style="color:#b33;font-size:0.85rem;margin:12px 0 0;">Some items are unavailable. Please remove or adjust them before checkout.</p>`
            : ""
        }
        <button type="button" class="primary-btn" id="btn-proceed-checkout" ${totals.hasUnavailable ? "disabled" : ""}>
          Proceed to WhatsApp Order
        </button>
        <button type="button" class="secondary-btn" id="btn-empty-cart">Empty Cart</button>
        <a href="courses.html" class="secondary-btn" style="margin-top:10px;text-align:center;">Continue Shopping</a>
      `;

      document.getElementById("btn-empty-cart").addEventListener("click", () => {
        if (confirm("Remove all items from your cart?")) {
          saveCart([]);
          renderCart();
        }
      });

      const proceedBtn = document.getElementById("btn-proceed-checkout");
      if (proceedBtn && !totals.hasUnavailable) {
        proceedBtn.addEventListener("click", () => {
          const formSection = document.getElementById("checkout-section");
          if (formSection) {
            formSection.style.display = "block";
            formSection.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        });
      }
    }
  }

  function changeQty(lineId, delta) {
    const cart = getCart();
    const line = cart.find((c) => c.lineId === lineId);
    if (!line) return;

    const newQty = line.quantity + delta;
    if (newQty < 1) {
      removeLine(lineId);
      return;
    }

    // Soft stock check
    const source = catalogueMap[line.id];
    if (source) {
      if (line.type === "course" && source.availableSeats != null && newQty > source.availableSeats) {
        alert("Only " + source.availableSeats + " seat(s) available for this course.");
        return;
      }
      if (line.type === "physical" && source.stock != null && newQty > source.stock) {
        alert("Only " + source.stock + " in stock.");
        return;
      }
    }

    line.quantity = newQty;
    saveCart(cart);
    renderCart();
  }

  function removeLine(lineId) {
    const cart = getCart().filter((c) => c.lineId !== lineId);
    saveCart(cart);
    renderCart();
  }

  async function loadCatalogueForValidation() {
    try {
      const [coursesRes, productsRes, settingsRes] = await Promise.all([
        fetch("data/courses.json"),
        fetch("data/products.json"),
        fetch("data/settings.json")
      ]);

      if (settingsRes.ok) settings = await settingsRes.json();

      if (coursesRes.ok) {
        const data = await coursesRes.json();
        (data.courses || []).forEach((c) => {
          catalogueMap[c.id] = { ...c, type: "course" };
        });
      }
      if (productsRes.ok) {
        const data = await productsRes.json();
        (data.products || []).forEach((p) => {
          catalogueMap[p.id] = { ...p, type: "physical" };
        });
      }
    } catch (err) {
      console.warn("Could not refresh catalogue for stock checks", err);
    }
  }

  async function init() {
    updateHeaderBadge();

    // Only run full cart UI on cart.html
    if (!document.getElementById("cart-items")) return;

    await loadCatalogueForValidation();
    renderCart();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
