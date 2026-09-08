// middleware/auth.js
// Express "middleware" is just a function that runs before your route handler.
// This one checks for a valid login token (JWT) and, if valid, attaches the
// user's id to the request so every protected route knows who is asking.

const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization; // expected format: "Bearer <token>"

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId; // now available to every route that uses this middleware
    next(); // continue to the actual route handler
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token, please log in again' });
  }
}

module.exports = requireAuth;
