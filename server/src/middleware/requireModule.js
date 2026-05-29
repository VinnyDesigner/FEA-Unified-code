'use strict';

function requireModule(moduleName) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }
    if (req.user.role === 'ADMIN') {
      return next();
    }
    if (req.user.module !== moduleName) {
      return res.status(403).json({ error: { code: 'MODULE_MISMATCH', message: `Access restricted to ${moduleName} module` } });
    }
    next();
  };
}

module.exports = { requireModule };
