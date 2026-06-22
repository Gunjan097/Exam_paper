const prisma = require('../config/db')
const {
  comparePassword,
  hashPassword,
} = require('../services/token.service')
const { ok } = require('../utils/apiResponse')
const AppError = require('../utils/AppError')

const safeUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  schoolId: u.schoolId,
})

const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    if (!user) throw new AppError('User not found', 404)
    ok(res, { user: safeUser(user) })
  } catch (err) {
    next(err)
  }
}

const updateMe = async (req, res, next) => {
  try {
    const { name } = req.body
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name },
    })
    ok(res, { user: safeUser(user) }, 'Profile updated')
  } catch (err) {
    next(err)
  }
}

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      throw new AppError('currentPassword and newPassword are required', 400)
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    const valid = await comparePassword(currentPassword, user.passwordHash)
    if (!valid) throw new AppError('Current password is incorrect', 401)

    const passwordHash = await hashPassword(newPassword)
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })

    ok(res, null, 'Password updated')
  } catch (err) {
    next(err)
  }
}

module.exports = { getMe, updateMe, changePassword }
