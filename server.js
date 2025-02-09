var http = require('http');
const dotenv = require('dotenv');
dotenv.config();

const app = require('./src/app');
const server = http.createServer(app);

const APP_PORT = process.env.APP_PORT || 2000;
const NODE_ENV = process.env.NODE_ENV || "development";
server.listen(APP_PORT, () => { 
    console.log(`server running...PORT: ${APP_PORT} with env:  ${NODE_ENV}`);
});

module.exports = {server}

