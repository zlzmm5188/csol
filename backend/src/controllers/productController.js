import prisma from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * Get all products
 */
export const getAllProducts = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, category, status } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(pageSize, 10);

    const where = {};
    if (category) where.category = category;
    if (status) where.status = status;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        skip,
        take: parseInt(pageSize, 10),
        where,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);

    return sendSuccess(res, {
      list: products,
      pagination: {
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
        total
      }
    });

  } catch (error) {
    console.error('Get all products error:', error);
    return sendError(res, 'Failed to get products', 500);
  }
};

/**
 * Get product by ID
 */
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id, 10) }
    });

    if (!product) {
      return sendError(res, 'Product not found', 404);
    }

    return sendSuccess(res, product);

  } catch (error) {
    console.error('Get product by ID error:', error);
    return sendError(res, 'Failed to get product', 500);
  }
};

/**
 * Create a new product
 */
export const createProduct = async (req, res) => {
  try {
    const {
      title,
      subtitle,
      category,
      baseAPR,
      cycleDays,
      minInvest,
      totalAmount,
      managerId,
      strategyMd,
      riskStyle,
      keywords
    } = req.body;

    if (!title || !category || baseAPR === undefined || !cycleDays || !minInvest) {
      return sendError(res, 'Title, category, baseAPR, cycleDays, and minInvest are required', 400);
    }

    const product = await prisma.product.create({
      data: {
        title,
        subtitle,
        category,
        baseAPR: parseFloat(baseAPR),
        cycleDays: parseInt(cycleDays, 10),
        minInvest: parseInt(minInvest, 10),
        totalAmount: totalAmount ? parseInt(totalAmount, 10) : null,
        managerId: managerId ? parseInt(managerId, 10) : null,
        strategyMd,
        riskStyle,
        keywords
      }
    });

    return sendSuccess(res, product, 'Product created successfully');

  } catch (error) {
    console.error('Create product error:', error);
    return sendError(res, 'Failed to create product', 500);
  }
};

/**
 * Update product by ID
 */
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      subtitle,
      category,
      baseAPR,
      cycleDays,
      minInvest,
      totalAmount,
      raisedAmount,
      status,
      managerId,
      strategyMd,
      riskStyle,
      keywords
    } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (subtitle !== undefined) updateData.subtitle = subtitle;
    if (category !== undefined) updateData.category = category;
    if (baseAPR !== undefined) updateData.baseAPR = parseFloat(baseAPR);
    if (cycleDays !== undefined) updateData.cycleDays = parseInt(cycleDays, 10);
    if (minInvest !== undefined) updateData.minInvest = parseInt(minInvest, 10);
    if (totalAmount !== undefined) updateData.totalAmount = parseInt(totalAmount, 10);
    if (raisedAmount !== undefined) updateData.raisedAmount = parseInt(raisedAmount, 10);
    if (status !== undefined) updateData.status = status;
    if (managerId !== undefined) updateData.managerId = parseInt(managerId, 10);
    if (strategyMd !== undefined) updateData.strategyMd = strategyMd;
    if (riskStyle !== undefined) updateData.riskStyle = riskStyle;
    if (keywords !== undefined) updateData.keywords = keywords;

    const product = await prisma.product.update({
      where: { id: parseInt(id, 10) },
      data: updateData
    });

    return sendSuccess(res, product, 'Product updated successfully');

  } catch (error) {
    console.error('Update product error:', error);
    if (error.code === 'P2025') {
      return sendError(res, 'Product not found', 404);
    }
    return sendError(res, 'Failed to update product', 500);
  }
};

/**
 * Delete product by ID
 */
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.product.delete({
      where: { id: parseInt(id, 10) }
    });

    return sendSuccess(res, null, 'Product deleted successfully');

  } catch (error) {
    console.error('Delete product error:', error);
    if (error.code === 'P2025') {
      return sendError(res, 'Product not found', 404);
    }
    return sendError(res, 'Failed to delete product', 500);
  }
};
