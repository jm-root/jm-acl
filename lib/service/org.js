var orgSchema = require('../schema/org')();
var jm = require('jm-common');
var _ = require('lodash');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
module.exports = function (opts) {
    opts = opts || {};
    return jm.dao({db:opts.db,modelName:'org',schema:orgSchema});
};
