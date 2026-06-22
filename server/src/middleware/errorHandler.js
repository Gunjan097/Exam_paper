const AppError = require('../utils/AppError')

const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    })
  }

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: `${err.meta?.target?.join(', ')} already exists`,
    })
  }

  console.error('Unhandled error:', err)
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
  })
}

module.exports = { errorHandler }
