const { verifyToken } = require('../../src/middleware/auth')
const { signAccessToken } = require('../../src/services/token.service')

const mockReq = (token) => ({
  headers: { authorization: token ? `Bearer ${token}` : undefined },
})
const mockRes = () => {
  const res = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}
const mockNext = jest.fn()

beforeEach(() => mockNext.mockReset())

test('sets req.user on valid token', () => {
  const token = signAccessToken({ id: 'u1', role: 'teacher' })
  const req = mockReq(token)
  verifyToken(req, mockRes(), mockNext)
  expect(req.user).toEqual(expect.objectContaining({ id: 'u1', role: 'teacher' }))
  expect(mockNext).toHaveBeenCalledWith()
})

test('calls next with AppError 401 if no token', () => {
  const req = mockReq(null)
  verifyToken(req, mockRes(), mockNext)
  expect(mockNext).toHaveBeenCalledWith(
    expect.objectContaining({ statusCode: 401 })
  )
})

test('calls next with AppError 401 if token is invalid', () => {
  const req = mockReq('bad.token.here')
  verifyToken(req, mockRes(), mockNext)
  expect(mockNext).toHaveBeenCalledWith(
    expect.objectContaining({ statusCode: 401 })
  )
})
