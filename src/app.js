'use strict';
const express = require('express');
const cors = require('cors');
const app = express();

const corsOptions = {
    origin: "*",
    optionsSuccessStatus: 200 // For legacy browser support
}
app.use(cors(corsOptions));
app.options('*', cors());
app.use(express.urlencoded({ limit: '5mb', extended: true }));
  // parse application/json
app.use(express.json({limit: '5mb'}));
app.set('trust proxy', true);

// init mongodb
require('./configs/database/mongodb.init');


const requestIp = require('request-ip');
app.use(requestIp.mw())

require('./routers/index.router')(app);

const ErrorHandler = require('./middlewares/ErrorHandler');
// ERROR HANDLER MIDDLEWARE (Last middleware to use)
app.use(ErrorHandler);


module.exports = app;