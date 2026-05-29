'use strict';
const env = require('../config/env');

class Semaphore {
  constructor(max) { this.max = max; this.active = 0; }
  tryAcquire() { if (this.active >= this.max) return false; this.active++; return true; }
  release() { if (this.active > 0) this.active--; }
}

const exportSemaphore = new Semaphore(env.MAX_CONCURRENT_EXPORTS);

module.exports = { exportSemaphore };
