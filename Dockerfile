# ZERA-APS: container portável. Requer proxy HTTPS externo e APP_ORIGIN configurada.
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8787 HOST=0.0.0.0 ZERA_DB_PATH=/app/runtime/zeraaps.sqlite
COPY --chown=node:node . .
RUN mkdir -p /app/runtime && chown -R node:node /app/runtime
USER node
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=4s --start-period=10s --retries=3 CMD node -e "fetch('http://127.0.0.1:8787/healthz',{headers:{host:new URL(process.env.APP_ORIGIN).host}}).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server/launch.mjs"]
