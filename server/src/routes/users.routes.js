const { Router } = require('express')
const { getMe, updateMe, changePassword } = require('../controllers/users.controller')
const { verifyToken } = require('../middleware/auth')

const router = Router()

router.use(verifyToken)

router.get('/me', getMe)
router.put('/me', updateMe)
router.put('/me/password', changePassword)

module.exports = router
