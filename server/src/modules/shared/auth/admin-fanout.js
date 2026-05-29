'use strict';

const { prismaMwq, prismaAqms } = require('../../../db/prisma');
const { logger } = require('../../../lib/logger');

const ALLOWED_FIELDS = new Set(['passwordHash', 'firstName', 'lastName', 'middleName', 'phoneNumber', 'emiratesId', 'role']);

async function writeAdminAcrossModules(field, value, email) {
  if (!ALLOWED_FIELDS.has(field)) return;

  const [mwqUser, aqmsUser] = await Promise.all([
    prismaMwq.user.findUnique({ where: { email } }),
    prismaAqms.user.findUnique({ where: { email } }),
  ]);

  if (!mwqUser || mwqUser.role !== 'ADMIN') return;

  await prismaMwq.user.update({ where: { email }, data: { [field]: value } });

  try {
    if (aqmsUser) {
      await prismaAqms.user.update({ where: { email }, data: { [field]: value } });
    }
  } catch (error) {
    logger.warn({ what: 'admin_fanout_partial_failure', email, field, error });
  }
}

module.exports = { writeAdminAcrossModules };
