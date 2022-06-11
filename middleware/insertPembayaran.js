const conn = require('../koneksi');
var mysql = require('mysql');

function insertPembayaran(nama_barang, id_user, harga, nomor_wallet, referensi){
    var query = "INSERT INTO pembayaran(nama_barang, id_user, harga, wallet, nomor_wallet, status, referensi) VALUES (?, ?, ?, 'ecia', ?, 'MenungguPembayaran', ?)";
    var table = [nama_barang, id_user, harga, nomor_wallet, referensi]

    query = mysql.format(query, table);

    conn.query(query, function(error, rows, fields){
        if (error) throw error;
    })
}

module.exports = insertPembayaran