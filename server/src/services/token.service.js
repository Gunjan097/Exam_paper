const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const env = require('../config/env')
const AppError = require('../utils/AppError')

const BCRYPT_ROUNDS = 12

const signAccessToken = (payload) =>
  jwt.sign(payload, env.jwtAccessSecret, { expiresIn: env.jwtAccessTtl })

const signRefreshToken = (payload) =>
  jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshTtl })

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, env.jwtRefreshSecret)
  } catch {
    throw new AppError('Invalid or expired refresh token', 401)
  }
}

const hashPassword = (plain) => bcrypt.hash(plain, BCRYPT_ROUNDS)

const comparePassword = (plain, hash) => bcrypt.compare(plain, hash)

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashPassword,
  comparePassword,
}
