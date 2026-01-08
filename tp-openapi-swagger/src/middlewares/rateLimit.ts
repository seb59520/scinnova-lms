import rateLimit from 'express-rate-limit';

/**
 * Rate limiter pour protéger l'API contre les abus
 * 100 requêtes par fenêtre de 15 minutes par IP
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite de 100 requêtes par IP
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
    },
  },
  standardHeaders: true, // Retourne les headers RateLimit-* dans la réponse
  legacyHeaders: false, // Désactive les headers X-RateLimit-*
});



