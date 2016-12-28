/**
 * Created by sahara on 2016/12/23.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//权限
var schemaDefine = {
};

module.exports = function(schema, opts) {
    schema = schema ||   require('./doc')(null, opts);
    schema.add(schemaDefine);
    return schema;
};
