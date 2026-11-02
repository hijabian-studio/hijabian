/* =========================================================
   HIJABIAN - WHATSAPP CHECKOUT
========================================================= */

(function () {
  "use strict";

  function getCart() {
    return window.HijabianCart ? window.HijabianCart.getCart() : [];
  }

  function formatPrice(amount) {
    if (window.HijabianCart && window.HijabianCart.formatPrice) {
      return window.HijabianCart.formatPrice(amount);
    }
    return "Rs " + Number(amount).toLocaleString("en-PK");
  }

  function buildMessage(customer) {
    const cart = getCart();
    const settings = (window.HijabianCart && window.HijabianCart.getSettings()) || {};
    const currency = settings.currency || "PKR";

    let total = 0;
    let lines = [];

    lines.push("*HIJABIAN ORDER REQUEST*");
    lines.push("────────────────────");
    lines.push("");

    cart.forEach((item, index) => {
      const lineTotal = item.price * item.quantity;
      total += lineTotal;

      const typeLabel = item.type === "course" ? "Live Course" : "Physical Product";

      lines.push("*" + (index + 1) + ". " + item.title + "*");
      lines.push("Type: " + typeLabel);

      if (item.meta) {
        if (item.meta.colour) lines.push("Colour: " + item.meta.colour);
        if (item.meta.size) lines.push("Size: " + item.meta.size);
        if (item.meta.sku) lines.push("SKU: " + item.meta.sku);
        if (item.meta.platform) lines.push("Platform: " + item.meta.platform);
        if (item.meta.startDate) lines.push("Start date: " + item.meta.startDate);
        if (item.meta.duration) lines.push("Duration: " + item.meta.duration);
      }

      lines.push("Qty: " + item.quantity);
      lines.push("Price: " + formatPrice(item.price) + " each");
      lines.push("Subtotal: " + formatPrice(lineTotal));
      lines.push("");
    });

    lines.push("────────────────────");
    lines.push("*Grand Total: " + formatPrice(total) + " (" + currency + ")*");
    lines.push("");
    lines.push("*Customer details*");
    lines.push("Name: " + customer.name);
    lines.push("Phone: " + customer.phone);
    lines.push("City: " + customer.city);

    if (customer.address) {
      lines.push("Delivery address: " + customer.address);
    }

    if (customer.notes) {
      lines.push("Notes: " + customer.notes);
    }

    lines.push("");
    lines.push("_This is an order request only. It is not a confirmed registration or payment. Hijabian will contact you to confirm availability and next steps._");

    return lines.join("\n");
  }

  function hasPhysicalItems() {
    return getCart().some((item) => item.type === "physical");
  }

  function initForm() {
    const form = document.getElementById("checkout-form");
    const addressGroup = document.getElementById("address-group");
    if (!form) return;

    // Show address field only when physical products are in cart
    if (addressGroup) {
      addressGroup.style.display = hasPhysicalItems() ? "block" : "none";
      const addressInput = document.getElementById("customer-address");
      if (addressInput) {
        addressInput.required = hasPhysicalItems();
      }
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      const cart = getCart();
      if (cart.length === 0) {
        alert("Your cart is empty.");
        return;
      }

      const name = document.getElementById("customer-name").value.trim();
      const phone = document.getElementById("customer-phone").value.trim();
      const city = document.getElementById("customer-city").value.trim();
      const address = (document.getElementById("customer-address") || {}).value || "";
      const notes = (document.getElementById("customer-notes") || {}).value || "";

      if (!name || !phone || !city) {
        alert("Please fill in your name, phone number and city.");
        return;
      }

      if (hasPhysicalItems() && !address.trim()) {
        alert("Please enter a delivery address for physical products.");
        return;
      }

      const message = buildMessage({
        name,
        phone,
        city,
        address: address.trim(),
        notes: notes.trim()
      });

      const settings = (window.HijabianCart && window.HijabianCart.getSettings()) || {};
      const number = (settings.whatsappNumber || "923224217059").replace(/[^0-9]/g, "");

      const url = "https://wa.me/" + number + "?text=" + encodeURIComponent(message);
      window.open(url, "_blank", "noopener,noreferrer");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initForm);
  } else {
    initForm();
  }
})();
