
(function () {\
\
&#x20; const prefooterHTML = \`\
\
&#x20;   \<section class="site-prefooter">\
\
&#x20;     \<div class="prefooter-container">\
\
&#x20;       \<!-- Brand Message -->\
&#x20;       \<div class="prefooter-brand">\
\
&#x20;         \<h2>Be Part of the \<span>Hijabian\</span> Community\</h2>\
\
&#x20;         \<p>\
&#x20;           A world of learning, skills and opportunities for women.\
&#x20;           Discover your potential, build your future and grow with us.\
&#x20;         \</p>\
\
&#x20;         \<a href="earn-with-us.html" class="prefooter-website">\
&#x20;           Explore Work With Us →\
&#x20;         \</a>\
\
&#x20;       \</div>\
\
\
&#x20;       \<!-- Policies -->\
&#x20;       \<div class="prefooter-policies">\
\
&#x20;         \<h3>Important Information\</h3>\
\
&#x20;         \<a href="privacy-policy.html">\
&#x20;           Privacy Policy\
&#x20;         \</a>\
\
&#x20;         \<a href="refund-return-exchange-policy.html">\
&#x20;           Refund, Return & Exchange Policy\
&#x20;         \</a>\
\
&#x20;         \<a href="earn-with-us.html">\
&#x20;           Work With Us\
&#x20;         \</a>\
\
&#x20;       \</div>\
\
\
&#x20;       \<!-- Social Media -->\
&#x20;       \<div class="prefooter-social">\
\
&#x20;         \<h3>Follow Hijabian\</h3>\
\
&#x20;         \<p>\
&#x20;           Connect with us and stay updated with our latest\
&#x20;           courses, opportunities and initiatives.\
&#x20;         \</p>\
\
&#x20;         \<div class="social-links">\
\
&#x20;           \<a\
&#x20;             href="https\://www\.facebook.com/hijabianstudio"\
&#x20;             target="\_blank"\
&#x20;             rel="noopener noreferrer"\
&#x20;             aria-label="Follow Hijabian on Facebook"\
&#x20;           \>\
&#x20;             Facebook\
&#x20;           \</a>\
\
&#x20;           \<a\
&#x20;             href="https\://www\.instagram.com/hijabianstudio/"\
&#x20;             target="\_blank"\
&#x20;             rel="noopener noreferrer"\
&#x20;             aria-label="Follow Hijabian on Instagram"\
&#x20;           \>\
&#x20;             Instagram\
&#x20;           \</a>\
\
&#x20;           \<a\
&#x20;             href="https\://www\.tiktok.com/@hijabianstudio"\
&#x20;             target="\_blank"\
&#x20;             rel="noopener noreferrer"\
&#x20;             aria-label="Follow Hijabian on TikTok"\
&#x20;           \>\
&#x20;             TikTok\
&#x20;           \</a>\
\
&#x20;           \<a\
&#x20;             href="https\://www\.youtube.com/@hijabianstudio"\
&#x20;             target="\_blank"\
&#x20;             rel="noopener noreferrer"\
&#x20;             aria-label="Subscribe to Hijabian on YouTube"\
&#x20;           \>\
&#x20;             YouTube\
&#x20;           \</a>\
\
&#x20;         \</div>\
\
&#x20;       \</div>\
\
&#x20;     \</div>\
\
&#x20;   \</section>\
\
&#x20; \`;\
\
\
&#x20; // Insert pre-footer into its placeholder\
&#x20; const prefooterContainer = document.getElementById("site-prefooter");\
\
&#x20; if (prefooterContainer) {\
&#x20;   prefooterContainer.innerHTML = prefooterHTML;\
&#x20; } else {\
&#x20;   console.warn("Hijabian pre-footer placeholder was not found.");\
&#x20; }\
\
}
