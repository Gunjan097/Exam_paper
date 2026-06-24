const multer = require('multer')
const { AppError } = require('./errorHandler')

const FIVE_MB = 5 * 1024 * 1024
const ALLOWED_MIMES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/csv',
]

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: FIVE_MB },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype) || file.originalname.endsWith('.csv')) {
      cb(null, true)
    } else {
      cb(new AppError('Only .xlsx and .csv files are allowed', 400))
    }
  },
})

module.exports = { upload }
