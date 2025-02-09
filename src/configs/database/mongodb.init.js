const mongoose = require('mongoose');

function newConnection (uri) {

    const db = mongoose.createConnection(uri, {
        
    });
    db.on('error', err => {
        db.close().catch(() => { console.log(`MongoDB:: failed to close connection ${this.name}`) });
        console.error(`MongoDB:: failed to close connection ${this.name}. ${JSON.stringify(err)}`);
        console.error(`Stop server`);
        process.exit();
    });
    db.on('disconnected', (err) => {
        console.error(`MongoDB:: disconnected to close connection ${this.name}. ${JSON.stringify(err)}`);
    });
    db.on('connected', async function() {
        console.log(`MongoDB:: connected to ${this.name}`);
    });

    return db;

};

const MONGODB_URL = process.env.MONGODB_URL;
const AppDb = newConnection(MONGODB_URL);

module.exports = AppDb;