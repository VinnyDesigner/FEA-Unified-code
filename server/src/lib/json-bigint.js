'use strict';

// JSON.stringify cannot handle BigInt by default; this patch converts them to strings.
BigInt.prototype.toJSON = function () {
  return this.toString();
};
