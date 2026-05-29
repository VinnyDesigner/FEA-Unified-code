'use strict';

const { verifyAccess } = require('../modules/shared/auth/tokens');

function requireAuth(req, res, next) {
  const header = req.headers?.authorization || req.headers?.Authorization || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing or malformed Authorization header' } });
  }
  try {
    const claims = verifyAccess(match[1]);
    req.user = {
      id: claims.sub,
      role: claims.role,
      module: claims.module,
      accountStatus: claims.accountStatus,
      email: claims.email,
    };
    return next();
  } catch (err) {
    if (err && err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: { code: 'TOKEN_EXPIRED', message: 'Access token expired' } });
    }
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } });
  }
}

module.exports = { requireAuth };
