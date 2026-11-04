/* =========================================
   HIJABIAN - FOOTER & STICKY CONTACT BAR
========================================= */

(function () {
  const phoneNumber = "923224217059";

  const whatsappMessage = encodeURIComponent(
    "Assalam-o-Alaikum! I would like to know more about Hijabian."
  );

  const iconFacebook = `<svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M22 12.06C22 6.48 17.52 2 11.94 2S1.88 6.48 1.88 12.06c0 5.01 3.66 9.16 8.44 9.94v-7.03H7.9v-2.91h2.42V9.84c0-2.39 1.42-3.71 3.6-3.71 1.04 0 2.13.19 2.13.19v2.34h-1.2c-1.18 0-1.55.73-1.55 1.48v1.78h2.64l-.42 2.91h-2.22V22c4.78-.78 8.44-4.93 8.44-9.94z"/></svg>`;
  const iconInstagram = `<svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9zm9.75 1.25a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></svg>`;
  const iconYoutube = `<svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8zM9.75 15.5v-7L16 12l-6.25 3.5z"/></svg>`;
  const iconTiktok = `<svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M19.6 7.2a6.5 6.5 0 0 1-3.7-1.1v7.4a5.9 5.9 0 1 1-5.1-5.85V10a3.4 3.4 0 1 0 2.5 3.28V2h2.5a4 4 0 0 0 3.8 3.7v1.5z"/></svg>`;

  const footerHTML = `
    <!-- Main Footer -->
    <footer class="site-footer">

      <div class="footer-container">

        <div class="footer-brand">
          <a href="index.html" aria-label="Hijabian Home">
            <img
              src="images/Hijabian logo.webp"
              alt="Hijabian Logo"
              class="footer-logo"
            >
          </a>

          <p>
            Empowering women through education, practical skills
            and meaningful career opportunities.
          </p>

          <span class="footer-tagline">
            Learn. Earn. Empower.
          </span>

          <div class="footer-social-brands">
            <div class="footer-social-group">
              <p class="footer-social-label">Hijabian Studio</p>
              <p class="footer-social-note">Women fashion</p>
              <div class="footer-social-icons">
                <a href="https://www.facebook.com/hijabianstudio" target="_blank" rel="noopener noreferrer" aria-label="Hijabian Studio on Facebook">${iconFacebook}</a>
                <a href="https://www.instagram.com/hijabianstudio/" target="_blank" rel="noopener noreferrer" aria-label="Hijabian Studio on Instagram">${iconInstagram}</a>
                <a href="https://www.youtube.com/@hijabianstudio" target="_blank" rel="noopener noreferrer" aria-label="Hijabian Studio on YouTube">${iconYoutube}</a>
                <a href="https://www.tiktok.com/@hijabianstudio" target="_blank" rel="noopener noreferrer" aria-label="Hijabian Studio on TikTok">${iconTiktok}</a>
              </div>
            </div>

            <div class="footer-social-group">
              <p class="footer-social-label">Urdu E-Commerce Academy</p>
              <p class="footer-social-note">Professional courses</p>
              <div class="footer-social-icons">
                <a href="https://www.facebook.com/urduecommerceacademy" target="_blank" rel="noopener noreferrer" aria-label="Urdu E-Commerce Academy on Facebook">${iconFacebook}</a>
                <a href="https://www.instagram.com/urduecommerceacademy/" target="_blank" rel="noopener noreferrer" aria-label="Urdu E-Commerce Academy on Instagram">${iconInstagram}</a>
                <a href="https://www.youtube.com/@urduecommerceacademy" target="_blank" rel="noopener noreferrer" aria-label="Urdu E-Commerce Academy on YouTube">${iconYoutube}</a>
                <a href="https://www.tiktok.com/@urduecommerceacademy" target="_blank" rel="noopener noreferrer" aria-label="Urdu E-Commerce Academy on TikTok">${iconTiktok}</a>
              </div>
            </div>
          </div>
        </div>

        <div class="footer-links">
          <h3>Explore</h3>
          <a href="index.html">Home</a>
          <a href="courses.html">Explore Courses</a>
          <a href="earn-with-us.html">Work With Us</a>
          <a href="earn-with-us.html">Affiliate Programme</a>
          <a href="learn-and-earn.html">Learn & Earn</a>
        </div>

        <div class="footer-links">
          <h3>About Hijabian</h3>
          <a href="about.html">Our Mission</a>
          <a href="earn-with-us.html">Become an Instructor</a>
          <a href="contact.html">Contact Us</a>
        </div>

        <div class="footer-links">
          <h3>Legal</h3>
          <a href="privacy-policy.html">Privacy Policy</a>
          <a href="refund-return-exchange-policy.html">Refund & Return Policy</a>
          <a href="terms-of-service.html">Terms of Service</a>
        </div>

        <div class="footer-contact">
          <h3>Get in Touch</h3>

          <a href="tel:+${phoneNumber}">
            +${phoneNumber}
          </a>

          <a
            href="https://wa.me/${phoneNumber}?text=${whatsappMessage}"
            target="_blank"
            rel="noopener noreferrer"
          >
            Chat with us on WhatsApp
          </a>
        </div>

      </div>

      <div class="footer-bottom">
        <p>
          &copy; ${new Date().getFullYear()} Hijabian.
          All rights reserved.
        </p>

        <p>Learn. Earn. Empower.</p>
      </div>

    </footer>

    <!-- Sticky Bottom Contact Bar -->
    <div class="sticky-contact-bar" role="group" aria-label="Contact Hijabian">

      <a
        href="https://wa.me/${phoneNumber}?text=${whatsappMessage}"
        class="sticky-whatsapp-button"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contact Hijabian on WhatsApp"
      >
        <span class="contact-button-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12.04 2C6.58 2 2.15 6.4 2.15 11.84c0 1.96.52 3.86 1.5 5.54L2 22l4.78-1.55a10 10 0 0 0 5.26 1.47h.01c5.46 0 9.89-4.4 9.89-9.84C21.94 6.4 17.5 2 12.04 2zm5.78 13.95c-.24.68-1.4 1.24-1.93 1.32-.5.08-1.13.11-1.82-.11-.42-.14-.96-.31-1.65-.61-2.9-1.25-4.78-4.18-4.93-4.38-.14-.2-1.18-1.57-1.18-3 0-1.42.74-2.12 1-2.41.26-.29.57-.36.76-.36h.55c.17 0 .41-.06.64.49.24.57.82 1.99.89 2.13.07.14.12.31.02.5-.1.2-.15.31-.29.48-.14.17-.3.37-.43.5-.14.14-.29.29-.12.56.17.28.74 1.22 1.59 1.98 1.1.97 2.02 1.28 2.3 1.42.29.14.45.12.62-.07.17-.2.71-.82.9-1.1.19-.29.38-.24.64-.14.26.1 1.67.79 1.96.93.29.14.48.21.55.33.07.12.07.69-.17 1.37z"/></svg>
        </span>
        <span>WhatsApp</span>
      </a>

      <a
        href="tel:+${phoneNumber}"
        class="sticky-call-button"
        aria-label="Call Hijabian"
      >
        <span class="contact-button-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.3 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1L6.6 10.8z"/></svg>
        </span>
        <span>Call Us</span>
      </a>

    </div>
  `;

  // Insert footer into the designated placeholder.
  const footerContainer = document.getElementById("site-footer");

  if (footerContainer) {
    footerContainer.innerHTML = footerHTML;
  } else {
    document.body.insertAdjacentHTML("beforeend", footerHTML);
  }

})();
