const prisma = require('../config/db')
const {
  hashPassword,
  comparePassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require('../services/token.service')
const { sendResetEmail } = require('../services/email.service')
const { ok, created } = require('../utils/apiResponse')
const AppError = require('../utils/AppError')
const crypto = require('crypto')

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7d in ms
}

const setRefreshCookie = (res, userId, role) => {
  const token = signRefreshToken({ id: userId, role })
  res.cookie('refreshToken', token, COOKIE_OPTS)
}

const safeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  schoolId: user.schoolId,
})

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      throw new AppError('name, email, and password are required', 400)
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) throw new AppError('Email already registered', 409)

    const passwordHash = await hashPassword(password)
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: 'teacher' },
    })

    setRefreshCookie(res, user.id, user.role)
    const accessToken = signAccessToken({ id: user.id, role: user.role })

    created(res, { user: safeUser(user), accessToken }, 'Registration successful')
  } catch (err) {
    next(err)
  }
}

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      throw new AppError('email and password are required', 400)
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.isActive) throw new AppError('Invalid credentials', 401)

    const valid = await comparePassword(password, user.passwordHash)
    if (!valid) throw new AppError('Invalid credentials', 401)

    setRefreshCookie(res, user.id, user.role)
    const accessToken = signAccessToken({ id: user.id, role: user.role })

    ok(res, { user: safeUser(user), accessToken }, 'Login successful')
  } catch (err) {
    next(err)
  }
}

const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken
    if (!token) throw new AppError('Refresh token missing', 401)

    const payload = verifyRefreshToken(token)

    const user = await prisma.user.findUnique({ where: { id: payload.id } })
    if (!user || !user.isActive) throw new AppError('User not found', 401)

    const accessToken = signAccessToken({ id: user.id, role: user.role })
    ok(res, { accessToken }, 'Token refreshed')
  } catch (err) {
    next(err)
  }
}

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body
    const user = await prisma.user.findUnique({ where: { email } })

    if (user) {
      const token = crypto.randomBytes(32).toString('hex')
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 min

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: tokenHash, resetTokenAt: expiresAt },
      })

      await sendResetEmail(email, token).catch(() => {}) // raw token goes in email link; don't fail if email fails
    }

    // Always return 200 — prevents email enumeration
    ok(res, null, 'If that email exists, a reset link has been sent')
  } catch (err) {
    next(err)
  }
}

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body
    if (!token || !newPassword) throw new AppError('token and newPassword required', 400)

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const user = await prisma.user.findFirst({ where: { resetToken: tokenHash } })
    if (!user) throw new AppError('Invalid or expired token', 400)

    if (user.resetTokenAt < new Date()) {
      throw new AppError('Reset token has expired', 400)
    }

    const passwordHash = await hashPassword(newPassword)
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenAt: null },
    })

    ok(res, null, 'Password reset successful')
  } catch (err) {
    next(err)
  }
}

module.exports = { register, login, refresh, forgotPassword, resetPassword }
