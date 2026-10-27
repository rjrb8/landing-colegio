(function () {
  "use strict";

  var KEY = "liceo-simon-rodriguez-theme";
  var root = document.documentElement;
  var theme = "light";

  try {
    var saved = window.localStorage.getItem(KEY);
    if (saved === "light" || saved === "dark") {
      theme = saved;
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      theme = "dark";
    }
  } catch (error) {
    theme = "light";
  }

  root.setAttribute("data-bs-theme", theme);

  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", theme === "dark" ? "#0b1626" : "#0a2b5e");
  }
})();
