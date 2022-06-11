const conn = require('../koneksi');
var mysql = require('mysql');

function insertHistory(jenis, nomor_wallet, id_pengirim, id_penerima, nominal){
    var query = "INSERT INTO history(jenis_transaksi, nomor_wallet, id_pengirim, id_penerima, nominal) VALUES (?, ?, ?, ?, ?)";
    var table = [jenis, nomor_wallet, id_pengirim, id_penerima, nominal]

    query = mysql.format(query, table);

    conn.query(query, function(error, rows, fields){
        if (error) throw error;
    })
}

module.exports = insertHistory