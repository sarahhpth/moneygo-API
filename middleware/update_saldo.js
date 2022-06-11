var mysql = require('mysql');
var conn = require('../koneksi');

function updateSaldo(idUser, saldo){
    var querySaldo = ("UPDATE daftar_client SET saldo = (daftar_client.saldo + ?) WHERE id_user = ?");
    var tableSaldo = [parseInt(saldo), parseInt(idUser)];

    querySaldo = mysql.format(querySaldo, tableSaldo);

    conn.query(querySaldo, function(error, rows, fields){
        if (error) throw error;
        else{
            // next();
        }
    })
}

module.exports = updateSaldo