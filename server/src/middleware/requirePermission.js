'use strict';

// requirePermission(code) — RBAC permission gate (Phase 3).
// Passes when the access token carries the permission `code` in its `perms[]`
// (perms are derived from the user's ACTIVE grants), OR when the user holds an
// ACTIVE ADMIN grant on any application (admin bypass — ADMIN has every perm).

function hasActiveAdminGrant(user) {
  return Array.isArray(user.access) && user.access.some((a) => a.role === 'ADMIN' && a.status === 'ACTIVE');
}

function requirePermission(code) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }
    const perms = Array.isArray(req.user.perms) ? req.user.perms : [];
    if (perms.includes(code) || hasActiveAdminGrant(req.user)) {
      return next();
    }
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: `Missing required permission: ${code}` } });
  };
}

module.exports = { requirePermission, hasActiveAdminGrant };
