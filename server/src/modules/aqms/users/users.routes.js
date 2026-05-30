'use strict';

// Phase 3: AQMS user-management is served by the unified HL-backed routers.
// Kept as a thin alias so src/routes/index.js mounts stay unchanged.
module.exports = require('../../shared/users/users.routes');
