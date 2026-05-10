const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const swaggerUi = require('swagger-ui-express');

const openApiPath = path.join(__dirname, '..', 'openapi.yaml');

function loadOpenApiDocument() {
  const raw = fs.readFileSync(openApiPath, 'utf8');
  return yaml.load(raw);
}

function mountSwagger(app) {
  const document = loadOpenApiDocument();
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(document, {
      customSiteTitle: 'ClinicHelp API',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true
      }
    })
  );
}

module.exports = { mountSwagger };
