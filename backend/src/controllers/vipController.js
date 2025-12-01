import prisma from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * Get all VIP levels
 */
export const getAllVipLevels = async (req, res) => {
  try {
    const vipLevels = await prisma.vipLevel.findMany({
      orderBy: { level: 'asc' }
    });

    return sendSuccess(res, vipLevels);

  } catch (error) {
    console.error('Get all VIP levels error:', error);
    return sendError(res, 'Failed to get VIP levels', 500);
  }
};

/**
 * Get VIP level by ID
 */
export const getVipLevelById = async (req, res) => {
  try {
    const { level } = req.params;

    const vipLevel = await prisma.vipLevel.findUnique({
      where: { level: parseInt(level, 10) }
    });

    if (!vipLevel) {
      return sendError(res, 'VIP level not found', 404);
    }

    return sendSuccess(res, vipLevel);

  } catch (error) {
    console.error('Get VIP level by ID error:', error);
    return sendError(res, 'Failed to get VIP level', 500);
  }
};

/**
 * Create a new VIP level
 */
export const createVipLevel = async (req, res) => {
  try {
    const { level, name, investAmount, interestAdd, commissionL1, commissionL2 } = req.body;

    if (level === undefined || !name || investAmount === undefined) {
      return sendError(res, 'Level, name, and investAmount are required', 400);
    }

    const vipLevel = await prisma.vipLevel.create({
      data: {
        level: parseInt(level, 10),
        name,
        investAmount: parseFloat(investAmount),
        interestAdd: interestAdd ? parseFloat(interestAdd) : 0,
        commissionL1: commissionL1 ? parseFloat(commissionL1) : 0,
        commissionL2: commissionL2 ? parseFloat(commissionL2) : 0
      }
    });

    return sendSuccess(res, vipLevel, 'VIP level created successfully');

  } catch (error) {
    console.error('Create VIP level error:', error);
    if (error.code === 'P2002') {
      return sendError(res, 'VIP level already exists', 400);
    }
    return sendError(res, 'Failed to create VIP level', 500);
  }
};

/**
 * Update VIP level
 */
export const updateVipLevel = async (req, res) => {
  try {
    const { level } = req.params;
    const { name, investAmount, interestAdd, commissionL1, commissionL2 } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (investAmount !== undefined) updateData.investAmount = parseFloat(investAmount);
    if (interestAdd !== undefined) updateData.interestAdd = parseFloat(interestAdd);
    if (commissionL1 !== undefined) updateData.commissionL1 = parseFloat(commissionL1);
    if (commissionL2 !== undefined) updateData.commissionL2 = parseFloat(commissionL2);

    const vipLevel = await prisma.vipLevel.update({
      where: { level: parseInt(level, 10) },
      data: updateData
    });

    return sendSuccess(res, vipLevel, 'VIP level updated successfully');

  } catch (error) {
    console.error('Update VIP level error:', error);
    if (error.code === 'P2025') {
      return sendError(res, 'VIP level not found', 404);
    }
    return sendError(res, 'Failed to update VIP level', 500);
  }
};

/**
 * Delete VIP level
 */
export const deleteVipLevel = async (req, res) => {
  try {
    const { level } = req.params;

    await prisma.vipLevel.delete({
      where: { level: parseInt(level, 10) }
    });

    return sendSuccess(res, null, 'VIP level deleted successfully');

  } catch (error) {
    console.error('Delete VIP level error:', error);
    if (error.code === 'P2025') {
      return sendError(res, 'VIP level not found', 404);
    }
    return sendError(res, 'Failed to delete VIP level', 500);
  }
};

/**
 * Get current user's VIP progress
 */
export const getUserVipProgress = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        vipLevel: true,
        money: true,
        recharges: true
      }
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Get all VIP levels
    const vipLevels = await prisma.vipLevel.findMany({
      orderBy: { level: 'asc' }
    });

    // Find current and next VIP level
    const currentVip = vipLevels.find(v => v.level === user.vipLevel);
    const nextVip = vipLevels.find(v => v.level === user.vipLevel + 1);

    // Calculate total invested amount from orders
    const orderStats = await prisma.order.aggregate({
      where: {
        userId: req.user.id,
        status: { in: ['active', 'finished'] }
      },
      _sum: {
        amount: true
      }
    });

    const totalInvested = orderStats._sum.amount || 0;

    return sendSuccess(res, {
      currentLevel: user.vipLevel,
      currentVip,
      nextVip,
      totalInvested,
      progressToNext: nextVip ? {
        required: nextVip.investAmount,
        current: totalInvested,
        remaining: Math.max(0, Number(nextVip.investAmount) - Number(totalInvested))
      } : null
    });

  } catch (error) {
    console.error('Get user VIP progress error:', error);
    return sendError(res, 'Failed to get VIP progress', 500);
  }
};
