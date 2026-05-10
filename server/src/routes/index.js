const { Router } = require('express');
const healthRouter = require('./health.routes');
const authRouter = require('./auth.routes');
const usersRouter = require('./users.routes');

const router = Router();

router.use(healthRouter);
router.use('/auth', authRouter);
router.use('/users', usersRouter);

module.exports = router;
