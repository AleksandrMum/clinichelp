const { Router } = require('express');
const healthRouter = require('./health.routes');
const authRouter = require('./auth.routes');
const usersRouter = require('./users.routes');
const patientsRouter = require('./patients.routes');
const servicesRouter = require('./services.routes');

const router = Router();

router.use(healthRouter);
router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/patients', patientsRouter);
router.use('/services', servicesRouter);

module.exports = router;
