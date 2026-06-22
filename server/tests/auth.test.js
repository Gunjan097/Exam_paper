jest.mock('../src/config/db', () => require('./helpers/db').prisma)
jest.mock('../src/services/email.service', () => ({ sendResetEmail: jest.fn().mockResolvedValue(undefined) }))

const request = require('./helpers/request')
const { prisma, resetMocks } = require('./helpers/db')
const { hashPassword } = require('../src/services/token.service')

beforeEach(() => resetMocks())

describe('POST /api/v1/auth/register', () => {
  const body = {
    name: 'Anju Teacher',
    email: 'anju@school.com',
    password: 'StrongPass1!',
  }

  test('201 — creates user and returns accessToken', async () => {
    prisma.user.findUnique.mockResolvedValue(null) // email not taken
    prisma.user.create.mockResolvedValue({
      id: 'u1',
      name: body.name,
      email: body.email,
      role: 'teacher',
      schoolId: null,
    })

    const res = await request.post('/api/v1/auth/register').send(body)

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.accessToken).toBeDefined()
    expect(res.body.data.user.email).toBe(body.email)
    expect(res.headers['set-cookie']).toBeDefined()
  })

  test('409 — duplicate email', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: body.email })

    const res = await request.post('/api/v1/auth/register').send(body)

    expect(res.status).toBe(409)
    expect(res.body.success).toBe(false)
  })

  test('400 — missing name', async () => {
    const res = await request
      .post('/api/v1/auth/register')
      .send({ email: body.email, password: body.password })

    expect(res.status).toBe(400)
  })
})

describe('POST /api/v1/auth/login', () => {
  test('200 — valid credentials return accessToken', async () => {
    const hash = await hashPassword('StrongPass1!')
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'anju@school.com',
      passwordHash: hash,
      name: 'Anju Teacher',
      role: 'teacher',
      schoolId: null,
      isActive: true,
    })

    const res = await request
      .post('/api/v1/auth/login')
      .send({ email: 'anju@school.com', password: 'StrongPass1!' })

    expect(res.status).toBe(200)
    expect(res.body.data.accessToken).toBeDefined()
    expect(res.headers['set-cookie']).toBeDefined()
  })

  test('401 — wrong password', async () => {
    const hash = await hashPassword('StrongPass1!')
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'anju@school.com',
      passwordHash: hash,
      isActive: true,
    })

    const res = await request
      .post('/api/v1/auth/login')
      .send({ email: 'anju@school.com', password: 'wrongpass' })

    expect(res.status).toBe(401)
  })

  test('401 — user not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null)

    const res = await request
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@x.com', password: 'pass' })

    expect(res.status).toBe(401)
  })
})

describe('POST /api/v1/auth/refresh', () => {
  test('200 — valid refresh cookie returns new accessToken', async () => {
    const { signRefreshToken } = require('../src/services/token.service')
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      role: 'teacher',
      isActive: true,
    })

    const refreshToken = signRefreshToken({ id: 'u1', role: 'teacher' })

    const res = await request
      .post('/api/v1/auth/refresh')
      .set('Cookie', `refreshToken=${refreshToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data.accessToken).toBeDefined()
  })

  test('401 — missing cookie', async () => {
    const res = await request.post('/api/v1/auth/refresh')
    expect(res.status).toBe(401)
  })
})

describe('POST /api/v1/auth/forgot-password', () => {
  test('200 — always returns success (no email enumeration)', async () => {
    prisma.user.findUnique.mockResolvedValue(null) // user not found — still 200

    const res = await request
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'nobody@x.com' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })
})

describe('POST /api/v1/auth/reset-password', () => {
  test('200 — valid token resets password', async () => {
    const crypto = require('crypto')
    const token = crypto.randomBytes(32).toString('hex')
    const futureDate = new Date(Date.now() + 10 * 60 * 1000)

    prisma.user.findFirst.mockResolvedValue({
      id: 'u1',
      resetToken: token,
      resetTokenAt: futureDate,
    })
    prisma.user.update.mockResolvedValue({ id: 'u1' })

    const res = await request
      .post('/api/v1/auth/reset-password')
      .send({ token, newPassword: 'NewPass1!' })

    expect(res.status).toBe(200)
  })

  test('400 — expired token', async () => {
    const pastDate = new Date(Date.now() - 60 * 1000)
    prisma.user.findFirst.mockResolvedValue({
      id: 'u1',
      resetToken: 'sometoken',
      resetTokenAt: pastDate,
    })

    const res = await request
      .post('/api/v1/auth/reset-password')
      .send({ token: 'sometoken', newPassword: 'NewPass1!' })

    expect(res.status).toBe(400)
  })
})
