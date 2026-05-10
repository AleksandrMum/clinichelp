const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes');
const requestIdMiddleware = require('./middlewares/request-id.middleware');
const notFoundMiddleware = require('./middlewares/not-found.middleware');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestIdMiddleware);

app.use('/api', apiRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
