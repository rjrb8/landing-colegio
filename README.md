# U.E.N. Liceo Bolivariano «Simón Rodríguez» — Landing institucional

Sitio web estático e interactivo para una unidad educativa nacional de
Educación Media General (1.° a 5.° año), construido con **HTML5 + Bootstrap
5.3.3 + CSS propio + JavaScript sin dependencias**, con enfoque de seguridad
(OWASP), accesibilidad (WCAG 2.1 AA) y despliegue en **Docker con Nginx sin
privilegios**.

> **Datos ficticios:** el nombre del plantel, la dirección, el teléfono, el
> correo, el código DEA, el RIF, las cifras y los testimonios son
> ejemplos de demostración. Sustitúyelos por la información real antes de
> publicar.

<img width="1536" height="2752" alt="Arquitectura_y_stack_web_escolar" src="https://github.com/user-attachments/assets/1b5910ea-2867-49a2-bae1-6c963d21f29c" />

<img width="1536" height="2752" alt="Arquitectura_segura_para_servidores" src="https://github.com/user-attachments/assets/40707462-2c82-44b1-b6c1-2db61b7f3351" />

<img width="1536" height="2752" alt="Diseño_Web_Inclusivo_y_Accesible" src="https://github.com/user-attachments/assets/fcb86876-e30c-4cf2-aad7-c699cf368f1d" />


---

## Características

- Diseño responsive con Bootstrap 5.3.3 **servido localmente** (sin CDN, funciona offline).
- Identidad visual propia: azul profundo, oro y rojo; ilustración SVG original.
- Secciones: inicio, institución, oferta académica (pestañas 1.°–5.° año),
  plan de estudio, admisión, noticias (modales), comunidad (carrusel),
  preguntas frecuentes, contacto y aviso legal.
- Tema claro/oscuro con preferencia guardada en `localStorage` (único dato local).
- Cargador inicial con la bandera de Venezuela y barra de progreso; se retira al
  terminar la carga y tiene reserva CSS si JavaScript no está disponible.
- Microinteracciones: botones con elevación y brillo, iconos animados, tarjetas
  y enlaces con transición, todo desactivado con `prefers-reduced-motion`.
- Accesibilidad: enlace «saltar al contenido», navegación por teclado,
  `aria-*`, foco visible, contraste y respeto a `prefers-reduced-motion`.
- Formulario de contacto **sin backend**: valida en el cliente y abre el
  programa de correo del usuario mediante `mailto:`. El sitio no almacena datos.
- Cabeceras de seguridad y CSP estricta (sin scripts ni estilos inline).
- Docker multiarch-ready con Nginx sin privilegios (uid 101, puerto 8080).

---

## Estructura del proyecto

```text
landing-colegio/
├── index.html                 # Página principal
├── 404.html                   # Página de error personalizada
├── site.webmanifest           # Manifiesto PWA
├── assets/
│   ├── css/styles.css         # Estilos propios (tema, componentes, responsive)
│   ├── js/theme-init.js       # Aplica el tema antes del primer render
│   ├── js/main.js             # Interacciones, validación y animaciones
│   └── img/favicon.svg        # Icono del sitio
├── vendor/
│   ├── bootstrap/             # Bootstrap 5.3.3 local (CSS + bundle JS)
│   └── bootstrap-icons/       # Bootstrap Icons local (CSS + fuentes)
├── nginx.conf                 # Configuración del servidor y cabeceras
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── tests/
│   └── smoke_test.py          # Pruebas funcionales con Playwright
└── README.md
```

---

## Requisitos

- Para verlo en local: cualquier servidor HTTP estático (Python 3, Node, Nginx…).
- Para Docker: Docker Engine 24+ y Docker Compose v2.

No requiere Node.js ni proceso de build: los archivos se sirven tal cual.

---

## Ejecución local

```bash
cd landing-colegio
python3 -m http.server 8080
# Abrir http://localhost:8080
```

> Ábrelo con un servidor HTTP, no con `file://`: la CSP, el manifiesto y las
> fuentes locales se comportan distinto en el protocolo `file:`.

Alternativa con Nginx instalado en el sistema:

```bash
sudo nginx -c "$PWD/nginx.conf"   # ajusta root y puerto si es necesario
```

---

<img width="1536" height="2752" alt="Metodología_de_Desarrollo_y_Pruebas" src="https://github.com/user-attachments/assets/d69f3fd1-3bb7-4339-bbc2-5b2478c5479c" />


## Docker

```bash
# Construir y levantar
docker compose up -d --build

# Estado y registros
docker compose ps
docker compose logs -f web

# Comprobar salud y cabeceras
curl -s http://localhost:8080/healthz
curl -sI http://localhost:8080/ | sed -n '1,30p'

# Detener y eliminar
docker compose down
```

Sin Compose:

```bash
docker build -t landing-colegio:latest .
docker run -d --name landing-colegio \
  -p 8080:8080 \
  --read-only --tmpfs /tmp \
  --security-opt no-new-privileges:true \
  --cap-drop ALL \
  landing-colegio:latest
```

El contenedor:

- Usa `nginxinc/nginx-unprivileged:1.27-alpine` y **no corre como root**.
- Escucha en **8080** (mapeado a `localhost:8080`).
- Tiene `HEALTHCHECK` sobre `/healthz`.
- Con `read_only` y `tmpfs /tmp` el sistema de archivos del contenedor es inmutable.

---

## Seguridad aplicada

### Cabeceras (Nginx y `meta` CSP)

| Cabecera | Valor |
| --- | --- |
| `Content-Security-Policy` | `default-src 'none'` + solo recursos propios |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `no-referrer` |
| `Permissions-Policy` | cámara, micrófono, geolocalización, etc. bloqueados |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Cross-Origin-Resource-Policy` | `same-origin` |
| `X-Permitted-Cross-Domain-Policies` | `none` |
| `server_tokens` | `off` |

### OWASP Top 10 (2021)

<img width="1536" height="2752" alt="Aplicación_de_Seguridad_Web_Práctica" src="https://github.com/user-attachments/assets/c45b8696-8c9c-445f-968f-66b40f742ca0" />


| Riesgo | Tratamiento en este proyecto |
| --- | --- |
| A01 Control de acceso | Sitio estático público; sin paneles ni rutas privadas. |
| A02 Fallos criptográficos | Sin credenciales ni datos sensibles; HSTS preparado para HTTPS. |
| A03 Inyección | Sin backend, base de datos ni `innerHTML`; se usa `textContent`. |
| A04 Diseño inseguro | Sin cuentas, pagos ni formularios persistidos; `mailto:` explícito. |
| A05 Configuración insegura | CSP estricta, cabeceras, Nginx sin privilegios, FS de solo lectura. |
| A06 Componentes vulnerables | Bootstrap fijado en 5.3.3 con **SRI** verificado localmente. |
| A07 Autenticación | No aplica: no hay autenticación. |
| A08 Integridad de datos | Vendor local + `integrity`; sin CDN ni actualizaciones silenciosas. |
| A09 Registro y monitoreo | Logs de Nginx; sin datos personales en el sitio. |
| A10 SSRF | No hay peticiones del servidor hacia URLs externas. |

Extras: sin cookies, sin analítica de terceros, sin fuentes externas y sin
mapas embebidos (el croquis es decorativo).

### Privacidad

- El sitio no recopila datos: el formulario solo compone un correo en el
  cliente.
- La única preferencia almacenada es el tema visual (`localStorage`), tal como
  explica el aviso de privacidad del propio sitio.
- Contenido alineado con la **LOPNNA**: las consultas sobre estudiantes deben
  realizarlas sus representantes legales y no se solicitan documentos por web.

---

## Accesibilidad

- HTML semántico, jerarquía de encabezados y `lang="es"`.
- Enlace de salto, `aria-label`, `aria-expanded`, `aria-controls`, `aria-current`.
- Foco visible de alto contraste y navegación completa por teclado.
- Contraste de texto orientado a WCAG AA; estados no dependientes solo del color.
- Animaciones desactivadas con `prefers-reduced-motion`.
- Formulario con etiquetas asociadas, ayuda contextual y errores anunciados
  (`role="status"`, `aria-live="polite"`).

---

## Personalización

1. **Datos institucionales:** busca en `index.html` el nombre, dirección,
   teléfono, correos, código DEA, RIF, fechas y cifras.
2. **Colores y tipografía:** edita las variables al inicio de
   `assets/css/styles.css` (`--brand-*`, `--gold-*`, `--radius`, fuentes).
3. **Contenido de secciones:** cada bloque está delimitado por comentarios en
   el HTML (hero, oferta, admisión, noticias, contacto…).
4. **Favicon y manifiesto:** reemplaza `assets/img/favicon.svg` y ajusta
   `site.webmanifest` (nombre, colores, `start_url`).
5. **Bootstrap:** si actualizas la versión en `vendor/`, recalcula los hashes
   `integrity` y actualízalos en `index.html` y `404.html`.

---

## Validación

Última ejecución: **26/10/2026** con Chromium 124 (Playwright), Nginx 1.26
sirviendo el sitio con las cabeceras reales y viewports de 280 a 1440 px.

| Comprobación | Resultado |
| --- | --- |
| Suite funcional `tests/smoke_test.py` | **42/42** |
| Errores de página, consola o CSP | 0 |
| Desbordamiento horizontal (280–1440 px) | 0 px |
| Cargador inicial con bandera de Venezuela y su retirada | OK |
| Botones animados y microinteracciones | OK |
| Tema claro/oscuro y persistencia | OK |
| Menú móvil, scrollspy, contador y «volver arriba» | OK |
| Pestañas, FAQ, carrusel y formulario `mailto:` | OK |
| `404`, `healthz`, MIME del manifiesto, gzip y caché | OK |
| Sintaxis JS, JSON y SRI de Bootstrap | OK |
| `nginx -t` | OK |
| `docker compose build` | Pendiente: el entorno de validación no tiene el plugin Compose ni acceso al socket Docker |

### Reproducir la suite

```bash
# 1. Servir el sitio (cualquier servidor estático; se recomienda Nginx)
python3 -m http.server 8081
#    o: nginx -c /ruta/a/configuracion/nginx.conf

# 2. Requisitos (solo la primera vez)
pip install playwright
playwright install chromium

# 3. Ejecutar
BASE=http://127.0.0.1:8081 python3 tests/smoke_test.py
```

La suite imprime `PASS/FAIL`, escribe un JSON de resultados y devuelve un
código de salida distinto de cero si algo falla. También conviene revisar las
cabeceras en ejecución:

```bash
curl -sI http://127.0.0.1:8081/ | grep -iE 'content-security|x-frame|referrer|x-content|permissions|cross-origin'
curl -s http://127.0.0.1:8081/healthz
```

### Comprobaciones estáticas

```bash
node --check assets/js/main.js
node --check assets/js/theme-init.js
python3 -m json.tool site.webmanifest >/dev/null
nginx -t -c /ruta/a/configuracion/nginx.conf
docker compose config -q
docker compose build
```

---

## Licencia

Código liberado bajo **MIT**. La identidad, los textos institucionales y los
datos reales que se incorporen son responsabilidad de la institución. El
contenido de ejemplo es ficticio y no representa a ningún plantel real.
