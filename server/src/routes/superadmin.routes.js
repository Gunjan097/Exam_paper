const router = require('express').Router()
const { verifyToken } = require('../middleware/auth')
const { requireRole } = require('../middleware/role')

router.get('/questions/pending', verifyToken, requireRole('superadmin'), (req, res) => res.json({ questions: [] }))
router.put('/questions/:id/approve', verifyToken, requireRole('superadmin'), (req, res) => res.json({}))
router.put('/questions/:id/reject', verifyToken, requireRole('superadmin'), (req, res) => res.json({}))

module.exports = router
