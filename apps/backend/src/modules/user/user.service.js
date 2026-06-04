const mongoose = require('mongoose');
const User = require('./user.model');
const pino = require('pino');
const logger = pino();

// Seed first director
const seedInitialDirector = async () => {
  const directorCount = await User.countDocuments({ role: 'director' });
  if (directorCount === 0) {
    logger.info('Seeding initial director...');
    const defaultDirector = new User({
      username: 'admin',
      password: 'adminpassword', // plain text as requested
      role: 'director',
      fullName: 'Default Director',
      email: 'admin@clinimind.com',
      isActive: true
    });
    await defaultDirector.save();
    logger.info('Initial director created (admin/adminpassword)');
  }
};

const createUser = async (data, creatorId) => {
  if (data.role === 'director') {
    const err = new Error('Cannot create director via API');
    err.status = 403;
    err.code = 'FORBIDDEN';
    throw err;
  }
  const existing = await User.findOne({ username: data.username });
  if (existing) {
    const error = new Error('Username already exists');
    error.code = 'DUPLICATE';
    error.status = 409;
    throw error;
  }
  
  const user = new User({ ...data, createdBy: creatorId });
  await user.save();
  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
};

const getUsers = async ({ page = 1, limit = 20, role, search, isActive }) => {
  const query = {};
  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { username: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await User.countDocuments(query);
  const users = await User.find(query).select('-password').skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 });

  return { users, total: parseInt(total), page: parseInt(page), limit: parseInt(limit) };
};

const getUserById = async (id) => {
  const user = await User.findById(id).select('-password');
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
  return user;
};

const updateUser = async (id, data, currentUser) => {
  const originalUser = await User.findById(id);
  if (!originalUser) {
    const err = new Error('User not found');
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  if (data.username) {
    const existing = await User.findOne({ username: data.username, _id: { $ne: id } });
    if (existing) {
      const err = new Error('Username already exists');
      err.status = 409;
      err.code = 'DUPLICATE';
      throw err;
    }
  }

  // Block promotion to director via update path
  if (data.role === 'director') {
    const err = new Error('Cannot promote user to director via API');
    err.status = 403;
    err.code = 'FORBIDDEN';
    throw err;
  }

  const roleChanged = data.role && data.role !== originalUser.role;

  if (roleChanged && currentUser) {
    // Wrap role change + audit log in a transaction for atomicity
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findByIdAndUpdate(id, data, { new: true, runValidators: true, session }).select('-password');

      const AuditLog = require('../audit/audit.model');
      await AuditLog.create([{
        userId: currentUser.userId,
        action: 'change_role',
        details: `Changed role of user ${user.username} from ${originalUser.role} to ${user.role}`,
        oldValues: { role: originalUser.role },
        newValues: { role: user.role },
        resourceType: 'User',
        resourceId: user._id
      }], { session });

      await session.commitTransaction();
      session.endSession();
      return user;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  // Non-role-change update (no transaction needed)
  const user = await User.findByIdAndUpdate(id, data, { new: true, runValidators: true }).select('-password');
  return user;
};

const deleteUser = async (id, requesterId) => {
  if (id === requesterId.toString()) {
    const err = new Error('Cannot delete own account');
    err.status = 409;
    err.code = 'INVALID_STATE';
    throw err;
  }
  await User.findByIdAndDelete(id);
};

module.exports = {
  seedInitialDirector,
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
};
