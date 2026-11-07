/* =========================================================
   HIJABIAN - WORK WITH US PAGE LOGIC
   Conditional fields + WhatsApp submission
========================================================= */

(function () {
  "use strict";

  /** WhatsApp number for receiving applications (Pakistan, no +) */
  const WHATSAPP_NUMBER = "923224217059";

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

      // Clear required state when hidden to avoid validating unused fields
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

  function val(id) {
    const el = document.getElementById(id);
    if (!el) return "";
    return String(el.value || "").trim();
  }

  function line(label, value) {
    if (!value) return "";
    return "*" + label + ":* " + value + "\n";
  }

  function buildWhatsAppMessage() {
    const opps = Array.from(
      form.querySelectorAll('input[name="opportunity[]"]:checked')
    ).map(function (cb) {
      // Prefer visible label text next to checkbox when available
      const label = cb.closest("label");
      if (label) {
        const text = label.textContent.replace(/\s+/g, " ").trim();
        if (text) return text;
      }
      return cb.value;
    });

    var msg = "*HIJABIAN — Work With Us Application*\n\n";
    msg += line("Full Name", val("fullName"));
    msg += line("Email", val("email"));
    msg += line("WhatsApp", val("whatsapp"));
    msg += line("Country", val("country"));
    msg += line("City", val("city"));
    msg += line("Time Zone", val("timezone"));
    msg += line("Opportunities", opps.join(", "));

    // Instructor
    if (val("teachSubjects") || val("teachExperience")) {
      msg += "\n*— Instructor details —*\n";
      msg += line("Subjects / skills", val("teachSubjects"));
      msg += line("Experience", val("teachExperience"));
      msg += line("Taught online before", val("taughtOnline"));
      msg += line("Comfortable with live classes", val("liveClasses"));
      msg += line("Teaching languages", val("teachLanguages"));
      msg += line("Portfolio", val("teachPortfolio"));
    }

    // Freelance
    if (val("services")) {
      msg += "\n*— Freelance / remote work —*\n";
      msg += line("Services", val("services"));
      msg += line("Tools", val("tools"));
      msg += line("Experience level", val("experienceLevel"));
      msg += line("Project-based availability", val("projectBased"));
      msg += line("Portfolio", val("freelancePortfolio"));
    }

    // Vocational / home-based
    if (val("productsServices")) {
      msg += "\n*— Vocational / home-based —*\n";
      msg += line("Products / services", val("productsServices"));
      msg += line("Runs home-based business", val("homeBusiness"));
    }

    // Partnership
    if (val("collaborationProposal")) {
      msg += "\n*— Partnership / collaboration —*\n";
      msg += line("Proposal", val("collaborationProposal"));
    }

    // Other
    if (val("otherDescription")) {
      msg += "\n*— Other interest —*\n";
      msg += line("Description", val("otherDescription"));
    }

    // Optional general fields if present
    msg += line("About / bio", val("about") || val("bio") || val("message"));
    msg += line("How did you hear about us", val("referralSource") || val("howHeard"));

    msg += "\n_Submitted from hijabian.com/earn-with-us.html_";
    return msg;
  }

  /* ---------- Submission via WhatsApp ---------- */
  let submitting = false;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (submitting) return;

    if (!validateForm()) {
      showStatus("error", "Please complete all required fields before submitting.");
      return;
    }

    submitting = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Opening WhatsApp…";
    }

    try {
      const message = buildWhatsAppMessage();
      const url =
        "https://wa.me/" +
        WHATSAPP_NUMBER +
        "?text=" +
        encodeURIComponent(message);

      showStatus(
        "success",
        "Your application is ready. WhatsApp will open so you can send it to HIJABIAN. Please press Send in WhatsApp to complete your application."
      );

      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      showStatus(
        "error",
        "Unable to open WhatsApp. Please contact HIJABIAN on WhatsApp at +92 322 4217059."
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
