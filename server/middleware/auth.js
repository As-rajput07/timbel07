/**
 * Simple authentication middleware.
 * Validates the Authorization header against ADMIN_SECRET.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed authorization header' });
  }

  const token = authHeader.split(' ')[1];

  if (token !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  next();
}

module.exports = authMiddleware;
