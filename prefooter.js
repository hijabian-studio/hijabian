/* =========================================
   HIJABIAN - PRE-FOOTER SECTION
========================================= */

(function () {

  const prefooterHTML = `

    <section class="site-prefooter">

      <div class="prefooter-container">

        <div class="prefooter-brand">

          <h2>Be Part of the <span>Hijabian</span> Community</h2>

          <p>
            A world of learning, skills and opportunities for women.
            Discover your potential, build your future and grow with us.
          </p>

          <a href="earn-with-us.html" class="prefooter-website">
            Explore Work With Us →
          </a>

        </div>

        <div class="prefooter-policies">

          <h3>Important Information</h3>

          <a href="privacy-policy.html">
            Privacy Policy
          </a>

          <a href="refund-return-exchange-policy.html">
            Refund, Return & Exchange Policy
          </a>

          <a href="earn-with-us.html">
            Work With Us
          </a>

        </div>

        <div class="prefooter-social">

          <h3>Follow Hijabian</h3>

          <p>
            Connect with us and stay updated with our latest
            courses, opportunities and initiatives.
          </p>

          <div class="social-links">

            <a href="https://www.facebook.com/hijabianstudio" target="_blank" rel="noopener noreferrer" aria-label="Follow Hijabian on Facebook">Facebook</a>
            <a href="https://www.instagram.com/hijabianstudio/" target="_blank" rel="noopener noreferrer" aria-label="Follow Hijabian on Instagram">Instagram</a>
            <a href="https://www.tiktok.com/@hijabianstudio" target="_blank" rel="noopener noreferrer" aria-label="Follow Hijabian on TikTok">TikTok</a>
            <a href="https://www.youtube.com/@hijabianstudio" target="_blank" rel="noopener noreferrer" aria-label="Subscribe to Hijabian on YouTube">YouTube</a>

          </div>

        </div>

      </div>

    </section>

  `;

  const prefooterContainer = document.getElementById("site-prefooter");

  if (prefooterContainer) {
    prefooterContainer.innerHTML = prefooterHTML;
  } else {
    console.warn("Hijabian pre-footer placeholder was not found.");
  }

})();
