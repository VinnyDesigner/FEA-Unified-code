'use strict';

const bcrypt = require('bcrypt');
const env = require('../../../config/env');

async function hashPassword(plain) {
  return bcrypt.hash(plain, env.BCRYPT_COST);
}

async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

module.exports = { hashPassword, comparePassword };
