var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//资源
var schemaDefine = {
    parent:{type: Schema.Types.ObjectId, ref: 'resource'},   //父类资源
    permissions: [{type: String}]   //权限(编码code)
};

module.exports = function(schema, opts) {
    schema = schema ||  require('./doc')(null, opts);
    schema.add(schemaDefine);
    return schema;
};
