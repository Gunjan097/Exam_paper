# Exam Paper Platform — Plan 1: Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the full monorepo, define the complete database schema, implement JWT auth endpoints, add role-based middleware, expose a user profile route, and seed the superadmin — the foundation every other plan builds on.

**Architecture:** Monorepo with `/server` (Express API) and `/client` (Next.js, stubbed for now). All API routes versioned under `/api/v1/`. JWT-based stateless auth: short-lived `accessToken` in response body (for mobile), long-lived `refreshToken` in httpOnly cookie (for web). Role guard middleware enforces teacher / school_admin / superadmin boundaries at the route level.

**Tech Stack:** Node.js 20, Express 4, Prisma 5, PostgreSQL (Neon), JWT (jsonwebtoken), bcrypt (cost 12), Nodemailer + Brevo SMTP, Jest, Supertest

## Global Constraints

- Node.js >= 20
- All API routes under `/api/v1/`
- All responses: `{ success: boolean, data?: any, message: string }`
- bcrypt cost factor: 12
- accessToken TTL: 15 minutes
- refreshToken TTL: 7 days, httpOnly cookie, sameSite: strict
- UTF-8 / Devanagari support in all text fields
- No `any` types — use JSDoc or explicit Prisma types

---

## File Map

```
exam/
  server/
    src/
      app.js                        Express app (no listen) — testable
      server.js                     Entry point: imports app, calls listen
      config/
        db.js                       Prisma client singleton
        env.js                      Validates + exports env vars
      middleware/
        auth.js                     verifyToken — reads Bearer header
        role.js                     requireRole(...roles) — checks req.user.role
        errorHandler.js             Global error handler
      routes/
        index.js                    Mounts all routers under /api/v1
        auth.routes.js              POST /auth/*
        users.routes.js             GET|PUT /users/*
      controllers/
        auth.controller.js          register, login, refresh, forgotPassword, resetPassword
        users.controller.js         getMe, updateMe, changePassword
      services/
        token.service.js            signAccess, signRefresh, verifyRefresh
        email.service.js            sendResetEmail (Nodemailer)
      utils/
        apiResponse.js              ok(res, data, msg), fail(res, status, msg)
        AppError.js                 class AppError extends Error
    prisma/
      schema.prisma                 Full DB schema — all models
      seed.js                       Seeds one superadmin user
    tests/
      helpers/
        db.js                       Prisma mock factory
        request.js                  Supertest app wrapper
      auth.test.js                  Register, login, refresh, forgot/reset
      users.test.js                 GET /me, PUT /me, PUT /me/password
      middleware/
        auth.middleware.test.js     verifyToken unit tests
        role.middleware.test.js     requireRole unit tests
    .env.example
    jest.config.js
    package.json
  client/                           Stubbed — full UI in Plan 5
    package.json
  package.json                      Workspace root
```

---

### Task 1: Monorepo Scaffold

**Files:**
- Create: `package.json` (root)
- Create: `server/package.json`
- Create: `server/src/app.js`
- Create: `server/src/server.js`
- Create: `server/.env.example`
- Create: `server/jest.config.js`
- Create: `client/package.json`

**Interfaces:**
- Produces: `app` (Express instance) importable by tests; `server.js` entry point

- [ ] **Step 1: Create root workspace package.json**

```json
{
  "name": "exam-platform",
  "private": true,
  "workspaces": ["server", "client"],
  "scripts": {
    "server": "npm run dev --workspace=server",
    "client": "npm run dev --workspace=client"
  }
}
```

- [ ] **Step 2: Create server/package.json**

```json
{
  "name": "exam-server",
  "version": "1.0.0",
  "main": "src/server.js",
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "test": "jest --runInBand",
    "test:watch": "jest --watch"
  },
  "dependencies": {
    "@prisma/client": "^5.14.0",
    "bcryptjs": "^2.4.3",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "nodemailer": "^6.9.13",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "nodemon": "^3.1.0",
    "prisma": "^5.14.0",
    "supertest": "^7.0.0"
  }
}
```

- [ ] **Step 3: Create client/package.json (stub)**

```json
{
  "name": "exam-client",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build"
  }
}
```

- [ ] **Step 4: Create server/.env.example**

```
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
JWT_ACCESS_SECRET=change_me_access
JWT_REFRESH_SECRET=change_me_refresh
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
SMTP_HOST=smtp.brevo.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your_smtp_key
SMTP_FROM=noreply@yourapp.com
CLIENT_URL=http://localhost:3000
PORT=4000
NODE_ENV=development
```

- [ ] **Step 5: Create server/jest.config.js**

```js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFiles: ['dotenv/config'],
}
```

- [ ] **Step 6: Create server/src/app.js**

```js
const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const { errorHandler } = require('./middleware/errorHandler')
const routes = require('./routes/index')

const app = express()

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

app.use('/api/v1', routes)

app.get('/health', (_, res) => res.json({ status: 'ok' }))

app.use(errorHandler)

module.exports = app
```

- [ ] **Step 7: Create server/src/server.js**

```js
require('dotenv').config()
const app = require('./app')

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
```

- [ ] **Step 8: Install dependencies**

```bash
cd server && npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 9: Commit**

```bash
git add package.json server/package.json server/src/app.js server/src/server.js server/.env.example server/jest.config.js client/package.json
git commit -m "feat: scaffold monorepo with Express server and Next.js client stub"
```

---

### Task 2: Prisma Schema + Neon Connection

**Files:**
- Create: `server/prisma/schema.prisma`
- Create: `server/src/config/db.js`
- Create: `server/src/config/env.js`

**Interfaces:**
- Produces: `prisma` (PrismaClient) exported from `config/db.js` — used by all services and controllers

- [ ] **Step 1: Copy .env.example and fill DATABASE_URL**

```bash
cp server/.env.example server/.env
# Edit server/.env with your Neon connection string
```

Get your connection string from: https://console.neon.tech → your project → Connection Details → copy the "Pooled connection" string.

- [ ] **Step 2: Create server/prisma/schema.prisma**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DATABASE_URL")
}

enum Role {
  teacher
  school_admin
  superadmin
}

enum Board {
  RBSE
  CBSE
}

enum Language {
  English
  Hindi
}

enum Medium {
  English
  Hindi
}

enum QuestionType {
  MCQ
  ShortAnswer
  LongAnswer
  FillInBlank
  TrueFalse
  MatchColumn
}

enum Difficulty {
  Easy
  Medium
  Hard
}

enum Source {
  platform
  teacher
}

enum ExamType {
  UnitTest
  MidTerm
  Final
  PreBoard
  Custom
}

enum PaperStatus {
  draft
  generating
  generated
  failed
}

enum Plan {
  free
  teacher_pro
  school_basic
  school_pro
}

model User {
  id           String    @id @default(cuid())
  email        String    @unique
  passwordHash String    @map("password_hash")
  name         String
  role         Role      @default(teacher)
  schoolId     String?   @map("school_id")
  school       School?   @relation(fields: [schoolId], references: [id])
  isActive     Boolean   @default(true) @map("is_active")
  resetToken   String?   @map("reset_token")
  resetTokenAt DateTime? @map("reset_token_at")
  createdAt    DateTime  @default(now()) @map("created_at")
  papers       Paper[]
  questions    Question[]

  @@map("users")
}

model School {
  id           String        @id @default(cuid())
  name         String
  address      String?
  city         String?
  state        String?
  pincode      String?
  isActive     Boolean       @default(true) @map("is_active")
  createdAt    DateTime      @default(now()) @map("created_at")
  users        User[]
  papers       Paper[]
  subscription Subscription?

  @@map("schools")
}

model Question {
  id            String         @id @default(cuid())
  board         Board
  class         Int
  subject       String
  chapterNo     Int?           @map("chapter_no")
  chapterName   String         @map("chapter_name")
  topic         String?
  language      Language
  medium        Medium
  type          QuestionType
  questionText  String         @map("question_text")
  optionA       String?        @map("option_a")
  optionB       String?        @map("option_b")
  optionC       String?        @map("option_c")
  optionD       String?        @map("option_d")
  correctAnswer String         @map("correct_answer")
  explanation   String?
  marks         Int
  difficulty    Difficulty
  source        Source         @default(platform)
  teacherId     String?        @map("teacher_id")
  teacher       User?          @relation(fields: [teacherId], references: [id])
  isApproved    Boolean        @default(false) @map("is_approved")
  isActive      Boolean        @default(true) @map("is_active")
  createdAt     DateTime       @default(now()) @map("created_at")
  paperQuestions PaperQuestion[]

  @@map("questions")
}

model Blueprint {
  id          String   @id @default(cuid())
  board       Board
  class       Int
  subject     String
  name        String
  sections    Json
  totalMarks  Int      @map("total_marks")
  timeMinutes Int      @map("time_minutes")
  isOfficial  Boolean  @default(true) @map("is_official")
  createdAt   DateTime @default(now()) @map("created_at")
  papers      Paper[]

  @@map("blueprints")
}

model Paper {
  id               String        @id @default(cuid())
  teacherId        String        @map("teacher_id")
  teacher          User          @relation(fields: [teacherId], references: [id])
  schoolId         String        @map("school_id")
  school           School        @relation(fields: [schoolId], references: [id])
  blueprintId      String?       @map("blueprint_id")
  blueprint        Blueprint?    @relation(fields: [blueprintId], references: [id])
  board            Board
  class            Int
  subject          String
  medium           Medium
  examType         ExamType      @map("exam_type")
  examTitle        String        @map("exam_title")
  academicYear     String        @map("academic_year")
  examDate         DateTime?     @map("exam_date")
  timeAllowed      Int           @map("time_allowed")
  maxMarks         Int           @map("max_marks")
  instructions     String?
  includeAnswerKey Boolean       @default(true) @map("include_answer_key")
  status           PaperStatus   @default(draft)
  pdfUrl           String?       @map("pdf_url")
  answerKeyUrl     String?       @map("answer_key_url")
  createdAt        DateTime      @default(now()) @map("created_at")
  questions        PaperQuestion[]

  @@map("papers")
}

model PaperQuestion {
  id            String   @id @default(cuid())
  paperId       String   @map("paper_id")
  paper         Paper    @relation(fields: [paperId], references: [id])
  questionId    String   @map("question_id")
  question      Question @relation(fields: [questionId], references: [id])
  sectionName   String   @map("section_name")
  orderNo       Int      @map("order_no")
  marksOverride Int?     @map("marks_override")

  @@map("paper_questions")
}

model Subscription {
  id            String   @id @default(cuid())
  schoolId      String?  @unique @map("school_id")
  school        School?  @relation(fields: [schoolId], references: [id])
  userId        String?  @map("user_id")
  plan          Plan
  startsAt      DateTime @map("starts_at")
  endsAt        DateTime @map("ends_at")
  isActive      Boolean  @default(true) @map("is_active")
  razorpaySubId String?  @map("razorpay_subscription_id")
  createdAt     DateTime @default(now()) @map("created_at")

  @@map("subscriptions")
}
```

- [ ] **Step 3: Create server/src/config/db.js**

```js
const { PrismaClient } = require('@prisma/client')

const prisma = global.__prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma
}

module.exports = prisma
```

The `global.__prisma` prevents creating multiple client instances during hot-reload in development.

- [ ] **Step 4: Create server/src/config/env.js**

```js
const required = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM',
  'CLIENT_URL',
]

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`)
  }
}

module.exports = {
  databaseUrl: process.env.DATABASE_URL,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtAccessTtl: process.env.JWT_ACCESS_TTL || '15m',
  jwtRefreshTtl: process.env.JWT_REFRESH_TTL || '7d',
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM,
  },
  clientUrl: process.env.CLIENT_URL,
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
}
```

- [ ] **Step 5: Run Prisma migration**

```bash
cd server
npx prisma generate
npx prisma migrate dev --name init
```

Expected output:
```
✔ Generated Prisma Client
✔ Applied migration `20260621000000_init`
```

- [ ] **Step 6: Verify tables were created**

```bash
npx prisma studio
```

Open `http://localhost:5555` — you should see all 7 tables: users, schools, questions, blueprints, papers, paper_questions, subscriptions.

- [ ] **Step 7: Commit**

```bash
git add server/prisma/schema.prisma server/src/config/db.js server/src/config/env.js server/prisma/migrations
git commit -m "feat: add Prisma schema with all models and Neon connection"
```

---

### Task 3: API Utilities

**Files:**
- Create: `server/src/utils/apiResponse.js`
- Create: `server/src/utils/AppError.js`
- Create: `server/src/middleware/errorHandler.js`
- Create: `server/src/routes/index.js`

**Interfaces:**
- Produces:
  - `ok(res, data, msg)` → 200 `{ success: true, data, message }`
  - `fail(res, status, msg)` → `{ success: false, message }`
  - `class AppError(message, statusCode)` — thrown anywhere, caught by errorHandler
  - `errorHandler(err, req, res, next)` — Express error middleware

- [ ] **Step 1: Create server/src/utils/AppError.js**

```js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

module.exports = AppError
```

- [ ] **Step 2: Create server/src/utils/apiResponse.js**

```js
const ok = (res, data, message = 'Success') =>
  res.status(200).json({ success: true, data, message })

const created = (res, data, message = 'Created') =>
  res.status(201).json({ success: true, data, message })

const fail = (res, statusCode, message) =>
  res.status(statusCode).json({ success: false, message })

module.exports = { ok, created, fail }
```

- [ ] **Step 3: Create server/src/middleware/errorHandler.js**

```js
const AppError = require('../utils/AppError')

const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    })
  }

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: `${err.meta?.target?.join(', ')} already exists`,
    })
  }

  console.error('Unhandled error:', err)
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
  })
}

module.exports = { errorHandler }
```

- [ ] **Step 4: Create server/src/routes/index.js**

```js
const { Router } = require('express')
const authRoutes = require('./auth.routes')
const usersRoutes = require('./users.routes')

const router = Router()

router.use('/auth', authRoutes)
router.use('/users', usersRoutes)

module.exports = router
```

(More routers will be added in Plans 2–4 via `router.use(...)` here.)

- [ ] **Step 5: Commit**

```bash
git add server/src/utils/AppError.js server/src/utils/apiResponse.js server/src/middleware/errorHandler.js server/src/routes/index.js
git commit -m "feat: add API response utils, AppError class, and error handler middleware"
```

---

### Task 4: Auth Utilities (JWT + bcrypt)

**Files:**
- Create: `server/src/services/token.service.js`
- Create: `server/tests/helpers/db.js`
- Create: `server/tests/helpers/request.js`

**Interfaces:**
- Produces:
  - `signAccessToken(payload)` → JWT string, TTL 15m
  - `signRefreshToken(payload)` → JWT string, TTL 7d
  - `verifyRefreshToken(token)` → decoded payload or throws AppError 401
  - `hashPassword(plain)` → bcrypt hash (cost 12)
  - `comparePassword(plain, hash)` → boolean

- [ ] **Step 1: Create server/src/services/token.service.js**

```js
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const env = require('../config/env')
const AppError = require('../utils/AppError')

const BCRYPT_ROUNDS = 12

const signAccessToken = (payload) =>
  jwt.sign(payload, env.jwtAccessSecret, { expiresIn: env.jwtAccessTtl })

const signRefreshToken = (payload) =>
  jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshTtl })

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, env.jwtRefreshSecret)
  } catch {
    throw new AppError('Invalid or expired refresh token', 401)
  }
}

const hashPassword = (plain) => bcrypt.hash(plain, BCRYPT_ROUNDS)

const comparePassword = (plain, hash) => bcrypt.compare(plain, hash)

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashPassword,
  comparePassword,
}
```

- [ ] **Step 2: Create server/tests/helpers/db.js (Prisma mock)**

```js
const prisma = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  school: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  $disconnect: jest.fn(),
}

const resetMocks = () => {
  Object.values(prisma).forEach((model) => {
    if (typeof model === 'object') {
      Object.values(model).forEach((fn) => {
        if (fn.mockReset) fn.mockReset()
      })
    }
  })
}

module.exports = { prisma, resetMocks }
```

- [ ] **Step 3: Create server/tests/helpers/request.js**

```js
const supertest = require('supertest')
const app = require('../../src/app')

module.exports = supertest(app)
```

- [ ] **Step 4: Write token service tests**

Create `server/tests/token.service.test.js`:

```js
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
```

- [ ] **Step 5: Run tests — expect pass**

```bash
cd server && npm test tests/token.service.test.js
```

Expected:
```
PASS tests/token.service.test.js
  token.service
    ✓ signAccessToken returns a JWT string
    ✓ verifyRefreshToken decodes valid refresh token
    ✓ verifyRefreshToken throws 401 for invalid token
    ✓ hashPassword produces a bcrypt hash
    ✓ comparePassword returns true for correct password
    ✓ comparePassword returns false for wrong password
```

- [ ] **Step 6: Commit**

```bash
git add server/src/services/token.service.js server/tests/helpers/ server/tests/token.service.test.js
git commit -m "feat: add token service (JWT + bcrypt) with tests"
```

---

### Task 5: Auth Endpoints — Register & Login

**Files:**
- Create: `server/src/controllers/auth.controller.js`
- Create: `server/src/routes/auth.routes.js`
- Create: `server/src/services/email.service.js`
- Create: `server/tests/auth.test.js`

**Interfaces:**
- Consumes: `signAccessToken`, `signRefreshToken`, `hashPassword`, `comparePassword` from `token.service.js`; `prisma` from `config/db.js`
- Produces:
  - `POST /api/v1/auth/register` → `201 { data: { user, accessToken } }` + refreshToken cookie
  - `POST /api/v1/auth/login` → `200 { data: { user, accessToken } }` + refreshToken cookie

- [ ] **Step 1: Write failing tests for register and login**

Create `server/tests/auth.test.js`:

```js
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
```

- [ ] **Step 2: Run tests — expect FAIL (controllers don't exist yet)**

```bash
cd server && npm test tests/auth.test.js
```

Expected: FAIL — "Cannot find module '../src/controllers/auth.controller.js'"

- [ ] **Step 3: Create server/src/controllers/auth.controller.js**

```js
const prisma = require('../config/db')
const {
  hashPassword,
  comparePassword,
  signAccessToken,
  signRefreshToken,
} = require('../services/token.service')
const { ok, created, fail } = require('../utils/apiResponse')
const AppError = require('../utils/AppError')

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7d in ms
}

const setRefreshCookie = (res, userId, role) => {
  const token = signRefreshToken({ id: userId, role })
  res.cookie('refreshToken', token, COOKIE_OPTS)
}

const safeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  schoolId: user.schoolId,
})

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      throw new AppError('name, email, and password are required', 400)
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) throw new AppError('Email already registered', 409)

    const passwordHash = await hashPassword(password)
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: 'teacher' },
    })

    setRefreshCookie(res, user.id, user.role)
    const accessToken = signAccessToken({ id: user.id, role: user.role })

    created(res, { user: safeUser(user), accessToken }, 'Registration successful')
  } catch (err) {
    next(err)
  }
}

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      throw new AppError('email and password are required', 400)
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.isActive) throw new AppError('Invalid credentials', 401)

    const valid = await comparePassword(password, user.passwordHash)
    if (!valid) throw new AppError('Invalid credentials', 401)

    setRefreshCookie(res, user.id, user.role)
    const accessToken = signAccessToken({ id: user.id, role: user.role })

    ok(res, { user: safeUser(user), accessToken }, 'Login successful')
  } catch (err) {
    next(err)
  }
}

module.exports = { register, login }
```

- [ ] **Step 4: Create server/src/routes/auth.routes.js**

```js
const { Router } = require('express')
const { register, login } = require('../controllers/auth.controller')

const router = Router()

router.post('/register', register)
router.post('/login', login)

module.exports = router
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
cd server && npm test tests/auth.test.js
```

Expected:
```
PASS tests/auth.test.js
  POST /api/v1/auth/register
    ✓ 201 — creates user and returns accessToken
    ✓ 409 — duplicate email
    ✓ 400 — missing name
  POST /api/v1/auth/login
    ✓ 200 — valid credentials return accessToken
    ✓ 401 — wrong password
    ✓ 401 — user not found
```

- [ ] **Step 6: Commit**

```bash
git add server/src/controllers/auth.controller.js server/src/routes/auth.routes.js server/tests/auth.test.js
git commit -m "feat: add register and login endpoints with tests"
```

---

### Task 6: Auth Endpoints — Refresh + Forgot/Reset Password

**Files:**
- Modify: `server/src/controllers/auth.controller.js`
- Modify: `server/src/routes/auth.routes.js`
- Create: `server/src/services/email.service.js`

**Interfaces:**
- Consumes: `verifyRefreshToken` from `token.service.js`; `sendResetEmail` from `email.service.js`
- Produces:
  - `POST /api/v1/auth/refresh` → `200 { data: { accessToken } }`
  - `POST /api/v1/auth/forgot-password` → `200 { message: "Reset email sent" }`
  - `POST /api/v1/auth/reset-password` → `200 { message: "Password reset successful" }`

- [ ] **Step 1: Add failing tests to auth.test.js**

Append to `server/tests/auth.test.js`:

```js
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
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd server && npm test tests/auth.test.js
```

Expected: FAIL — refresh / forgot / reset handlers not implemented.

- [ ] **Step 3: Create server/src/services/email.service.js**

```js
const nodemailer = require('nodemailer')
const env = require('../config/env')

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  auth: { user: env.smtp.user, pass: env.smtp.pass },
})

const sendResetEmail = async (toEmail, resetToken) => {
  const resetUrl = `${env.clientUrl}/reset-password?token=${resetToken}`

  await transporter.sendMail({
    from: env.smtp.from,
    to: toEmail,
    subject: 'Password Reset — Exam Platform',
    html: `
      <p>You requested a password reset.</p>
      <p><a href="${resetUrl}">Click here to reset your password</a></p>
      <p>This link expires in 10 minutes.</p>
      <p>If you did not request this, ignore this email.</p>
    `,
  })
}

module.exports = { sendResetEmail }
```

- [ ] **Step 4: Add refresh, forgotPassword, resetPassword to auth.controller.js**

Add these functions to `server/src/controllers/auth.controller.js` (after the existing `login` function):

```js
const { verifyRefreshToken } = require('../services/token.service')
const { sendResetEmail } = require('../services/email.service')
const crypto = require('crypto')

const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken
    if (!token) throw new AppError('Refresh token missing', 401)

    const payload = verifyRefreshToken(token)

    const user = await prisma.user.findUnique({ where: { id: payload.id } })
    if (!user || !user.isActive) throw new AppError('User not found', 401)

    const accessToken = signAccessToken({ id: user.id, role: user.role })
    ok(res, { accessToken }, 'Token refreshed')
  } catch (err) {
    next(err)
  }
}

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body
    const user = await prisma.user.findUnique({ where: { email } })

    if (user) {
      const token = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 min

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: token, resetTokenAt: expiresAt },
      })

      await sendResetEmail(email, token).catch(() => {}) // don't fail if email fails
    }

    // Always return 200 — prevents email enumeration
    ok(res, null, 'If that email exists, a reset link has been sent')
  } catch (err) {
    next(err)
  }
}

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body
    if (!token || !newPassword) throw new AppError('token and newPassword required', 400)

    const user = await prisma.user.findFirst({ where: { resetToken: token } })
    if (!user) throw new AppError('Invalid or expired token', 400)

    if (user.resetTokenAt < new Date()) {
      throw new AppError('Reset token has expired', 400)
    }

    const passwordHash = await hashPassword(newPassword)
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenAt: null },
    })

    ok(res, null, 'Password reset successful')
  } catch (err) {
    next(err)
  }
}

module.exports = { register, login, refresh, forgotPassword, resetPassword }
```

- [ ] **Step 5: Update auth.routes.js**

```js
const { Router } = require('express')
const {
  register,
  login,
  refresh,
  forgotPassword,
  resetPassword,
} = require('../controllers/auth.controller')

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/refresh', refresh)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)

module.exports = router
```

- [ ] **Step 6: Run all auth tests — expect PASS**

```bash
cd server && npm test tests/auth.test.js
```

Expected: all 11 tests pass.

- [ ] **Step 7: Commit**

```bash
git add server/src/controllers/auth.controller.js server/src/routes/auth.routes.js server/src/services/email.service.js
git commit -m "feat: add refresh, forgot-password, and reset-password endpoints"
```

---

### Task 7: Auth Middleware (verifyToken + requireRole)

**Files:**
- Create: `server/src/middleware/auth.js`
- Create: `server/src/middleware/role.js`
- Create: `server/tests/middleware/auth.middleware.test.js`
- Create: `server/tests/middleware/role.middleware.test.js`

**Interfaces:**
- Produces:
  - `verifyToken` — Express middleware; reads `Authorization: Bearer <token>`, sets `req.user = { id, role }`; throws 401 if missing/invalid
  - `requireRole(...roles)` — Express middleware factory; throws 403 if `req.user.role` not in `roles`

- [ ] **Step 1: Write failing tests for verifyToken**

Create `server/tests/middleware/auth.middleware.test.js`:

```js
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
```

- [ ] **Step 2: Write failing tests for requireRole**

Create `server/tests/middleware/role.middleware.test.js`:

```js
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
```

- [ ] **Step 3: Run tests — expect FAIL**

```bash
cd server && npm test tests/middleware/
```

Expected: FAIL — middleware files don't exist.

- [ ] **Step 4: Create server/src/middleware/auth.js**

```js
const jwt = require('jsonwebtoken')
const env = require('../config/env')
const AppError = require('../utils/AppError')

const verifyToken = (req, res, next) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError('Authorization token missing', 401))
  }

  const token = header.slice(7)
  try {
    req.user = jwt.verify(token, env.jwtAccessSecret)
    next()
  } catch {
    next(new AppError('Invalid or expired token', 401))
  }
}

module.exports = { verifyToken }
```

- [ ] **Step 5: Create server/src/middleware/role.js**

```js
const AppError = require('../utils/AppError')

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return next(new AppError('You do not have permission to perform this action', 403))
  }
  next()
}

module.exports = { requireRole }
```

- [ ] **Step 6: Run tests — expect PASS**

```bash
cd server && npm test tests/middleware/
```

Expected: all 5 tests pass.

- [ ] **Step 7: Commit**

```bash
git add server/src/middleware/auth.js server/src/middleware/role.js server/tests/middleware/
git commit -m "feat: add verifyToken and requireRole middleware with tests"
```

---

### Task 8: User Profile Endpoints

**Files:**
- Create: `server/src/controllers/users.controller.js`
- Create: `server/src/routes/users.routes.js`
- Create: `server/tests/users.test.js`

**Interfaces:**
- Consumes: `verifyToken` middleware; `prisma.user`
- Produces:
  - `GET /api/v1/users/me` → `200 { data: { user } }` — requires auth
  - `PUT /api/v1/users/me` → `200 { data: { user } }` — update name
  - `PUT /api/v1/users/me/password` → `200 { message: "Password updated" }` — change password

- [ ] **Step 1: Write failing tests**

Create `server/tests/users.test.js`:

```js
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
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd server && npm test tests/users.test.js
```

Expected: FAIL — controller not found.

- [ ] **Step 3: Create server/src/controllers/users.controller.js**

```js
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
```

- [ ] **Step 4: Create server/src/routes/users.routes.js**

```js
const { Router } = require('express')
const { getMe, updateMe, changePassword } = require('../controllers/users.controller')
const { verifyToken } = require('../middleware/auth')

const router = Router()

router.use(verifyToken)

router.get('/me', getMe)
router.put('/me', updateMe)
router.put('/me/password', changePassword)

module.exports = router
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
cd server && npm test tests/users.test.js
```

Expected: all 5 tests pass.

- [ ] **Step 6: Commit**

```bash
git add server/src/controllers/users.controller.js server/src/routes/users.routes.js server/tests/users.test.js
git commit -m "feat: add user profile endpoints (GET/PUT /me, PUT /me/password)"
```

---

### Task 9: Database Seed (Superadmin)

**Files:**
- Create: `server/prisma/seed.js`

**Interfaces:**
- Produces: one superadmin user seeded in the DB; `npx prisma db seed` command works

- [ ] **Step 1: Create server/prisma/seed.js**

```js
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const email = process.env.SUPERADMIN_EMAIL || 'admin@examplatform.com'
  const password = process.env.SUPERADMIN_PASSWORD || 'Admin@1234'

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`Superadmin already exists: ${email}`)
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: {
      name: 'Platform Admin',
      email,
      passwordHash,
      role: 'superadmin',
    },
  })

  console.log(`✅ Superadmin created: ${user.email}`)
  console.log(`   Password: ${password}`)
  console.log(`   ⚠ Change the password after first login!`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

- [ ] **Step 2: Add seed config to server/package.json**

Add this inside the `package.json` object:

```json
"prisma": {
  "seed": "node prisma/seed.js"
}
```

- [ ] **Step 3: Run seed**

```bash
cd server && npx prisma db seed
```

Expected:
```
✅ Superadmin created: admin@examplatform.com
   Password: Admin@1234
   ⚠ Change the password after first login!
```

- [ ] **Step 4: Verify in Prisma Studio**

```bash
npx prisma studio
```

Open Users table — confirm one user with role `superadmin`.

- [ ] **Step 5: Run full test suite to confirm nothing broke**

```bash
cd server && npm test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add server/prisma/seed.js server/package.json
git commit -m "feat: add superadmin seed script"
```

---

### Task 10: Next.js Client Scaffold + Auth Pages + Route Protection

**Files:**
- Create: `client/` (full Next.js 14 App Router setup)
- Create: `client/src/lib/api.js`
- Create: `client/src/lib/auth.js`
- Create: `client/src/app/layout.jsx`
- Create: `client/src/app/(auth)/login/page.jsx`
- Create: `client/src/app/(auth)/register/page.jsx`
- Create: `client/src/app/(auth)/forgot-password/page.jsx`
- Create: `client/src/app/dashboard/page.jsx`
- Create: `client/middleware.js`
- Create: `client/.env.local.example`

**Interfaces:**
- Consumes: `POST /api/v1/auth/login`, `POST /api/v1/auth/register`, `POST /api/v1/auth/refresh`
- Produces: login/register/forgot-password pages; protected `/dashboard` route

- [ ] **Step 1: Scaffold Next.js app**

```bash
cd /home/kharra/Documents/projects/exam
npx create-next-app@14 client --js --app --no-tailwind --src-dir --eslint --no-turbopack --import-alias "@/*"
```

When prompted, answer: No to Tailwind (we'll add manually), Yes to App Router.

- [ ] **Step 2: Install dependencies**

```bash
cd client && npm install axios js-cookie
```

- [ ] **Step 3: Create client/.env.local.example**

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

Copy to `.env.local` and fill in.

- [ ] **Step 4: Create client/src/lib/api.js**

```js
import axios from 'axios'
import Cookies from 'js-cookie'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // send httpOnly refreshToken cookie
})

// Attach accessToken to every request
api.interceptors.request.use((config) => {
  const token = Cookies.get('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401: try refresh, then retry original request once
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        )
        Cookies.set('accessToken', data.data.accessToken, { expires: 1 / 96 }) // 15 min
        original.headers.Authorization = `Bearer ${data.data.accessToken}`
        return api(original)
      } catch {
        Cookies.remove('accessToken')
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api
```

- [ ] **Step 5: Create client/src/lib/auth.js**

```js
import Cookies from 'js-cookie'
import api from './api'

export const login = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password })
  Cookies.set('accessToken', data.data.accessToken, { expires: 1 / 96 }) // 15 min
  return data.data.user
}

export const register = async (name, email, password) => {
  const { data } = await api.post('/auth/register', { name, email, password })
  Cookies.set('accessToken', data.data.accessToken, { expires: 1 / 96 })
  return data.data.user
}

export const logout = () => {
  Cookies.remove('accessToken')
  window.location.href = '/login'
}

export const getAccessToken = () => Cookies.get('accessToken')
```

- [ ] **Step 6: Create client/middleware.js**

```js
import { NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/reset-password']

export function middleware(request) {
  const token = request.cookies.get('accessToken')?.value
  const { pathname } = request.nextUrl

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (token && isPublic) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 7: Create client/src/app/layout.jsx**

```jsx
import './globals.css'

export const metadata = {
  title: 'Exam Paper Platform',
  description: 'Generate RBSE & CBSE exam papers instantly',
}

export default function RootLayout({ children }) {
  return (
    <html lang="hi">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 8: Create client/src/app/(auth)/login/page.jsx**

```jsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(form.email, form.password)
      router.push('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 24 }}>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            style={{ display: 'block', width: '100%', marginBottom: 12 }}
          />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            style={{ display: 'block', width: '100%', marginBottom: 12 }}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p><a href="/register">Don't have an account? Register</a></p>
      <p><a href="/forgot-password">Forgot password?</a></p>
    </div>
  )
}
```

- [ ] **Step 9: Create client/src/app/(auth)/register/page.jsx**

```jsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { register } from '@/lib/auth'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await register(form.name, form.email, form.password)
      router.push('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 24 }}>
      <h1>Register</h1>
      <form onSubmit={handleSubmit}>
        {['name', 'email', 'password'].map((field) => (
          <div key={field}>
            <label>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
            <input
              type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              required
              style={{ display: 'block', width: '100%', marginBottom: 12 }}
            />
          </div>
        ))}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <p><a href="/login">Already have an account? Login</a></p>
    </div>
  )
}
```

- [ ] **Step 10: Create client/src/app/(auth)/forgot-password/page.jsx**

```jsx
'use client'
import { useState } from 'react'
import api from '@/lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div style={{ maxWidth: 400, margin: '80px auto', padding: 24 }}>
        <h1>Check your email</h1>
        <p>If that email is registered, a reset link has been sent.</p>
        <a href="/login">Back to Login</a>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 24 }}>
      <h1>Forgot Password</h1>
      <form onSubmit={handleSubmit}>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ display: 'block', width: '100%', marginBottom: 12 }}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 11: Create client/src/app/dashboard/page.jsx (stub)**

```jsx
export default function DashboardPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Dashboard</h1>
      <p>Welcome! Full dashboard coming in Plan 5.</p>
    </div>
  )
}
```

- [ ] **Step 12: Start both servers and verify login flow manually**

```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

Open `http://localhost:3000`:
1. Should redirect to `/login` (no token)
2. Register a teacher account → should redirect to `/dashboard`
3. Go to `/login` when logged in → should redirect to `/dashboard`
4. Clear cookies → `/dashboard` should redirect to `/login`

- [ ] **Step 13: Commit**

```bash
git add client/
git commit -m "feat: add Next.js client with auth pages and route protection middleware"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Monorepo structure — Task 1
- ✅ All DB models (User, School, Question, Blueprint, Paper, PaperQuestion, Subscription) — Task 2
- ✅ Auth: register, login, refresh, forgot-password, reset-password — Tasks 5–6
- ✅ JWT + bcrypt (cost 12) — Task 4
- ✅ refreshToken httpOnly cookie + accessToken in body (mobile-ready) — Tasks 5–6
- ✅ verifyToken middleware — Task 7
- ✅ requireRole middleware — Task 7
- ✅ GET/PUT /me, PUT /me/password — Task 8
- ✅ Superadmin seed — Task 9
- ✅ Next.js auth pages — Task 10
- ✅ Route protection (middleware.js) — Task 10

**Not in this plan (deferred to correct plans):**
- Question CRUD → Plan 2
- Paper generation → Plan 3
- Admin/superadmin routes → Plan 4
- Full UI design → Plan 5
- Subscriptions/Razorpay → Plan 4

**Edge case noted:** Free plan 5-papers/month limit enforcement — addressed in Plan 4 (subscription middleware).
