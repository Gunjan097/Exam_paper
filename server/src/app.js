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
