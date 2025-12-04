// Patches
const { inject, errorHandler } = require('express-custom-error')
inject() // Patch express in order to use async / await syntax
// Require Dependencies
const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const helmet = require('helmet')
const fs = require('fs')
const path = require('path')
const logger = require('./util/logger')
const publicRoutes = require('./routes/public.js')

// Instantiate an Express Application
const app = express()

// Configure Express App Instance
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Configure custom logger middleware
app.use(logger.dev, logger.combined)
app.use(cookieParser())
app.use(cors())
app.use(helmet())

// Swagger Documentation
const swaggerUi = require('swagger-ui-express')
const swaggerPath = path.join(__dirname, '..', 'swagger_output.json')
const swaggerFile = fs.existsSync(swaggerPath)
  ? require('../swagger_output.json')
  : { swagger: '2.0', info: { title: 'API Backend', version: '1.0.0' }, paths: {} }
app.use('/doc', swaggerUi.serve, swaggerUi.setup(swaggerFile))

// Assign Routes
app.use('/', publicRoutes)
app.use('/', require('./routes/router.js'))
// Handle errors
app.use(errorHandler())

if (process.env.PROXYREACT) {
  // if dev react server exists, serve all the others routes to
  const { createProxyMiddleware } = require('http-proxy-middleware')
  const reactProxy = createProxyMiddleware({
    target: 'http://localhost:5173/',
    changeOrigin: true,
    ws: true
  })
  app.use('/', reactProxy)
}

app.use('/', express.static('../frontend/dist'))
app.use('/', express.static('../frontend/public'))
app.use('/', express.static('./src/frontend'))
// Handle not valid route
app.use('*', (req, res) => {
  res
    .status(404)
    .json({ status: false, message: 'Endpoint Not Found' })
})
module.exports = app
