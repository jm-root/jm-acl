var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//用户
var schemaDefine = {
    nick: {type: String}  //昵称
};

module.exports = function(schema, opts) {
    schema = schema ||  require('./doc')(null, opts);
    schema.add(schemaDefine);
    return schema;
};
