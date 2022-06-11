'use strict';

var response = require('../res');
var parsetoken = require('./parseJWT');
const conn = require('../koneksi');
var mysql = require('mysql');
var updateSaldo = require('./update_saldo');
var insertHistory = require('./insertHistory');
var insertPembayaran = require('./insertPembayaran');

function serverErrorResponse(error) {
    throw error;
}

function successResponse(message, res){
    return response.success(message, res)
}

function userErrorResponse(message, res){
    return response.failed(message, res)
}

// menampilkan saldo user
exports.tampilSaldo = function (req, res){
    var token = req.headers.authorization;
    var data = parsetoken(token)

    conn.query('SELECT * FROM daftar_client WHERE id_user = ?', [data.id_user], function(error, rows, fields){
        if(error){
            return serverErrorResponse(error);
        } else {
            return res.status(200).json({
                id_user: rows[0].id_user,
                name: rows[0].nama_client,
                pass: rows[0].password,
                email: rows[0].email,
                jumlah: rows[0].saldo,
                nomor_wallet: rows[0].nomor_wallet
            })
        }
    });
};

// TOP UP - JUMLAH
exports.topUp = function(req,res){
    var token = req.headers.authorization;
    var data = parsetoken(token);

    var saldo = req.body.jumlah;

    var idTopUp = req.params.id_user;
    var idPengirim = data.id_user;

    // Diri sendiri / admin yang top up
    if (idTopUp == data.id_user || data.role == 1){
        // Mencegah user top up negatif (tetapi bisa untuk admin)
        if(saldo <= 0 && data.role == 0){
            return userErrorResponse("Saldo top up harus lebih dari 0", res)
        }
        
        // User tidak ada
        conn.query("SELECT * FROM daftar_client WHERE id_user = ?", [idTopUp], function(error, rows, fields){
            if (error) return serverErrorResponse(error);
    
            if(rows.length == 0){
                return userErrorResponse("User tidak ditemukan", res)
            }
        })
    
        updateSaldo(idTopUp, saldo)
        
        insertHistory("topup", data.nomor_wallet, idPengirim, idTopUp, saldo)

        return successResponse("Top Up berhasil", res)
    } else {
        return userErrorResponse("Anda tidak dapat mengakses halaman ini", res)
    }
}

// POST BAYAR 
exports.bayar = function(req, res){
    var token = req.headers.authorization;
    var dataToken = parsetoken(token);

    var dataPostman = {
        id_user: req.body.id_user,
        nama_barang: req.body.nama_barang,
        harga: parseInt(req.body.harga),
        wallet: req.body.wallet,
        nomor_wallet: req.body.nomor_wallet
    };
    // wallet: memilih e wallet yang mana
    // nomor wallet: dari get profile

    // id_user kosong
    if(dataPostman.id_user == null){
        return userErrorResponse("Masukkan id_user", res)
    }

    // Bukan diri sendiri / admin
    if(dataPostman.id_user == dataToken.id_user || dataPostman.role == 1){
        // Harga nya <= 0
        if(dataPostman.harga <= 0){
            return userErrorResponse("Harga harus lebih dari 0", res)
        }
    
        // Barang & harga nya kosong
        if(dataPostman.nama_barang == null || dataPostman.harga == null){
            return userErrorResponse("Masukkan nama_barang dan harga", res)
        }
    
        // Ngecek Nomor Wallet (kalau tidak ada nomor wallet)
        if(dataPostman.nomor_wallet == null){
            return userErrorResponse("Masukkan nomor_wallet", res)
        }
    
        // Query untuk ngecek nomor wallet
        var queryWallet = "SELECT id_user, nomor_wallet, saldo FROM daftar_client WHERE id_user = ? AND nomor_wallet = ?"
        var dataWallet = [dataPostman.id_user, dataPostman.nomor_wallet]
    
        var queryWallet = mysql.format(queryWallet, dataWallet);
    
        conn.query(queryWallet, function(error, rows, next){
            if (error) serverErrorResponse(error);
            
            // nomor wallet salah
            if (rows.length == 0){
                return userErrorResponse("Nomor wallet salah", res)
            } 
    
            // Nomor wallet benar
            // Duitnya cukup
            // insertHistory("bayar", dataPostman.nomor_wallet, id_user, 0, dataPostman.harga)
            conn.query("SELECT id_pembelian FROM pembayaran", function(error, rows, fields){
                if (error) return serverErrorResponse(error);
                if (rows.length == 0){
                    var nomorReferensi = 1;
                } else {
                    var nomorReferensi = rows[rows.length - 1].id_pembelian + 1;
                }
    
                insertPembayaran(dataPostman.nama_barang, dataPostman.id_user, dataPostman.harga, dataPostman.nomor_wallet, nomorReferensi)
    
                var queryPembayaran = "SELECT * FROM pembayaran WHERE id_user = ? AND nama_barang = ?"
                var tablePembayaran = [dataPostman.id_user, dataPostman.nama_barang]
    
                queryPembayaran = mysql.format(queryPembayaran, tablePembayaran);
    
                conn.query(queryPembayaran, function(error, rows, fields){
                    if(error) return serverErrorResponse(error);

                    console.log(rows[rows.length - 1].id_pembelian)
    
                    return res.status(200).json({
                        "status": 200,
                        "id_pemesanan": rows[rows.length - 1].id_pembelian,
                        "message": "Pembelian berhasil, silahkan lanjutkan pembayaran dengan mengkonfirmasi pembayaran pada ewallet Anda"
                    })
                })
            })
        }
    )} else {
        return userErrorResponse("Anda tidak dapat mengakses halaman ini", res)
    }
}

// GET Pembelian
exports.cekPembayaran = function(req, res){
    var token = req.headers.authorization;
    var dataToken = parsetoken(token);

    var id_user = parseInt(req.params.id_user);
    console.log(id_user);

    // Diri Sendiri
    if (dataToken.id_user == id_user || dataToken.role == 1){
        
        var queryPembayaran = "SELECT id_user, id_pembelian, nama_barang, status FROM pembayaran WHERE id_user = ?"
        var tablePembayaran = [id_user]
    
        queryPembayaran = mysql.format(queryPembayaran, tablePembayaran);
    
        conn.query(queryPembayaran, function(error, rows, fields){
            if(error) return serverErrorResponse(error);
    
            if (rows.length == 0){
                var data = null
            } else {
                var data = []
                rows.forEach(element => {
                    data.push(element)
                })
            }
    
            return res.status(200).json({
                "status": 200,
                "data": data
            })
        })
    } else {
        return userErrorResponse("Anda tidak dapat mengakses halaman ini", res)
    }
}

// GET Pembelian:id
exports.cekIDPembayaran = function(req, res){
    var token = req.headers.authorization;
    var dataToken = parsetoken(token);

    var idUser = req.params.id_user;
    var idPembelian = req.params.id_pembelian;

    // Bukan diri sendiri atau admin
    if (dataToken.id_user == idUser || dataToken.role == 1){
        var queryPembayaran = "SELECT id_user, id_pembelian, nama_barang, harga, wallet, nomor_wallet, status FROM pembayaran WHERE id_user = ? AND id_pembelian = ?"
        var tablePembayaran = [idUser, idPembelian]
    
        queryPembayaran = mysql.format(queryPembayaran, tablePembayaran);
    
        conn.query(queryPembayaran, function(error, rows, fields){
            if(error) return serverErrorResponse(error);
    
            if (rows.length == 0){
                var data = null
            } else {
                var data = []
                rows.forEach(element => {
                    data.push(element)
                })
            }
            
            return res.status(200).json({
                "status": 200,
                "data": data
            })
        })   
    } else {
        return userErrorResponse("Anda tidak dapat mengakses halaman ini", res)
    }
}

// POST Transaksi
exports.transaksi = function(req, res){
    var dataPostman = {
        jumlah: req.body.jumlah,
        nomor_wallet_client: req.body.nomor_wallet_client,
        nomor_wallet_ecommerce: req.body.nomor_wallet_ecommerce,
        referensi: req.body.referensi
    }

    // Query untuk ngecek nomor wallet dan referensi
    var queryWallet = "SELECT * FROM pembayaran WHERE nomor_wallet = ? AND referensi = ?"
    var dataWallet = [dataPostman.nomor_wallet_client, dataPostman.referensi]

    var queryWallet = mysql.format(queryWallet, dataWallet);

    conn.query(queryWallet, function(error, rows, next){
        if (error) serverErrorResponse(error);
        
        // Nomor wallet/ nomor referensi salah
        if (rows.length == 0){
            return userErrorResponse("Nomor wallet atau nomor referensi tidak ditemukan", res)
        } 

        if (rows[0].status == "PembayaranBerhasil"){
            return userErrorResponse("Pembayaran sudah selesai", res);
        }

        // Cek Saldo user
        var queryCekSaldo = "SELECT id_user, nomor_wallet, saldo FROM daftar_client WHERE nomor_wallet = ?"
        var tableCekSaldo = [dataPostman.nomor_wallet_client]

        queryCekSaldo = mysql.format(queryCekSaldo, tableCekSaldo);

        conn.query(queryCekSaldo, function(error, result, fields){
            // Duitnya tidak cukup
            if(rows[0].saldo < dataPostman.jumlah){
                return userErrorResponse("Saldo anda tidak cukup", res)
            } else {
                // Duitnya cukup
                insertHistory('bayar', dataPostman.nomor_wallet_client, result[0].id_user, 0, dataPostman.jumlah)
                updateSaldo(result[0].id_user, (dataPostman.jumlah * (-1)))
                
                // Update message pembayaran berhasil
                var queryPembayaran = "UPDATE pembayaran SET status = 'PembayaranBerhasil' WHERE nomor_wallet = ? AND referensi = ?"
                var tablePembayaran = [dataPostman.nomor_wallet_client, dataPostman.referensi]
    
                queryPembayaran = mysql.format(queryPembayaran, tablePembayaran);
    
                conn.query(queryPembayaran, function(error, rows, fields){
                    if(error) return serverErrorResponse(error);
    
                    return successResponse("Permintaan pembayaran berhasil", res)
                })
            }
            
        })
    })
}

// TRANSFER - penerima, jumah
exports.transfer = function(req, res){
    var token = req.headers.authorization;
    var dataToken = parsetoken(token);

    var dataPostman = {
        email: req.body.email,
        jumlah: parseInt(req.body.jumlah),
    };

    // Penerima kosong
    if(dataPostman.email == null){
        return userErrorResponse("Penerima tidak boleh kosong", res)
    }

    // Jumlah gaada
    if(dataPostman.jumlah <= 0){
        return userErrorResponse("Jumlah yang ditransfer harus lebih dari 0", res)
    }

    // Query untuk mencari receiver
    var selectReceiver = ("SELECT id_user, email FROM daftar_client WHERE email = ?");
    var dataSelectReceiver = [dataPostman.email];
    
    selectReceiver = mysql.format(selectReceiver, dataSelectReceiver);
    

    conn.query(selectReceiver, function(error, result, fields){
        if (error) return serverErrorResponse(error)
        
        // Penerima tidak ditemukan
        if(result.length != 1){
            return userErrorResponse("Penerima tidak ditemukan", res)
        }

        var idPengirim = dataToken.id_user;
        var idPenerima = result[0].id_user;

        // Cari id_user & saldo pengirim
        conn.query("SELECT id_user, saldo FROM daftar_client WHERE id_user = ?", [idPengirim], function(error, rows, fields){
            if (error) return serverErrorResponse(error);
            
            // Penerimanya diri sendiri
            if(idPenerima == idPengirim){
                return userErrorResponse("Tidak dapat transfer ke diri sendiri", res);
            }

            // Uangnya kurang
            if (rows[0].saldo < dataPostman.jumlah){
                return userErrorResponse("Saldo anda tidak mencukupi", res)
            }
            
            // Uangnya cukup
            else if (rows[0].saldo >= dataPostman.jumlah){
                // Mengurangi saldo pengirim
                updateSaldo(idPengirim, dataPostman.jumlah * (-1));

                // Menambah saldo penerima
                updateSaldo(idPenerima, dataPostman.jumlah);
                insertHistory("transfer", dataToken.nomor_wallet, idPengirim, idPenerima, dataPostman.jumlah)
                return successResponse("Transfer berhasil", res);
            }
        })
    }
)}

// GET HISTORY
exports.history = function(req, res){
    var token = req.headers.authorization;
    var dataToken = parsetoken(token);

    var idClient = dataToken.id_user

    var queryHistoryTopUp = "SELECT id_history, nomor_wallet, id_pengirim, id_penerima, waktu, nominal FROM history WHERE (id_pengirim = ? OR id_penerima = ?) AND jenis_transaksi = 'topup'"
    var tableHistoryTopUp = [idClient, idClient]
    
    var queryHistoryBayar = "SELECT id_history, nomor_wallet, waktu, nominal FROM history WHERE (id_pengirim = ?) AND jenis_transaksi = 'bayar'"
    var tableHistoryBayar = [idClient]

    var queryHistoryTransfer = "SELECT id_history, nomor_wallet, id_pengirim, id_penerima, waktu, nominal FROM history WHERE (id_pengirim = ? OR id_penerima = ?) AND jenis_transaksi = 'transfer'"
    var tableHistoryTransfer = [idClient, idClient] 
    
    var queryHistoryTopUp = mysql.format(queryHistoryTopUp, tableHistoryTopUp)
    var queryHistoryBayar = mysql.format(queryHistoryBayar, tableHistoryBayar)
    var queryHistoryTransfer = mysql.format(queryHistoryTransfer, tableHistoryTransfer)

    conn.query(queryHistoryTopUp, function(error, rows, fields){
        if (error) serverErrorResponse(error);

        var topup = []
        if (rows.length == 0){
            topup = null;
        }
        if (rows.length >= 1){
            rows.forEach(element => {
                topup.push(element)
            });
        } else if (rows.length == 1){
            topup = rows[0]
        }
        
        conn.query(queryHistoryBayar, function(error, rows, fields){
            if(error) serverErrorResponse(error);
    
            if (rows.length == 0){
                var bayar = null;
            }
            if (rows.length >= 1){
                var bayar = []
                rows.forEach(element => {
                    bayar.push(element)
                })
            } else if (rows.length == 1){
                var bayar = []
                bayar = rows[0]
            }
            
            conn.query(queryHistoryTransfer,function(error, rows, fields){
                if(error) serverErrorResponse(error);
            
                if (rows.length == 0){
                    var transfer = null;
                }
                if (rows.length >= 1){
                    var transfer = []
                    rows.forEach(element =>{
                        if(element.id_pengirim == idClient){
                            element.nominal *= -1
                        }
                        transfer.push(element)
                    })
                } else if (rows.length == 1){
                    var transfer = []
                    transfer = rows[0]
                }

                if (transfer == null && bayar == null && topup == null){
                    return successResponse("User belum pernah melakukan transaksi", res)
                } else {
                    return res.status(200).json({
                        "status": 200,
                        "topup": topup,
                        "bayar": bayar,
                        "transfer": transfer 
                    })
                }

            })
        })
    })
}