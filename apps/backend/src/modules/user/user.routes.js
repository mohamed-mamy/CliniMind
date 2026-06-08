const express = require('express');
const { z } = require('zod');
const { requireAuth } = require('../../middlewares/auth.middleware');
const { requireRoles } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const userController = require('./user.controller');

const router = express.Router();

const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(4),
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum(['director', 'doctor', 'receptionist', 'lab_technician'])
});

const updateUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  password: z.string().min(4).optional(),
  fullName: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.enum(['director', 'doctor', 'receptionist', 'lab_technician']).optional(),
  isActive: z.boolean().optional()
});

router.use(requireAuth);

// GET endpoints – accessible by all staff roles (needed for doctor selection in forms)
router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);

// Mutations – director only
router.post('/', requireRoles(['director']), validate(createUserSchema), userController.createUser);
router.put('/:id', requireRoles(['director']), validate(updateUserSchema), userController.updateUser);
router.delete('/:id', requireRoles(['director']), userController.deleteUser);

module.exports = router;
