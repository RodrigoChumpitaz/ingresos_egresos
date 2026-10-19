import { Router } from 'express';
import { openApiSpec } from './openapi';

const SWAGGER_UI_VERSION = '5.17.14';
const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Ingresos y Egresos API - Docs</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui-bundle.js"></script>
  <script>
    window.ui = SwaggerUIBundle({ url: '/api/v1/docs/openapi.json', dom_id: '#swagger-ui' });
  </script>
</body>
</html>`;

export const docsRouter = Router();
docsRouter.get('/openapi.json', (_req, res) => res.json(openApiSpec));
docsRouter.get('/', (_req, res) => res.type('html').send(html));
