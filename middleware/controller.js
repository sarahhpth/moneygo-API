'use strict';

var response = require('../res');
const conn = require('../koneksi');
var mysql = require('mysql');
// var md5 = require('MD5');
var jwt = require('jsonwebtoken');
var config = require('../config/secret');
var ip = require('ip');

var parsetoken = require('./parseJWT'); //used once already logged in

//GET home
exports.index = function(req, res){
    response.success("Running....", res)
};

//POST register
exports.register = function(req, res){
    //req
    var post = {
        name : req.body.name,
        email : req.body.email,
        password : req.body.password,   //md5(req.body.password)
        role : '2', //blank
        balance : req.body.balance
    }
                                         
    var query = "SELECT email FROM users WHERE ?? = ?"; //double "??" for sql query, single "?" for variable
    var table = ["email", post.email];
    query = mysql.format(query, table);

    conn.query(query, function(error, rows){
        if(error){
            console.log(error);
        }else{
            if(rows.length == 0){   //post.email is not found in db
                var query = "INSERT INTO users (name, email, password, role, balance) VALUES (?, ?, ?, ?, ?)";     
                var table = [post.name, post.email, post.password, post.role, post.balance];

                conn.query(query, table, function(error, rows){
                    if(error){
                        console.log(error);
                    }else{
                        response.success("Registered", res);
                    }
                });
            }else{
                response.failed("Email is already registered", res); //else if found
            }
        }
    });
};

//POST login
exports.login = function(req, res){
    //req
    var post = {
        email : req.body.email,
        password : req.body.password
    }

    var query = "SELECT * FROM users WHERE ?? = ? AND ?? = ?";
    var table = ["password", post.password, "email", post.email];   // md5(post.password) if hashed
    query = mysql.format(query, table);

    conn.query(query, function(error, rows){
        
        console.log("test");
        if(error){
             
            // response.success("error", res);
        }else{
            if(rows.length == 1){
                var token = jwt.sign({rows}, config.secret, {
                    expiresIn: 1440
                });

                var user_id = rows[0].id;
                var data = {
                    user_id: user_id,
                    access_token: token,
                    ip_address: ip.address()
                }

                // var query = "INSERT INTO ?? SET ?";
                // var table = ["token"];
                // query = mysql.format(query, table);

                // conn.query(query, data, function(error, rows){
                    if(error){
                        console.log(error);
                    }else{
                        res.json({
                            success: true,
                            message: "Login successful",
                            token: token,
                            currUser: data.user_id
                        });
                    }
                // });
            }else{
                res.json({
                    "error": true,
                    "message": "Incorrect password or email"
                });

            }
        }
    });
};


//PUT user topup
exports.topup = function(req, res){
    //req
    var token = req.headers.authorization;
    var topup = req.body.balance;

    var data = parsetoken(token);
    
    // var data = parsedtoken.rows[0];
    // console.log(data);
    var id = data.id;

    conn.query('UPDATE users SET balance = balance + ? WHERE id = ?', [topup, id],
        function(error, rows, fields){
            if(error){
                console.log(error);
            }else{
                response.success("Topup successful", res);
            }
        });
};

//PUT transfer
exports.transfer = function(req, res){
    //req
    var receiver_email = req.body.email; //receiver's email
    var amount = req.body.balance;
    var token = req.headers.authorization;

    var data = parsetoken(token);
    // var data = parsedtoken.rows[0];
    
    var sender_id = data.id;
    var sender_name = data.name;
    
    conn.query('SELECT id, name FROM users WHERE email = ?', [receiver_email], function(error, rows, fields){
        var receiver_id = rows[0].id;
        var receiver_name = rows[0].name;
        if(error){
            console.log(error);
        }else if(sender_id == receiver_id){
            response.failed("You cannot transfer to yourself", res);
        }
        conn.query('UPDATE users SET balance = balance - ? WHERE id = ? ;'+
            'UPDATE users SET balance = balance + ? WHERE id = ? ',
            [amount, sender_id, amount, receiver_id],
            function(error, rows, fields){
                if(error){
                    console.log(error);
                }
                conn.query('SELECT balance FROM users WHERE id = ?', [sender_id], 
                    function(error, rows, fields){
                        var sender_balance = rows[0].balance;
                        if(sender_balance < amount){
                            response.failed("Balance is not sufficient. You need to topup", res);
                        }else{
                            response.success("Transfered successfully", res);
                        }
                    });
                    
                
        });

        // conn.query('UPDATE users SET balance = balance + ? WHERE id = ? ', 
        //     [amount, receiver_id],
        //     function(error, rows, fields){
        //         if(error){
        //             console.log(error);
        //         }else if(sender_id == receiver_id){
        //             response.failed("You cannot transfer to yourself", res);
        //         }else{
        //             if(rows[0].balance < amount){
        //                 response.failed("Balance is not sufficient. You need to topup", res);
        //             }else{
        //                 response.success("Transfered successfully", res);
        //             }
                    
        //         }
        // });

        conn.query('INSERT INTO transactions (sender_id,receiver_id,sender,receiver,amount) VALUES (?,?,?,?,?)', 
        [sender_id, receiver_id, sender_name, receiver_name, amount],
        function(error, rows, fields){
            if(error){
                console.log(error);
            }else if(sender_id == receiver_id){
                response.failed("You cannot transfer to yourself", res);
            }else{
                response.success("Transfered successfully", res);
            }
        });
    })

};


//GET profile
exports.profile = function(req, res){
    //req
    var token = req.headers.authorization;

    var data = parsetoken(token);
    // var data = parsedtoken.rows[0];

    var id = data.id;
    
    conn.query('SELECT * FROM users WHERE id = ?', [id],
        function(error, rows, fields){
            if(error){
                console.log(error);
            }else{
                res.json({
                    id: rows[0].id,
                    name: rows[0].name,
                    email: rows[0].email,
                    password: rows[0].password,
                    balance: rows[0].balance,
                    // "id": data.id,
                    // "name": data.name,
                    // "email": data.email,
                    // "password": data.password,
                    // "balance": data.balance
                });
                // console.log(data);
                // res.json(data);
                // response.success(data, res);
            }
    });
    
  
};








// //GET all record
// exports.allusers = function(req, res){
//     conn.query('SELECT * FROM users', function(error, rows, fields){
//         if(error){
//             conn.log(error);
//         }else{
//             response.success(rows, res)
//         }
//     });
// };

// //GET one user
// exports.user = function(req, res){
//     let id = req.params.id;  //taro di parameter   

//     conn.query('SELECT * FROM users WHERE id = ?', [id],
//         function(error, rows, fields){
//             if(error){
//                 console.log(error);
//             }else{
//                 response.success(rows, res);
//             }

//     });

// };

// //POST Register
// exports.register = function (req, res){
//     var name = req.body.name;
//     var email = req.body.email;
//     var password = req.body.password;
//     var role = req.body.role;
//     var balance = req.body.balance;

//     conn.query('INSERT INTO users (name,email,password,role,balance) VALUES (?,?,?,2,?)',
//         [name, email, password, balance],
//         function(error, rows, fields){
//             if(error){
//                 console.log(error);
//             }else{
//                 response.success("Registered", res);
//             }
//         });

// };








