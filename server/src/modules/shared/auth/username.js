'use strict';

const crypto = require('crypto');

async function generateUserName(prismaClient, email) {
  const prefix = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');

  for (let attempt = 0; attempt < 10; attempt++) {
    const suffix = crypto.randomBytes(2).toString('hex');
    const userName = `${prefix}_${suffix}`;
    const existing = await prismaClient.user.findUnique({ where: { userName } });
    if (!existing) return userName;
  }
  throw new Error('Failed to generate a unique username after 10 attempts');
}

module.exports = { generateUserName };
