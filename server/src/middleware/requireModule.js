'use strict';

// requireModule(app) — application-access gate (Phase 3, grant-based).
// Passes when the user holds an ACTIVE grant for `app`, or an ACTIVE ADMIN
// grant on any application (admin ⇒ all apps). Falls back to the legacy
// role/module claims for tokens issued before the v2 (access[]) rollout.

const { hasActiveAdminGrant } = require('./requirePermission');

function requireModule(moduleName) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }

    const access = req.user.access;

    if (Array.isArray(access) && access.length > 0) {
      if (hasActiveAdminGrant(req.user)) return next();
      const grant = access.find((a) => a.app === moduleName && a.status === 'ACTIVE');
      if (grant) return next();
      return res.status(403).json({ error: { code: 'MODULE_MISMATCH', message: `Access restricted to ${moduleName} module` } });
    }

    // Legacy token (no access[]): fall back to the old role/module claims.
    if (req.user.role === 'ADMIN') return next();
    if (req.user.module === moduleName) return next();
    return res.status(403).json({ error: { code: 'MODULE_MISMATCH', message: `Access restricted to ${moduleName} module` } });
  };
}

module.exports = { requireModule };
