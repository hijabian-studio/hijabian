// HIJABIAN CTA MASTER SWITCH
const CTA_ENABLED = false;

if (CTA_ENABLED) {

    // KEEP ALL YOUR EXISTING CTA.JS CODE HERE

/* =========================================
   HIJABIAN - FLOATING CTA BANNER
========================================= */

(function () {

  const ctaHTML = `
    <aside class="floating-cta" id="hijabianFloatingCTA"
           aria-label="Explore Hijabian">

      <div class="floating-cta-content">

        <div class="floating-cta-text">
          <span class="floating-cta-label">YOUR JOURNEY STARTS HERE</span>

          <h3>Ready to Learn, Grow & Earn?</h3>

          <p>
            Discover skills and opportunities designed to empower women.
          </p>
        </div>

        <div style="display:flex;flex-wrap:wrap;gap:10px;">
          <a href="courses.html" class="floating-cta-button">
            Explore Courses <span aria-hidden="true">→</span>
          </a>
          <a href="earn-with-us.html" class="floating-cta-button" style="background:var(--navy);">
            Work With Us <span aria-hidden="true">→</span>
          </a>
        </div>

      </div>

      <button
        type="button"
        class="floating-cta-close"
        id="closeFloatingCTA"
        aria-label="Close banner"
      >
        &times;
      </button>

    </aside>
  `;

  function initializeCTA() {

    if (document.getElementById("hijabianFloatingCTA")) return;

    document.body.insertAdjacentHTML("beforeend", ctaHTML);

    const banner = document.getElementById("hijabianFloatingCTA");
    const closeButton = document.getElementById("closeFloatingCTA");

    if (closeButton && banner) {
      closeButton.addEventListener("click", function () {
        banner.classList.add("cta-hidden");
      });
    }

  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeCTA);
  } else {
    initializeCTA();
  }

})();
}
   
