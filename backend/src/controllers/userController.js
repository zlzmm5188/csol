import bcrypt from 'bcrypt';
import prisma from '../config/database.js';
import { sendSuccess, sendError, generateUid, generateInviteCode } from '../utils/response.js';
import { generateToken } from '../middleware/auth.js';

/**
 * Register a new user
 */
export const register = async (req, res) => {
  try {
    const { phone, password, inviteCode } = req.body;

    if (!phone || !password) {
      return sendError(res, 'Phone and password are required', 400);
    }

    // Check if phone already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone }
    });

    if (existingUser) {
      return sendError(res, 'Phone number already registered', 400);
    }

    // Find referrer if invite code provided
    let referrerId = 0;
    if (inviteCode) {
      const referrer = await prisma.user.findUnique({
        where: { inviteCode }
      });
      if (referrer) {
        referrerId = referrer.id;
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        uid: generateUid(),
        phone,
        password: hashedPassword,
        inviteCode: generateInviteCode(),
        pid: referrerId
      }
    });

    // Generate token
    const token = generateToken(user);

    return sendSuccess(res, {
      token,
      user: {
        id: user.id,
        uid: user.uid,
        phone: user.phone,
        inviteCode: user.inviteCode
      }
    }, 'Registration successful');

  } catch (error) {
    console.error('Register error:', error);
    return sendError(res, 'Registration failed', 500);
  }
};

/**
 * User login
 */
export const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return sendError(res, 'Phone and password are required', 400);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { phone }
    });

    if (!user) {
      return sendError(res, 'Invalid phone or password', 401);
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return sendError(res, 'Invalid phone or password', 401);
    }

    // Generate token
    const token = generateToken(user);

    return sendSuccess(res, {
      token,
      user: {
        id: user.id,
        uid: user.uid,
        phone: user.phone,
        username: user.username,
        realname: user.realname,
        vipLevel: user.vipLevel,
        money: user.money,
        inviteCode: user.inviteCode
      }
    }, 'Login successful');

  } catch (error) {
    console.error('Login error:', error);
    return sendError(res, 'Login failed', 500);
  }
};

/**
 * Get current user info
 */
export const getUserInfo = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        uid: true,
        phone: true,
        username: true,
        realname: true,
        email: true,
        avatar: true,
        money: true,
        recharges: true,
        withdraws: true,
        vipLevel: true,
        kycStatus: true,
        inviteCode: true,
        createdAt: true
      }
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, user);

  } catch (error) {
    console.error('Get user info error:', error);
    return sendError(res, 'Failed to get user info', 500);
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req, res) => {
  try {
    const { username, email, avatar } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        username,
        email,
        avatar
      },
      select: {
        id: true,
        uid: true,
        phone: true,
        username: true,
        realname: true,
        email: true,
        avatar: true
      }
    });

    return sendSuccess(res, updatedUser, 'Profile updated successfully');

  } catch (error) {
    console.error('Update profile error:', error);
    return sendError(res, 'Failed to update profile', 500);
  }
};

/**
 * Get user balance/wallet info
 */
export const getBalance = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        money: true,
        recharges: true,
        withdraws: true
      }
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, {
      balance: user.money,
      totalRecharge: user.recharges,
      totalWithdraw: user.withdraws
    });

  } catch (error) {
    console.error('Get balance error:', error);
    return sendError(res, 'Failed to get balance', 500);
  }
};

/**
 * Get all users (admin only)
 */
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(pageSize, 10);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: parseInt(pageSize, 10),
        select: {
          id: true,
          uid: true,
          phone: true,
          username: true,
          realname: true,
          vipLevel: true,
          money: true,
          kycStatus: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count()
    ]);

    return sendSuccess(res, {
      list: users,
      pagination: {
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
        total
      }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    return sendError(res, 'Failed to get users', 500);
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id, 10) },
      select: {
        id: true,
        uid: true,
        phone: true,
        username: true,
        realname: true,
        email: true,
        avatar: true,
        money: true,
        recharges: true,
        withdraws: true,
        vipLevel: true,
        kycStatus: true,
        inviteCode: true,
        pid: true,
        createdAt: true
      }
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, user);

  } catch (error) {
    console.error('Get user by ID error:', error);
    return sendError(res, 'Failed to get user', 500);
  }
};

/**
 * Delete user by ID (admin only)
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id: parseInt(id, 10) }
    });

    return sendSuccess(res, null, 'User deleted successfully');

  } catch (error) {
    console.error('Delete user error:', error);
    if (error.code === 'P2025') {
      return sendError(res, 'User not found', 404);
    }
    return sendError(res, 'Failed to delete user', 500);
  }
};
