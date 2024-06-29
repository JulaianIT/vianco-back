const mysql = require('mysql2');

// Configuración del pool de conexiones
const pool = mysql.createPool({
    host: "34.66.173.227",
    user: "soporte",
    password: "1034277764C",
    database: "viancoapp",
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000
});

module.exports = pool;
