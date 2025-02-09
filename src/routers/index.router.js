const V1Router = require('./v1.router');

module.exports = function (app) {

    // v1 app routes
    app.use('/1.0', [], V1Router);

} 