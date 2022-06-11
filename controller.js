'use strict';

var response = require('./res');

exports.index = function (req, res) {
    response.success("Halo! ini running HOREEEEE", res)
};

