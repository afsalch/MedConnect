const mysql = require('mysql2/promise');

let connection;

function handleDisconnect() {
    if (connection) return connection

    connection = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'Med connect',
    });
    connection.on('connection', function () { 
        console.log('New Database Connection Established')
    });

    connection.on('error', function (error) {
        console.log(`Database error: ${error}`)
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.log(`Attempting to reconnect...`)
            handleDisconnect();
        } else {
            throw err;
        }
    });
};

handleDisconnect();

module.exports = connection;
