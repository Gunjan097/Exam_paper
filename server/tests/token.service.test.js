const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashPassword,
  comparePassword,
} = require('../src/services/token.service')

describe('token.service', () => {
  const payload = { id: 'user_1', role: 'teacher' }

  test('signAccessToken returns a JWT string', () => {
    const token = signAccessToken(payload)
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)
  })

  test('verifyRefreshToken decodes valid refresh token', () => {
    const token = signRefreshToken(payload)
    const decoded = verifyRefreshToken(token)
    expect(decoded.id).toBe('user_1')
    expect(decoded.role).toBe('teacher')
  })

  test('verifyRefreshToken throws 401 for invalid token', () => {
    expect(() => verifyRefreshToken('bad.token.here')).toThrow(
      expect.objectContaining({ statusCode: 401 })
    )
  })

  test('hashPassword produces a bcrypt hash', async () => {
    const hash = await hashPassword('secret123')
    expect(hash).toMatch(/^\$2[ab]\$12\$/)
  })

  test('comparePassword returns true for correct password', async () => {
    const hash = await hashPassword('secret123')
    expect(await comparePassword('secret123', hash)).toBe(true)
  })

  test('comparePassword returns false for wrong password', async () => {
    const hash = await hashPassword('secret123')
    expect(await comparePassword('wrong', hash)).toBe(false)
  })
})
