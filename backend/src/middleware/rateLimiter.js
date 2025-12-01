import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter
 * Limits each IP to 100 requests per 15 minutes
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: {
    code: 0,
    msg: 'Too many requests, please try again later',
    data: null
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false // Disable the `X-RateLimit-*` headers
});

/**
 * Strict rate limiter for sensitive operations
 * Limits each IP to 10 requests per 15 minutes
 */
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per window
  message: {
    code: 0,
    msg: 'Too many requests, please try again later',
    data: null
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Auth rate limiter for login/register endpoints
 * Limits each IP to 5 requests per minute
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 requests per window
  message: {
    code: 0,
    msg: 'Too many authentication attempts, please try again later',
    data: null
  },
  standardHeaders: true,
  legacyHeaders: false
});
