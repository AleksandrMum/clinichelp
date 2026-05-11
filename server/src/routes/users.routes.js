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
usersRouter.use(roleGuard('admin'));

usersRouter.get('/', listUsers);
usersRouter.get('/:id', getUserById);
usersRouter.post('/', createUser);
usersRouter.patch('/:id', updateUser);
usersRouter.patch('/:id/password', changePassword);
usersRouter.patch('/:id/deactivate', deactivateUser);

module.exports = usersRouter;
