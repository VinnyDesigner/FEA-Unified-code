'use strict';

/**
 * MailerPort — interface contract for mailer adapters.
 * Concrete adapters must implement sendOtp and sendPasswordResetEmail.
 */
function MailerPort() {}

MailerPort.prototype.sendOtp = async function ({ to, code, purpose }) {
  throw new Error('Not implemented');
};

MailerPort.prototype.sendPasswordResetEmail = async function ({ to, token, purpose }) {
  throw new Error('Not implemented');
};

module.exports = { MailerPort };
