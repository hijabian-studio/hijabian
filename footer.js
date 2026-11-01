/* =========================================
   HIJABIAN - FOOTER & STICKY CONTACT BAR
========================================= */

(function () {
  const phoneNumber = "923224217059";

  const whatsappMessage = encodeURIComponent(
    "Assalam-o-Alaikum! I would like to know more about Hijabian."
  );

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
        </div>

        <div class="footer-links">
          <h3>Explore</h3>
          <a href="index.html">Home</a>
          <a href="courses.html">Explore Courses</a>
          <a href="earn-with-us.html">Work With Us</a>
          <a href="affiliate-program.html">Affiliate Programme</a>
        </div>

        <div class="footer-links">
          <h3>About Hijabian</h3>
          <a href="about.html">Our Mission</a>
          <a href="become-instructor.html">Become an Instructor</a>
          <a href="contact.html">Contact Us</a>
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
        <span class="contact-button-icon" aria-hidden="true">✉</span>
        <span>WhatsApp</span>
      </a>

      <a
        href="tel:+${phoneNumber}"
        class="sticky-call-button"
        aria-label="Call Hijabian"
      >
        <span class="contact-button-icon" aria-hidden="true">☎</span>
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
