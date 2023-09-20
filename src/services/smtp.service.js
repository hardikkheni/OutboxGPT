const nodemailer = require('nodemailer');
const SMTPTransport = require('nodemailer/lib/smtp-transport');
const ejs = require('ejs');
const path = require('path');

/**
 * Send OTP
 * @param {Object} options
 * @param {Object} options.to
 * @param {string} options.to.name
 * @param {string} options.to.email
 * @param {Object} data
 * @param {string} data.url
 * @returns {Promise<SMTPTransport.SentMessageInfo>}
 */
async function newPasswordLink(options, data) {
  const payload = {
    ...data,
    to: options.to,
    from: { name: process.env.SYSTEM_EMAIL_FROM_NAME, email: process.env.SYSTEM_EMAIL_FROM_NAME },
  };
  const html = await ejs.renderFile(path.resolve(process.cwd(), 'src/views/email/reset-password.ejs'), payload, { async: true });
  return await send({
    from: `${payload.from.name} <${payload.from.email}>`,
    to: `${payload.to.name} <${payload.to.email}>`,
    subject: `${payload.to.name}, here's your reset password link.`,
    html,
  });
}

/**
 * Send invitationLink
 * @param {Object} options
 * @param {Object} options.to
 * @param {string} options.to.name
 * @param {string} options.to.email
 * @param {Object} data
 * @param {string} data.link
 * @returns {Promise<SMTPTransport.SentMessageInfo>}
 */
async function sendInviteLink(options, data) {
  const payload = {
    ...data,
    to: options.to,
    from: { name: process.env.SYSTEM_EMAIL_FROM_NAME, email: process.env.SYSTEM_EMAIL_FROM_NAME },
  };
  const html = await ejs.renderFile(path.resolve(process.cwd(), 'src/views/email/invite.ejs'), payload, { async: true });
  return await send({
    from: `${payload.from.name} <${payload.from.email}>`,
    to: `${payload.to.name} <${payload.to.email}>`,
    subject: `${payload.to.name}, here's your invitation url to login to active your account on AI Email Writer`,
    html,
  });
}

/**
 * Send invitationLink
 * @param {Object} options
 * @param {Object} options.from
 * @param {string} options.to.name
 * @param {string} options.to.email
 * @param {Object} data
 * @param {Object} data.user
 * @returns {Promise<SMTPTransport.SentMessageInfo>}
 */
async function contactUs(options, data) {
  const payload = {
    ...data,
    to: options.to,
    from: { name: process.env.SYSTEM_EMAIL_FROM_NAME, email: process.env.SYSTEM_EMAIL_FROM_NAME },
  };
  const html = await ejs.renderFile(path.resolve(process.cwd(), 'src/views/email/contact-us.ejs'), payload, { async: true });
  return await send({
    from: `${payload.from.name} <${payload.from.email}>`,
    to: `${payload.to.name} <${payload.to.email}>`,
    subject: `${payload.to.name}, thasnk you for contacting us. We will get back to you soon.`,
    html,
  });
}

/**
 * Send mail
 * @param {Object} options
 * @param {string} options.from
 * @param {string} options.to
 * @param {string} options.subject
 * @param {string} options.html
 * @param {string} options.text
 * @returns {Promise<SMTPTransport.SentMessageInfo>}
 */
async function send(options) {
  const transporter = nodemailer.createTransport({
    host: process.env.DEFAULT_SMTP_HOST,
    port: process.env.DEFAULT_SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.DEFAULT_SMTP_USER,
      pass: process.env.DEFAULT_SMTP_PASS,
    },
  });
  return await transporter.sendMail(options);
}

module.exports = { send, sendInviteLink, newPasswordLink, contactUs };
