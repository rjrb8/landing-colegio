(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var prefersReducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var THEME_KEY = "liceo-simon-rodriguez-theme";
  var THEME_COLORS = { light: "#0a2b5e", dark: "#0b1626" };

  function on(element, event, handler, options) {
    if (element) {
      element.addEventListener(event, handler, options);
    }
  }

  function byId(id) {
    return doc.getElementById(id);
  }

  /* ------------------------------------------------------------------
     Cargador inicial
     ------------------------------------------------------------------ */
  var pageLoader = byId("page-loader");
  var loadStart =
    window.performance && window.performance.now ? window.performance.now() : Date.now();
  var loadFinished = false;

  function finishLoading() {
    if (loadFinished) {
      return;
    }
    loadFinished = true;
    root.classList.add("is-ready");

    if (!pageLoader) {
      return;
    }

    pageLoader.classList.add("is-done");
    pageLoader.setAttribute("aria-hidden", "true");
    window.setTimeout(function () {
      if (pageLoader && pageLoader.parentNode) {
        pageLoader.parentNode.removeChild(pageLoader);
      }
    }, 600);
  }

  if (pageLoader) {
    var minLoaderTime = prefersReducedMotion ? 0 : 750;
    var scheduleFinish = function () {
      var now =
        window.performance && window.performance.now ? window.performance.now() : Date.now();
      window.setTimeout(finishLoading, Math.max(0, minLoaderTime - (now - loadStart)));
    };

    if (doc.readyState === "complete") {
      scheduleFinish();
    } else {
      window.addEventListener("load", scheduleFinish, { once: true });
    }
    window.setTimeout(finishLoading, 5000);
  } else {
    root.classList.add("is-ready");
  }

  /* ------------------------------------------------------------------
     Tema claro / oscuro
     ------------------------------------------------------------------ */
  var themeToggle = byId("theme-toggle");
  var themeMeta = doc.querySelector('meta[name="theme-color"]');

  function currentTheme() {
    return root.getAttribute("data-bs-theme") === "dark" ? "dark" : "light";
  }

  function paintThemeButton() {
    var isDark = currentTheme() === "dark";
    if (themeToggle) {
      themeToggle.setAttribute("aria-pressed", isDark ? "true" : "false");
      themeToggle.setAttribute(
        "aria-label",
        isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"
      );
    }
    if (themeMeta) {
      themeMeta.setAttribute("content", THEME_COLORS[isDark ? "dark" : "light"]);
    }
  }

  on(themeToggle, "click", function () {
    var next = currentTheme() === "dark" ? "light" : "dark";
    root.setAttribute("data-bs-theme", next);
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch (error) {
      /* Almacenamiento no disponible: el tema se mantiene solo en esta visita. */
    }
    paintThemeButton();
  });

  paintThemeButton();

  /* ------------------------------------------------------------------
     Aviso institucional (sin persistencia, por privacidad)
     ------------------------------------------------------------------ */
  var announcement = byId("announcement");
  on(byId("announcement-close"), "click", function () {
    if (announcement) {
      announcement.hidden = true;
    }
  });

  /* ------------------------------------------------------------------
     Barra de progreso, sombra de navegación y botón "volver arriba"
     ------------------------------------------------------------------ */
  var progressBar = byId("scroll-progress-bar");
  var siteNav = byId("site-nav");
  var toTop = byId("to-top");
  var scrollQueued = false;
  var scrollHooks = [];

  function updateScrollUI() {
    var top = window.pageYOffset || doc.documentElement.scrollTop || 0;
    var max = doc.documentElement.scrollHeight - window.innerHeight;

    if (progressBar) {
      var percent = max > 0 ? Math.min(100, (top / max) * 100) : 0;
      progressBar.style.width = percent + "%";
    }
    if (siteNav) {
      siteNav.classList.toggle("site-nav--scrolled", top > 8);
    }
    if (toTop) {
      toTop.classList.toggle("is-visible", top > 600);
    }
    scrollHooks.forEach(function (hook) {
      hook();
    });
    scrollQueued = false;
  }

  function requestScrollUI() {
    if (!scrollQueued) {
      scrollQueued = true;
      window.requestAnimationFrame(updateScrollUI);
    }
  }

  on(window, "scroll", requestScrollUI, { passive: true });
  on(window, "resize", requestScrollUI, { passive: true });
  updateScrollUI();

  on(toTop, "click", function () {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth"
    });
  });

  /* ------------------------------------------------------------------
     Menú móvil: cerrar al elegir una sección
     ------------------------------------------------------------------ */
  var menu = byId("menuPrincipal");
  var menuLinks = menu ? menu.querySelectorAll('a[href^="#"]') : [];

  function closeMenu() {
    if (!menu || !menu.classList.contains("show")) {
      return;
    }
    if (window.bootstrap && window.bootstrap.Collapse) {
      window.bootstrap.Collapse.getOrCreateInstance(menu, { toggle: false }).hide();
    }
  }

  function goToSection(link) {
    var target = doc.querySelector(link.getAttribute("href"));
    if (!target) {
      return;
    }
    target.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start"
    });
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, "", link.getAttribute("href"));
    }
  }

  Array.prototype.forEach.call(menuLinks, function (link) {
    on(link, "click", function (event) {
      if (!menu || !menu.classList.contains("show")) {
        closeMenu();
        return;
      }

      event.preventDefault();
      var done = false;
      var jump = function () {
        if (done) {
          return;
        }
        done = true;
        goToSection(link);
      };

      menu.addEventListener("hidden.bs.collapse", jump, { once: true });
      window.setTimeout(jump, 450);
      closeMenu();
    });
  });

  /* ------------------------------------------------------------------
     Sección activa en la navegación
     ------------------------------------------------------------------ */
  var navLinks = Array.prototype.slice.call(
    doc.querySelectorAll('#menuPrincipal .nav-link[href^="#"]')
  );

  function setActiveSection(id) {
    Array.prototype.forEach.call(navLinks, function (link) {
      var isActive = link.getAttribute("href") === "#" + id;
      link.classList.toggle("active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  var spySections = [];

  Array.prototype.forEach.call(navLinks, function (link) {
    var target = doc.querySelector(link.getAttribute("href"));
    if (target) {
      spySections.push(target);
    }
  });

  function updateActiveSection() {
    if (!spySections.length) {
      return;
    }

    var line = window.innerHeight * 0.35;
    var current = spySections[0];
    var atBottom =
      window.innerHeight + (window.pageYOffset || 0) >=
      doc.documentElement.scrollHeight - 4;

    if (atBottom) {
      current = spySections[spySections.length - 1];
    } else {
      spySections.forEach(function (section) {
        if (section.getBoundingClientRect().top <= line) {
          current = section;
        }
      });
    }

    setActiveSection(current.id);
  }

  /* ------------------------------------------------------------------
     Aparición progresiva de bloques
     ------------------------------------------------------------------ */
  var revealItems = Array.prototype.slice.call(doc.querySelectorAll("[data-reveal]"));

  function revealCheck() {
    if (!revealItems.length) {
      return;
    }
    var limit = window.innerHeight * 0.92;
    Array.prototype.forEach.call(revealItems, function (item) {
      if (item.classList.contains("is-visible")) {
        return;
      }
      if (item.getBoundingClientRect().top < limit) {
        item.classList.add("is-visible");
      }
    });
  }

  if (!prefersReducedMotion && revealItems.length) {
    Array.prototype.forEach.call(revealItems, function (item) {
      item.classList.add("reveal-init");
    });
    revealCheck();
  }

  scrollHooks.push(function () {
    revealCheck();
    updateActiveSection();
  });
  updateActiveSection();
  revealCheck();

  /* ------------------------------------------------------------------
     Cifras animadas
     ------------------------------------------------------------------ */
  var counters = Array.prototype.slice.call(doc.querySelectorAll("[data-count]"));

  function formatNumber(value) {
    try {
      return value.toLocaleString("es-VE");
    } catch (error) {
      return String(value);
    }
  }

  function animateCounter(element) {
    var target = parseInt(element.getAttribute("data-count"), 10);
    if (isNaN(target)) {
      return;
    }
    if (prefersReducedMotion) {
      element.textContent = formatNumber(target);
      return;
    }

    var duration = 1400;
    var startTime = null;

    function tick(now) {
      if (startTime === null) {
        startTime = now;
      }
      var progress = Math.min((now - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = formatNumber(Math.round(target * eased));
      if (progress < 1) {
        window.requestAnimationFrame(tick);
      }
    }

    window.requestAnimationFrame(tick);
  }

  if (counters.length) {
    if ("IntersectionObserver" in window) {
      var counterObserver = new IntersectionObserver(
        function (entries, observer) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              animateCounter(entry.target);
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.6 }
      );

      Array.prototype.forEach.call(counters, function (counter) {
        counterObserver.observe(counter);
      });
    } else {
      Array.prototype.forEach.call(counters, function (counter) {
        var value = parseInt(counter.getAttribute("data-count"), 10);
        if (!isNaN(value)) {
          counter.textContent = formatNumber(value);
        }
      });
    }
  }

  /* ------------------------------------------------------------------
     Año del pie de página
     ------------------------------------------------------------------ */
  var year = byId("year");
  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  /* ------------------------------------------------------------------
     Formulario de contacto (validación cliente + mailto)
     ------------------------------------------------------------------ */
  var form = byId("contact-form");

  if (form) {
    var messageField = byId("mensaje");
    var messageCount = byId("mensaje-count");
    var status = byId("form-status");

    var validators = {
      nombre: function (value) {
        if (value.length < 3) {
          return "Escribe tu nombre y apellido (mínimo 3 caracteres).";
        }
        if (value.length > 80) {
          return "El nombre no debe superar los 80 caracteres.";
        }
        return "";
      },
      correo: function (value) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
          return "Escribe un correo electrónico válido, por ejemplo nombre@correo.com.";
        }
        if (value.length > 120) {
          return "El correo no debe superar los 120 caracteres.";
        }
        return "";
      },
      telefono: function (value) {
        if (!value) {
          return "";
        }
        if (!/^[0-9+()\s-]{7,20}$/.test(value)) {
          return "Usa solo números, espacios, +, - o paréntesis (7 a 20 caracteres).";
        }
        return "";
      },
      asunto: function (value) {
        if (!value) {
          return "Selecciona un asunto para tu mensaje.";
        }
        return "";
      },
      mensaje: function (value) {
        if (value.length < 20) {
          return "El mensaje debe tener al menos 20 caracteres.";
        }
        if (value.length > 1200) {
          return "El mensaje no debe superar los 1200 caracteres.";
        }
        return "";
      },
      consentimiento: function () {
        var checkbox = byId("consentimiento");
        if (!checkbox || !checkbox.checked) {
          return "Debes autorizar el tratamiento de tus datos para continuar.";
        }
        return "";
      }
    };

    var fieldOrder = ["nombre", "correo", "telefono", "asunto", "mensaje", "consentimiento"];

    function fieldValue(name) {
      var field = byId(name);
      if (!field) {
        return "";
      }
      return String(field.value || "").trim();
    }

    function setFieldState(name, errorMessage) {
      var field = byId(name);
      var box = byId(name + "-error");
      if (!field) {
        return;
      }
      if (errorMessage) {
        field.classList.add("is-invalid");
        field.setAttribute("aria-invalid", "true");
        if (box) {
          box.textContent = errorMessage;
        }
      } else {
        field.classList.remove("is-invalid");
        field.removeAttribute("aria-invalid");
        if (box) {
          box.textContent = "";
        }
      }
    }

    function checkField(name) {
      var errorMessage = validators[name](fieldValue(name));
      setFieldState(name, errorMessage);
      return errorMessage;
    }

    function validateForm() {
      var firstInvalid = null;
      fieldOrder.forEach(function (name) {
        var errorMessage = checkField(name);
        if (errorMessage && firstInvalid === null) {
          firstInvalid = name;
        }
      });
      return firstInvalid;
    }

    Array.prototype.forEach.call(fieldOrder, function (name) {
      var field = byId(name);
      if (!field) {
        return;
      }
      var eventName = field.tagName === "SELECT" || field.type === "checkbox" ? "change" : "input";
      on(field, eventName, function () {
        if (field.classList.contains("is-invalid") || field.getAttribute("aria-invalid")) {
          checkField(name);
        }
      });
      on(field, "blur", function () {
        checkField(name);
      });
    });

    function updateMessageCount() {
      if (messageCount && messageField) {
        messageCount.textContent = String(messageField.value.length);
      }
    }

    on(messageField, "input", updateMessageCount);
    updateMessageCount();

    on(form, "submit", function (event) {
      event.preventDefault();

      var firstInvalid = validateForm();

      if (firstInvalid) {
        if (status) {
          status.className = "form-status is-error";
          status.textContent = "Revisa los campos marcados antes de continuar.";
        }
        var field = byId(firstInvalid);
        if (field) {
          field.focus();
        }
        return;
      }

      var nombre = fieldValue("nombre");
      var correo = fieldValue("correo");
      var telefono = fieldValue("telefono");
      var asunto = fieldValue("asunto");
      var mensaje = fieldValue("mensaje");

      var subject = "Consulta web: " + asunto;
      var body =
        "Nombre: " + nombre + "\n" +
        "Correo: " + correo + "\n" +
        "Teléfono: " + (telefono || "No indicado") + "\n" +
        "Asunto: " + asunto + "\n\n" +
        "Mensaje:\n" + mensaje + "\n\n" +
        "— Enviado desde el sitio web del liceo.";

      var mailto =
        "mailto:contacto@liceosimonrodriguez.edu.ve" +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);

      if (status) {
        status.className = "form-status is-ok";
        status.textContent =
          "Abriendo tu programa de correo… Si no se abre, escribe a contacto@liceosimonrodriguez.edu.ve.";
      }

      window.location.href = mailto;
    });
  }
})();
