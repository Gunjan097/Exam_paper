jest.mock('../src/config/db', () => require('./helpers/db').prisma)

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
