const router = require('express').Router()
const { verifyToken } = require('../middleware/auth')
const { requireRole } = require('../middleware/role')

// Stubs — controllers added in Tasks 2-5
router.get('/', verifyToken, (req, res) => res.json({ questions: [] }))
router.post('/', verifyToken, requireRole('teacher', 'school_admin'), (req, res) => res.status(201).json({}))
router.put('/:id', verifyToken, requireRole('teacher', 'school_admin'), (req, res) => res.json({}))
router.delete('/:id', verifyToken, requireRole('teacher', 'school_admin'), (req, res) => res.json({}))
router.get('/import/template', verifyToken, (req, res) => res.json({}))
router.post('/import', verifyToken, requireRole('teacher', 'school_admin'), (req, res) => res.json({}))
router.post('/import/confirm', verifyToken, requireRole('teacher', 'school_admin'), (req, res) => res.json({}))

module.exports = router
