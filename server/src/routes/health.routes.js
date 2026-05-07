const { Router } = require('express');
const { getHealth } = require('../controllers/health.controller');

const healthRouter = Router();

healthRouter.get('/health', getHealth);

module.exports = healthRouter;
