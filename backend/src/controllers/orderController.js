import prisma from '../config/database.js';
import { sendSuccess, sendError, generateOrderNo } from '../utils/response.js';

/**
 * Get all orders for the authenticated user
 */
export const getUserOrders = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);

    const where = { userId: req.user.id };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        skip,
        take: parseInt(pageSize),
        where,
        include: {
          product: {
            select: {
              id: true,
              title: true,
              category: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.count({ where })
    ]);

    return sendSuccess(res, {
      list: orders,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total
      }
    });

  } catch (error) {
    console.error('Get user orders error:', error);
    return sendError(res, 'Failed to get orders', 500);
  }
};

/**
 * Get order by ID
 */
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        product: true,
        user: {
          select: {
            id: true,
            uid: true,
            phone: true,
            username: true
          }
        }
      }
    });

    if (!order) {
      return sendError(res, 'Order not found', 404);
    }

    // Only allow users to view their own orders (unless admin)
    if (order.userId !== req.user.id) {
      return sendError(res, 'Not authorized', 403);
    }

    return sendSuccess(res, order);

  } catch (error) {
    console.error('Get order by ID error:', error);
    return sendError(res, 'Failed to get order', 500);
  }
};

/**
 * Create a new order (invest in a product)
 */
export const createOrder = async (req, res) => {
  try {
    const { productId, amount } = req.body;

    if (!productId || !amount) {
      return sendError(res, 'Product ID and amount are required', 400);
    }

    const investAmount = parseFloat(amount);

    // Get product
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) }
    });

    if (!product) {
      return sendError(res, 'Product not found', 404);
    }

    if (product.status !== 'open') {
      return sendError(res, 'Product is not available for investment', 400);
    }

    if (investAmount < product.minInvest) {
      return sendError(res, `Minimum investment is ${product.minInvest}`, 400);
    }

    // Get user info for VIP bonus calculation
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Check user balance
    if (Number(user.money) < investAmount) {
      return sendError(res, 'Insufficient balance', 400);
    }

    // Get VIP bonus rate
    const vipConfig = await prisma.vipLevel.findUnique({
      where: { level: user.vipLevel }
    });

    const vipBonus = vipConfig ? Number(vipConfig.interestAdd) : 0;
    const aprFinal = Number(product.baseAPR) + vipBonus;

    // Calculate estimated earnings
    const estimatedEarning = (investAmount * aprFinal * product.cycleDays) / 36500;

    // Calculate end date
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + product.cycleDays);

    // Use transaction to create order and update balances
    const [order] = await prisma.$transaction([
      prisma.order.create({
        data: {
          orderNo: generateOrderNo(),
          userId: req.user.id,
          productId: parseInt(productId),
          amount: investAmount,
          aprFinal,
          cycleDays: product.cycleDays,
          estimatedEarning,
          startDate,
          endDate
        }
      }),
      prisma.user.update({
        where: { id: req.user.id },
        data: {
          money: { decrement: investAmount }
        }
      }),
      prisma.product.update({
        where: { id: parseInt(productId) },
        data: {
          raisedAmount: { increment: investAmount }
        }
      })
    ]);

    return sendSuccess(res, {
      order: {
        ...order,
        product: {
          title: product.title,
          category: product.category
        }
      }
    }, 'Investment successful');

  } catch (error) {
    console.error('Create order error:', error);
    return sendError(res, 'Failed to create order', 500);
  }
};

/**
 * Get all orders (admin only)
 */
export const getAllOrders = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status, userId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);

    const where = {};
    if (status) where.status = status;
    if (userId) where.userId = parseInt(userId);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        skip,
        take: parseInt(pageSize),
        where,
        include: {
          product: {
            select: {
              id: true,
              title: true,
              category: true
            }
          },
          user: {
            select: {
              id: true,
              uid: true,
              phone: true,
              username: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.count({ where })
    ]);

    return sendSuccess(res, {
      list: orders,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total
      }
    });

  } catch (error) {
    console.error('Get all orders error:', error);
    return sendError(res, 'Failed to get orders', 500);
  }
};
