/* =========================================================
   HIJABIAN - WORK WITH US PAGE LOGIC
   Conditional fields + Formspree-ready submission
========================================================= */

(function () {
  "use strict";

  /**
   * FORM BACKEND CONFIGURATION
   * ---------------------------
   * 1. Create a free form at https://formspree.io
   * 2. Replace YOUR_FORM_ID below with your Formspree form ID
   * 3. Optionally enable spam filtering and file attachments in Formspree dashboard
   * 4. Deploy this file — no other secrets required in frontend code
   */
  const FORMSPREE_ENDPOINT = "https://formspree.io/f/YOUR_FORM_ID";

  const form = document.getElementById("work-application-form");
  if (!form) return;

  const statusEl = document.getElementById("form-status");
  const submitBtn = document.getElementById("submit-btn");
  const opportunityError = document.getElementById("opportunity-error");
  const consentError = document.getElementById("consent-error");

  /* ---------- Smooth scroll for Apply buttons ---------- */
  document.querySelectorAll(".work-scroll-btn").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      const href = btn.getAttribute("href");
      if (href && href.startsWith("#")) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        // Pre-select opportunity if data-interest is present
        const interest = btn.getAttribute("data-interest");
        if (interest) {
          const checkbox = form.querySelector(
            'input[name="opportunity[]"][value="' + interest + '"]'
          );
          if (checkbox && !checkbox.checked) {
            checkbox.checked = true;
            checkbox.dispatchEvent(new Event("change", { bubbles: true }));
          }
        }
      }
    });
  });

  /* ---------- Conditional field visibility ---------- */
  function updateConditionalFields() {
    const selected = Array.from(
      form.querySelectorAll('input[name="opportunity[]"]:checked')
    ).map(function (cb) {
      return cb.getAttribute("data-conditional");
    });

    form.querySelectorAll(".conditional-block").forEach(function (block) {
      const key = block.getAttribute("data-show-when");
      const shouldShow = selected.indexOf(key) !== -1;
      block.hidden = !shouldShow;

      // Clear required state and values when hidden to avoid validating unused fields
      block.querySelectorAll("input, select, textarea").forEach(function (el) {
        if (!shouldShow) {
          el.removeAttribute("required");
          // Do not clear values so user does not lose data if they re-check
        }
      });
    });

    // Re-apply required attributes for visible conditional required fields
    if (selected.indexOf("instructor") !== -1) {
      setRequired("teachSubjects", true);
      setRequired("teachExperience", true);
    }
    if (selected.indexOf("freelance") !== -1) {
      setRequired("services", true);
    }
    if (selected.indexOf("vocational") !== -1) {
      setRequired("productsServices", true);
    }
    if (selected.indexOf("partnership") !== -1) {
      setRequired("collaborationProposal", true);
    }
    if (selected.indexOf("other") !== -1) {
      setRequired("otherDescription", true);
    }
  }

  function setRequired(id, required) {
    const el = document.getElementById(id);
    if (!el) return;
    if (required) el.setAttribute("required", "required");
    else el.removeAttribute("required");
  }

  form.querySelectorAll('input[name="opportunity[]"]').forEach(function (cb) {
    cb.addEventListener("change", updateConditionalFields);
  });

  updateConditionalFields();

  /* ---------- Validation helpers ---------- */
  function showStatus(type, message) {
    if (!statusEl) return;
    statusEl.hidden = false;
    statusEl.className = "form-status " + type;
    statusEl.textContent = message;
  }

  function hideStatus() {
    if (statusEl) {
      statusEl.hidden = true;
      statusEl.textContent = "";
    }
  }

  function validateForm() {
    let valid = true;
    hideStatus();
    if (opportunityError) opportunityError.hidden = true;
    if (consentError) consentError.hidden = true;

    // At least one opportunity
    const anyOpp = form.querySelectorAll('input[name="opportunity[]"]:checked').length > 0;
    if (!anyOpp) {
      if (opportunityError) opportunityError.hidden = false;
      valid = false;
    }

    // Consent
    const consent = document.getElementById("consent");
    if (consent && !consent.checked) {
      if (consentError) consentError.hidden = false;
      valid = false;
    }

    // Native required fields (including conditional ones currently required)
    if (!form.checkValidity()) {
      valid = false;
      // Trigger browser validation UI
      form.reportValidity();
    }

    return valid;
  }

  /* ---------- Submission ---------- */
  let submitting = false;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (submitting) return;

    if (!validateForm()) {
      showStatus("error", "Please complete all required fields before submitting.");
      return;
    }

    // Guard: endpoint not configured
    if (!FORMSPREE_ENDPOINT || FORMSPREE_ENDPOINT.indexOf("YOUR_FORM_ID") !== -1) {
      showStatus(
        "error",
        "Form is not yet connected to a submission service. Please contact HIJABIAN directly via WhatsApp or email while configuration is completed."
      );
      return;
    }

    submitting = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting…";
    }
    showStatus("loading", "Sending your application…");

    try {
      const formData = new FormData(form);

      // Collect selected opportunities as a single readable string
      const opps = Array.from(
        form.querySelectorAll('input[name="opportunity[]"]:checked')
      ).map(function (cb) {
        return cb.value;
      });
      formData.set("opportunities", opps.join(", "));

      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json"
        }
      });

      if (response.ok) {
        showStatus(
          "success",
          "Thank you for your interest in HIJABIAN! Your application has been submitted successfully. Our team will review your information and contact you if a suitable opportunity becomes available."
        );
        form.reset();
        updateConditionalFields();
      } else {
        let msg = "Something went wrong while submitting. Please try again or contact us via WhatsApp.";
        try {
          const data = await response.json();
          if (data && data.error) msg = data.error;
        } catch (err) {}
        showStatus("error", msg);
      }
    } catch (err) {
      showStatus(
        "error",
        "Unable to reach the submission service. Please check your connection or contact HIJABIAN via WhatsApp."
      );
    } finally {
      submitting = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Application";
      }
    }
  });
})();
