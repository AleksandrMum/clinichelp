const { Router } = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const roleGuard = require('../middlewares/role-guard.middleware');
const {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  changePassword,
  deactivateUser
} = require('../controllers/users.controller');

const usersRouter = Router();

usersRouter.use(authMiddleware);

usersRouter.get('/', roleGuard('admin', 'manager'), listUsers);
usersRouter.get('/:id', roleGuard('admin', 'manager'), getUserById);

usersRouter.post('/', roleGuard('admin'), createUser);
usersRouter.patch('/:id', roleGuard('admin'), updateUser);
usersRouter.patch('/:id/password', roleGuard('admin'), changePassword);
usersRouter.patch('/:id/deactivate', roleGuard('admin'), deactivateUser);

module.exports = usersRouter;
