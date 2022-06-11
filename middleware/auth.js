var mysql = require('mysql');
var md5 = require('md5');
var response = require('../res');
var jwt = require('jsonwebtoken');
var config = require('../config/secret');
var ip = require('ip');
const conn = require('../koneksi');

var error1 = "hello";

function serverErrorResponse(error1, error) {
     return response.serverError(error1, error);
}
 
function successResponse(message, res){
     return response.success(message, res)
}
 
function userErrorResponse(message, res){
     return response.failed(message, res)
}

//controller untuk registrasi user
exports.registrasi = function (req, res) {
     var post = {
          name: req.body.name,
          password: req.body.pass,
          email: req.body.email,
          saldo: 0,
          role: req.body.role
     }

     var query = "SELECT email FROM daftar_client WHERE email = ?";
     var table = [post.email];

     query = mysql.format(query, table);

     // kalau ga ditulis role nya
     if(post.role == null){
          roleUser = false
     } else if (post.role == 1 || post.role == "admin") {
          roleUser = true
     }

     // kalau ada yang kosong
     if(post.email == null || post.name == null || post.password == null){
          return userErrorResponse("Email, pass dan name tidak boleh kosong", res)
     }

     var cariJumlahClient = "SELECT id_user FROM daftar_client"
     conn.query(cariJumlahClient, function(error, rows){
          var idTerakhir = rows[rows.length - 1].id_user

          var nomor_wallet = md5(config.secretKeyMoney + config.secretKey + idTerakhir.toString(16))
     
          conn.query(query, function (error, rows) {
               if (error) {
                    return serverErrorResponse(error1, error);
               } else {
                    // kalau gaada
                    if (rows.length == 0) {
                         var query = "INSERT INTO daftar_client (nama_client, email, password, nomor_wallet, saldo, role) VALUES (?, ?, ?, ?, ?, ?)";
                         var table = [post.name, post.email, post.password, nomor_wallet, post.saldo, roleUser];

                         conn.query(query, table, function(error, result){
                              if (error) return serverErrorResponse(error1, error);

                              return successResponse("Pendaftaran berhasil", res)
                         })

                    } else {
                         return userErrorResponse("Email telah terdaftar", res)
                    }
               }
          })
     })
}

// controller untuk login
exports.login = function (req, res) {
     var post = {
          email: req.body.email,
          password: req.body.pass
     }

     if (post.email == null || post.password == null){
          return userErrorResponse("Email dan pass tidak boleh kosong", res)
     }

     var query = "SELECT id_user, nama_client, email, password, nomor_wallet, role FROM daftar_client WHERE email=? AND password=?";
     var table = [post.email, post.password];

     query = mysql.format(query, table);

     conn.query(query, function (error, rows) {
          if (error) return serverErrorResponse(error1, error);

          if (rows.length == 1) {
               var token = jwt.sign({rows}, config.secret);

               return res.status(200).json({
                    "status": 200,
                    "token": token
               })
          } else {
               return userErrorResponse("Email atau password salah", res)
          }
     })
};             
 
