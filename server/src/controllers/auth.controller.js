const prisma = require('../config/db')
const {
  hashPassword,
  comparePassword,
  signAccessToken,
  signRefreshToken,
} = require('../services/token.service')
const { ok, created } = require('../utils/apiResponse')
const AppError = require('../utils/AppError')

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'strict',
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

module.exports = { register, login }
