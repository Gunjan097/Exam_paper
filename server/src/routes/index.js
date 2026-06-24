const { Router } = require('express')
const authRoutes = require('./auth.routes')
const usersRoutes = require('./users.routes')
const questionsRoutes = require('./questions.routes')
const adminRoutes = require('./admin.routes')
const superadminRoutes = require('./superadmin.routes')

const router = Router()

router.use('/auth', authRoutes)
router.use('/users', usersRoutes)
router.use('/questions', questionsRoutes)
router.use('/admin', adminRoutes)
router.use('/superadmin', superadminRoutes)

module.exports = router
