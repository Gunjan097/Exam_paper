const { requireRole } = require('../../src/middleware/role')

const mockNext = jest.fn()
beforeEach(() => mockNext.mockReset())

test('calls next() when role matches', () => {
  const req = { user: { role: 'school_admin' } }
  requireRole('school_admin', 'superadmin')(req, {}, mockNext)
  expect(mockNext).toHaveBeenCalledWith()
})

test('calls next with AppError 403 when role does not match', () => {
  const req = { user: { role: 'teacher' } }
  requireRole('school_admin')(req, {}, mockNext)
  expect(mockNext).toHaveBeenCalledWith(
    expect.objectContaining({ statusCode: 403 })
  )
})
