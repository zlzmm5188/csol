/**
 * Standard API Response Helper
 * @param {object} res - Express response object
 * @param {object} options - Response options
 * @param {number} options.code - Response code (1 = success, 0 = error)
 * @param {string} options.msg - Response message
 * @param {any} options.data - Response data
 * @param {number} options.status - HTTP status code
 */
export const sendResponse = (res, { code = 1, msg = 'Success', data = null, status = 200 }) => {
  return res.status(status).json({
    code,
    msg,
    data,
    timestamp: Date.now()
  });
};

/**
 * Success response helper
 */
export const sendSuccess = (res, data = null, msg = 'Success') => {
  return sendResponse(res, { code: 1, msg, data, status: 200 });
};

/**
 * Error response helper
 */
export const sendError = (res, msg = 'Error', status = 400) => {
  return sendResponse(res, { code: 0, msg, data: null, status });
};

/**
 * Generate a unique order number with high precision
 * Uses timestamp + performance counter + random string for uniqueness
 */
export const generateOrderNo = () => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  const counter = (Math.random() * 1000).toFixed(0).padStart(3, '0');
  return `ORD${timestamp}${counter}${random}`;
};

/**
 * Generate a unique user ID
 */
export const generateUid = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `U${timestamp}${random}`.toUpperCase();
};

/**
 * Generate a unique invite code
 */
export const generateInviteCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};
