const mysql = require("mysql2/promise");

const connection = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

connection.getConnection()
    .then((conn) => {
        console.log("MySQL Connected Successfully");
        conn.release();
    })
    .catch((err) => {
        console.error("MySQL Connection Failed");
        console.error(err);
    });

module.exports = connection;