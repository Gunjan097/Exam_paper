const nodemailer = require('nodemailer')
const env = require('../config/env')

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  auth: { user: env.smtp.user, pass: env.smtp.pass },
})

const sendResetEmail = async (toEmail, resetToken) => {
  const resetUrl = `${env.clientUrl}/reset-password?token=${resetToken}`

  await transporter.sendMail({
    from: env.smtp.from,
    to: toEmail,
    subject: 'Password Reset — Exam Platform',
    html: `
      <p>You requested a password reset.</p>
      <p><a href="${resetUrl}">Click here to reset your password</a></p>
      <p>This link expires in 10 minutes.</p>
      <p>If you did not request this, ignore this email.</p>
    `,
  })
}

module.exports = { sendResetEmail }
