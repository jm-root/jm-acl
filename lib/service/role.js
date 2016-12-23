/**
 * Created by sahara on 2016/12/23.
 */
var roleSchema = require('../schema/role')();
var jm = require('jm-common');
var _ = require('lodash');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
module.exports = function (opts) {
    opts = opts || {};

    return jm.dao({db:opts.db,modelName:'role',schema:roleSchema});
};