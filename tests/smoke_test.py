import json, sys, os
from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE", "http://127.0.0.1:8081")
res = {"checks": [], "console": [], "pageerrors": []}

def check(name, ok, detail=""):
    res["checks"].append({"name": name, "ok": bool(ok), "detail": str(detail)[:300]})
    print(("PASS " if ok else "FAIL ") + name + ((" :: " + str(detail)[:160]) if detail else ""))

with sync_playwright() as p:
    b = p.chromium.launch(args=["--no-sandbox"])
    c = b.new_context(viewport={"width": 1440, "height": 900})
    pg = c.new_page()
    pg.on("pageerror", lambda e: res["pageerrors"].append(str(e)))
    pg.on("console", lambda m: res["console"].append(m.text) if m.type == "error" else None)
    r = pg.goto(BASE + "/", wait_until="domcontentloaded")
    loader_visible = pg.locator("#page-loader").is_visible()
    check("loader inicial con bandera de Venezuela", loader_visible and pg.locator("#page-loader svg rect").count() == 3,
          pg.locator("#page-loader svg rect").count())
    pg.wait_for_selector("#page-loader", state="detached", timeout=5000)
    check("loader se retira tras la carga", pg.locator("#page-loader").count() == 0)
    pg.wait_for_timeout(400)

    check("respuesta 200", r.status == 200, r.status)
    check("titulo institucional", "Simón Rodríguez" in pg.title(), pg.title())
    check("lang es y un solo h1", pg.get_attribute("html", "lang") == "es" and pg.locator("h1").count() == 1)
    check("sin desbordamiento horizontal (desktop)", pg.evaluate("document.documentElement.scrollWidth") <= 1440,
          pg.evaluate("document.documentElement.scrollWidth"))
    check("CSS propio aplicado", "radial-gradient" in pg.evaluate("getComputedStyle(document.querySelector('.hero')).backgroundImage"))
    check("Bootstrap cargado", pg.evaluate("getComputedStyle(document.querySelector('.container')).paddingLeft") == "16px")
    check("iconos cargados", "bootstrap-icons" in pg.evaluate("getComputedStyle(document.querySelector('.bi'), '::before').fontFamily"))
    check("sin recursos externos", pg.evaluate("performance.getEntriesByType('resource').filter(r=>!r.name.startsWith(location.origin)).length") == 0)
    pg.hover(".hero .btn-brand"); pg.wait_for_timeout(900)
    transform = pg.evaluate("getComputedStyle(document.querySelector('.hero .btn-brand')).transform")
    check("botones animan al pasar el cursor", transform not in ("none", "matrix(1, 0, 0, 1, 0, 0)"), transform)

    # Tema
    check("tema inicial claro", pg.get_attribute("html", "data-bs-theme") == "light")
    pg.click("#theme-toggle"); pg.wait_for_timeout(150)
    check("tema oscuro", pg.get_attribute("html", "data-bs-theme") == "dark")
    check("aria-pressed", pg.get_attribute("#theme-toggle", "aria-pressed") == "true")
    check("theme-color actualizado", pg.get_attribute('meta[name="theme-color"]', "content").lower() != "#0a2b5e")
    pg.reload(wait_until="load"); pg.wait_for_timeout(300)
    check("tema persiste", pg.get_attribute("html", "data-bs-theme") == "dark")
    pg.evaluate("localStorage.clear()"); pg.reload(wait_until="load"); pg.wait_for_timeout(300)

    # Aviso
    pg.click("#announcement-close"); pg.wait_for_timeout(100)
    check("aviso se cierra", pg.evaluate("document.getElementById('announcement').hidden"))

    # Scrollspy / contador / progreso / volver arriba
    pg.evaluate("document.querySelector('#contacto').scrollIntoView()")
    pg.wait_for_timeout(3500)
    check("scrollspy marca contacto", pg.evaluate("document.querySelector('#menuPrincipal .nav-link.active')?.getAttribute('href')") == "#contacto",
          pg.evaluate("document.querySelector('#menuPrincipal .nav-link.active')?.getAttribute('href')"))
    pg.evaluate("document.querySelector('[data-count=\"1248\"]').scrollIntoView({block:'center'})")
    pg.wait_for_timeout(5000)
    check("contador animado formatea 1.248", pg.evaluate("document.querySelector('[data-count=\"1248\"]').textContent") == "1.248",
          pg.evaluate("document.querySelector('[data-count=\"1248\"]').textContent"))
    check("bloques reveal visibles", pg.evaluate("document.querySelectorAll('[data-reveal].is-visible').length > 5"),
          pg.evaluate("document.querySelectorAll('[data-reveal].is-visible').length"))
    check("barra de progreso avanza", float(pg.evaluate("parseFloat(document.querySelector('#scroll-progress-bar').style.width)")) > 0,
          pg.evaluate("document.querySelector('#scroll-progress-bar').style.width"))
    pg.evaluate("scrollTo({top:document.body.scrollHeight,behavior:'instant'})"); pg.wait_for_timeout(500)
    check("volver arriba visible", pg.evaluate("document.querySelector('#to-top').classList.contains('is-visible')"))
    pg.click("#to-top"); pg.wait_for_timeout(4500)
    check("volver arriba funciona", pg.evaluate("scrollY") == 0, pg.evaluate("scrollY"))

    # Pestañas, acordeones y carrusel
    pg.click("#tab-3"); pg.wait_for_timeout(250)
    check("pestañas de año cambian", pg.evaluate("document.querySelector('#panel-3').classList.contains('active')"))
    pg.click('[data-bs-target="#faq-2"]'); pg.wait_for_timeout(350)
    check("FAQ abre", pg.evaluate("document.querySelector('#faq-2').classList.contains('show')"))
    pg.evaluate("document.querySelector('#comunidad').scrollIntoView()"); pg.wait_for_timeout(500)
    antes = pg.evaluate("document.querySelector('.carousel-item.active blockquote')?.innerText.slice(0,40)")
    pg.click('#quoteCarousel [data-bs-slide="next"]'); pg.wait_for_timeout(900)
    despues = pg.evaluate("document.querySelector('.carousel-item.active blockquote')?.innerText.slice(0,40)")
    check("carrusel cambia testimonio", antes and antes != despues, f"{antes} -> {despues}")

    # Formulario
    pg.evaluate("document.querySelector('#contacto').scrollIntoView()"); pg.wait_for_timeout(400)
    pg.evaluate("document.querySelector('#contact-form').requestSubmit()"); pg.wait_for_timeout(200)
    check("form vacio bloquea envio", pg.evaluate("document.querySelector('#form-status').classList.contains('is-error')"))
    check("error en nombre", "mínimo 3" in pg.inner_text("#nombre-error"), pg.inner_text("#nombre-error"))
    pg.fill("#nombre", "María Pérez")
    pg.fill("#correo", "correo-invalido")
    pg.evaluate("document.querySelector('#nombre').dispatchEvent(new Event('input',{bubbles:true}))")
    pg.evaluate("document.querySelector('#correo').dispatchEvent(new Event('blur'))"); pg.wait_for_timeout(150)
    check("correo invalido detectado", pg.evaluate("document.querySelector('#correo').classList.contains('is-invalid')"))
    pg.fill("#correo", "maria@example.com")
    pg.evaluate("document.querySelector('#correo').dispatchEvent(new Event('input',{bubbles:true}))"); pg.wait_for_timeout(150)
    check("error de correo se limpia", not pg.evaluate("document.querySelector('#correo').classList.contains('is-invalid')"))
    pg.fill("#telefono", "+58 412 123 4567")
    pg.select_option("#asunto", index=1)
    pg.fill("#mensaje", "Solicito información sobre el proceso de inscripción para primer año.")
    pg.check("#consentimiento")
    check("contador de caracteres", pg.inner_text("#mensaje-count") == str(len("Solicito información sobre el proceso de inscripción para primer año.")), pg.inner_text("#mensaje-count"))
    pg.evaluate("document.querySelector('#contact-form').requestSubmit()"); pg.wait_for_timeout(300)
    check("form valido compone correo", "Abriendo tu programa de correo" in pg.inner_text("#form-status"), pg.inner_text("#form-status"))

    # Accesibilidad basica
    check("skip link presente", pg.locator("a.skip-link").count() == 1)
    check("imagenes/svg decorativos sin alt requerido", pg.evaluate("Array.from(document.querySelectorAll('img')).every(i=>i.hasAttribute('alt'))"))
    check("botones con nombre accesible", pg.evaluate("Array.from(document.querySelectorAll('button')).every(b=>b.textContent.trim()||b.getAttribute('aria-label'))"))

    c.close()

    # Movil
    c = b.new_context(viewport={"width": 390, "height": 844})
    pg = c.new_page()
    pg.on("pageerror", lambda e: res["pageerrors"].append(str(e)))
    pg.on("console", lambda m: res["console"].append(m.text) if m.type == "error" else None)
    pg.goto(BASE + "/", wait_until="load"); pg.wait_for_timeout(600)
    check("sin desbordamiento horizontal (movil 390)", pg.evaluate("document.documentElement.scrollWidth") <= 390,
          pg.evaluate("document.documentElement.scrollWidth"))
    check("menu movil colapsado", not pg.evaluate("document.querySelector('#menuPrincipal').classList.contains('show')"))
    pg.click("#nav-toggle"); pg.wait_for_timeout(450)
    check("menu movil abre", pg.evaluate("document.querySelector('#menuPrincipal').classList.contains('show')"))
    pg.click("#menuPrincipal a[href='#admision']"); pg.wait_for_timeout(2800)
    check("menu movil cierra al navegar", not pg.evaluate("document.querySelector('#menuPrincipal').classList.contains('show')"))
    top = pg.evaluate("document.querySelector('#admision').getBoundingClientRect().top")
    check("navegacion movil llega a admision", 40 <= top <= 200, round(top, 1))
    c.close()

    # 320 px
    c = b.new_context(viewport={"width": 320, "height": 700})
    pg = c.new_page(); pg.goto(BASE + "/", wait_until="load"); pg.wait_for_timeout(400)
    check("sin desbordamiento horizontal (movil 320)", pg.evaluate("document.documentElement.scrollWidth") <= 320,
          pg.evaluate("document.documentElement.scrollWidth"))
    c.close()

    # 404
    c = b.new_context(viewport={"width": 390, "height": 844})
    pg = c.new_page(); r = pg.goto(BASE + "/pagina-inexistente", wait_until="load"); pg.wait_for_timeout(200)
    check("404 responde y muestra ayuda", r.status == 404 and "no encontramos" in pg.inner_text("body").lower(), r.status)
    c.close()
    b.close()

ok = sum(1 for x in res["checks"] if x["ok"])
res["summary"] = {"passed": ok, "total": len(res["checks"]), "pageerrors": res["pageerrors"], "console_errors": res["console"]}
print("\nRESUMEN", json.dumps(res["summary"], ensure_ascii=False))
json.dump(res, open(os.environ.get("RESULTS", "/tmp/landing-colegio-results.json"), "w"), ensure_ascii=False, indent=2)
sys.exit(0 if ok == len(res["checks"]) and not res["pageerrors"] and not res["console"] else 1)
