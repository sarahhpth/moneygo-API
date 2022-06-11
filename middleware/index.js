var express = require('express');
// var auth = require('./auth');
var router = express.Router();
var verifikasi = require('./verifikasi')
// var jsonku = require('./logged_in');
var controller = require('./controller');


router.get('/', controller.index);
router.post('/register', controller.register);
router.post('/login', controller.login);

//Authentication
router.put('/topup', verifikasi(), controller.topup)
router.put('/transfer', verifikasi(), controller.transfer)
router.get('/profile', verifikasi(), controller.profile)

module.exports = router;