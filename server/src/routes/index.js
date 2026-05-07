const { Router } = require('express');
const healthRouter = require('./health.routes');

const router = Router();

router.use(healthRouter);

module.exports = router;
