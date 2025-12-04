const app = require('../app')
const request = require('supertest')

const baseUser = { email: 'matt_art@gmail.com', password: '123456' }

async function loginAndGetToken (credentials = baseUser) {
  const response = await request(app).post('/login').send(credentials)
  expect(response.statusCode).toBe(200)
  expect(response.body).toHaveProperty('token')
  return response.body.token
}

describe('Users API (niveau 4.2)', () => {
  test('Mat_Art can log in and list users with a valid token', async () => {
    const token = await loginAndGetToken()
    const response = await request(app)
      .get('/api/users')
      .set('x-access-token', token)
    expect(response.statusCode).toBe(200)
    expect(response.body.message).toBe('Returning users')
    expect(Array.isArray(response.body.data)).toBe(true)
    expect(response.body.data.length).toBeGreaterThan(0)
  })

  test('should refuse login with wrong password', async () => {
    const response = await request(app)
      .post('/login')
      .send({ email: baseUser.email, password: 'badPass123!' })
    expect(response.statusCode).toBe(403)
    expect(response.body.status).toBe(false)
  })

  test('should block listing users without token', async () => {
    const response = await request(app).get('/api/users')
    expect(response.statusCode).toBe(401)
  })

  test('should block listing users with forged token', async () => {
    const response = await request(app)
      .get('/api/users')
      .set('x-access-token', 'invalid.token.value')
    expect(response.statusCode).toBe(401)
  })

  test('should refuse registration if password is weak', async () => {
    const response = await request(app)
      .post('/register')
      .send({ name: 'Weakie', email: 'weak@example.com', password: 'aaaaaaa' })
    expect(response.statusCode).toBe(400)
  })

  test('should register a new user and allow them to fetch the list', async () => {
    const uniqueEmail = `user_${Date.now()}@example.com`
    const registerResponse = await request(app)
      .post('/register')
      .send({ name: 'Nouveau', email: uniqueEmail, password: 'Str0ngP@ss!' })
    expect(registerResponse.statusCode).toBe(200)
    const token = await loginAndGetToken({ email: uniqueEmail, password: 'Str0ngP@ss!' })
    const listResponse = await request(app)
      .get('/api/users')
      .set('x-access-token', token)
    expect(listResponse.statusCode).toBe(200)
  })
})
