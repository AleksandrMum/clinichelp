const { Router } = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const { login, me, logout, changeMyPassword } = require('../controllers/auth.controller');

const authRouter = Router();

authRouter.post('/login', login);
authRouter.get('/me', authMiddleware, me);
authRouter.post('/logout', authMiddleware, logout);
authRouter.patch('/password', authMiddleware, changeMyPassword);

module.exports = authRouter;
