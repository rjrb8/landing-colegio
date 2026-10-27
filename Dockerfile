FROM nginxinc/nginx-unprivileged:1.27-alpine

LABEL org.opencontainers.image.title="Landing Liceo Bolivariano Simon Rodriguez" \
      org.opencontainers.image.description="Sitio estatico institucional (Educacion Media General) servido con Nginx sin privilegios." \
      org.opencontainers.image.licenses="MIT"

ENV TZ=America/Caracas

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY index.html 404.html site.webmanifest /usr/share/nginx/html/
COPY assets /usr/share/nginx/html/assets
COPY vendor /usr/share/nginx/html/vendor

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O - http://127.0.0.1:8080/healthz >/dev/null 2>&1 || exit 1

# La imagen base ya ejecuta como usuario sin privilegios (uid 101)
# y escucha en el puerto 8080.
