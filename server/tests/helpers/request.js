const supertest = require('supertest')
const app = require('../../src/app')

module.exports = supertest(app)
