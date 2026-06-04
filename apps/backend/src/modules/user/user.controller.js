const userService = require('./user.service');
const { sendSuccess } = require('../../utils/apiResponse');

const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body, req.user.userId);
    return sendSuccess(res, 201, user);
  } catch (err) {
    next(err);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const { users, ...meta } = await userService.getUsers(req.query);
    return sendSuccess(res, 200, users, meta);
  } catch (err) {
    next(err);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    return sendSuccess(res, 200, user);
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    // If password is changed, we should ideally hook into Auth to delete refresh tokens.
    // This will be handled implicitly or via the auth module directly in production.
    const user = await userService.updateUser(req.params.id, req.body, req.user);
    return sendSuccess(res, 200, user);
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id, req.user.userId);
    return sendSuccess(res, 204);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
};
