const path = require('path');
const express = require('express');
require('dotenv').config({
  path: path.resolve(process.cwd(), `.env${process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : ''}`),
});
const session = require('express-session');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const { connect } = require('./db');
const route = require('./routes');
const agendaService = require('./services/agenda.service');
const { msal } = require('./services/ms.service');

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  const app = express();
  app.use(
    session({
      secret: process.env.JWT_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false, // set this to true on production
      },
    })
  );
  app.use(
    cors({
      origin: '*',
      methods: ['OPTIONS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: '*',
    })
  );
  app.set('view engine', 'ejs');
  app.set('views', path.resolve(__dirname, 'views'));
  app.use(morgan('combined'));
  app.use(route);

  app.use(
    '/docs/api',
    swaggerUi.serve,
    swaggerUi.setup(swaggerJsDoc(require('./swagger')), {
      explorer: true,
      swaggerOptions: { persistAuthorization: true },
    })
  );

  try {
    await connect();
  } catch (err) {
    console.log('============================================');
    console.log('Error connecting to database: ', err.message);
    console.log('============================================');
    process.exit(1);
  }
  await agendaService.start();
  app.listen(PORT, () => {
    app.locals.msal = msal;
    console.log('============================================');
    console.log(`Server up & running on port(${PORT}).`);
    console.log('============================================');
  });
}

bootstrap();

async function graceful() {
  await agendaService.stop();
  process.exit(0);
}

process.on('SIGTERM', graceful);
process.on('SIGINT', graceful);
