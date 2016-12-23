/**
 * Created by sahara on 2016/12/23.
 */
var resourceSchema = require('../schema/resource')();
var jm = require('jm-common');
var _ = require('lodash');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;

module.exports = function (opts) {
    opts = opts || {};
    return jm.dao({db:opts.db,modelName:'resource',schema:resourceSchema});
};