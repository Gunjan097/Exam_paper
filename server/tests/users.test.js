jest.mock('../src/config/db', () => require('./helpers/db').prisma)

const request = require('./helpers/request')
const { prisma, resetMocks } = require('./helpers/db')
const { signAccessToken, hashPassword } = require('../src/services/token.service')

beforeEach(() => resetMocks())

const authHeader = (id = 'u1', role = 'teacher') => ({
  Authorization: `Bearer ${signAccessToken({ id, role })}`,
})

describe('GET /api/v1/users/me', () => {
  test('200 — returns current user', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      name: 'Anju',
      email: 'anju@x.com',
      role: 'teacher',
      schoolId: null,
    })

    const res = await request
      .get('/api/v1/users/me')
      .set(authHeader())

    expect(res.status).toBe(200)
    expect(res.body.data.user.email).toBe('anju@x.com')
  })

  test('401 — no token', async () => {
    const res = await request.get('/api/v1/users/me')
    expect(res.status).toBe(401)
  })
})

describe('PUT /api/v1/users/me', () => {
  test('200 — updates name', async () => {
    prisma.user.update.mockResolvedValue({
      id: 'u1',
      name: 'New Name',
      email: 'anju@x.com',
      role: 'teacher',
      schoolId: null,
    })

    const res = await request
      .put('/api/v1/users/me')
      .set(authHeader())
      .send({ name: 'New Name' })

    expect(res.status).toBe(200)
    expect(res.body.data.user.name).toBe('New Name')
  })
})

describe('PUT /api/v1/users/me/password', () => {
  test('200 — changes password with correct current password', async () => {
    const hash = await hashPassword('OldPass1!')
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', passwordHash: hash })
    prisma.user.update.mockResolvedValue({ id: 'u1' })

    const res = await request
      .put('/api/v1/users/me/password')
      .set(authHeader())
      .send({ currentPassword: 'OldPass1!', newPassword: 'NewPass1!' })

    expect(res.status).toBe(200)
  })

  test('401 — wrong current password', async () => {
    const hash = await hashPassword('OldPass1!')
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', passwordHash: hash })

    const res = await request
      .put('/api/v1/users/me/password')
      .set(authHeader())
      .send({ currentPassword: 'Wrong!', newPassword: 'NewPass1!' })

    expect(res.status).toBe(401)
  })
})
