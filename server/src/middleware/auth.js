const jwt = require('jsonwebtoken')
const env = require('../config/env')
const AppError = require('../utils/AppError')

const verifyToken = (req, res, next) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError('Authorization token missing', 401))
  }

  const token = header.slice(7)
  try {
    req.user = jwt.verify(token, env.jwtAccessSecret)
    next()
  } catch {
    next(new AppError('Invalid or expired token', 401))
  }
}

module.exports = { verifyToken }
