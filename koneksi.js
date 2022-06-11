var mysql = require('mysql');

// Create a connection
var conn = 
  mysql.createConnection({
    // host: "sql6.freemysqlhosting.net", 
    // port: "3306",
    // user: "sql6499049", 
    // password: "jnSzNvMWUa",
    // database: "sql6499049",
    // multipleStatements: true

    //cherry
    host: "sql6.freemysqlhosting.net", 
    port: "3306",
    user: "sql6498933", 
    password: "6tIXSJsPIZ",
    database: "sql6498933"
  });

conn.connect(function(err, conn){
    if(err) {
        console.log("MySQL tidak terkoneksi");
    }
    if(conn) console.log("MySQL terkoneksi");
})

module.exports = conn;