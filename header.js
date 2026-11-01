<header class="site-header">
  <div class="header-container">

    <!-- Logo -->
    <a href="index.html" class="site-logo" aria-label="Hijabian Home">
      <img
        src="images/Hijabian logo.webp"
        alt="Hijabian Logo"
        class="logo-image"
      >
    </a>

    <!-- Mobile Menu Toggle -->
    <button
      class="menu-toggle"
      id="menuToggle"
      aria-label="Open navigation menu"
      aria-expanded="false"
      aria-controls="mainNavigation"
      type="button"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>

    <!-- Navigation -->
    <nav class="main-navigation" id="mainNavigation" aria-label="Main navigation">

      <a href="index.html" class="nav-link">Home</a>

      <a href="courses.html" class="nav-link">Explore Courses</a>

      <a href="earn-with-us.html" class="nav-link">Work With Us</a>

      <a href="affiliate-program.html" class="nav-link">Affiliate Programme</a>

      <a href="become-instructor.html" class="nav-link">Become an Instructor</a>

      <a href="about.html" class="nav-link">About Us</a>

      <a href="contact.html" class="nav-link">Contact</a>

      <a href="courses.html" class="nav-cta">Start Learning</a>

    </nav>

  </div>
</header>

<script>
(function () {
  const menuToggle = document.getElementById("menuToggle");
  const navigation = document.getElementById("mainNavigation");

  if (!menuToggle || !navigation) return;

  menuToggle.addEventListener("click", function () {
    const isOpen = navigation.classList.toggle("active");

    menuToggle.classList.toggle("active", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation menu" : "Open navigation menu"
    );
  });

  // Close menu after selecting a navigation link
  navigation.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      navigation.classList.remove("active");
      menuToggle.classList.remove("active");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation menu");
    });
  });

  // Close menu when Escape is pressed
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      navigation.classList.remove("active");
      menuToggle.classList.remove("active");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation menu");
    }
  });
})();
</script>
