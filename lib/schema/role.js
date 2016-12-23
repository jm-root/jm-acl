var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//角色
var schemaDefine = {
    parent:{type: Schema.Types.ObjectId, ref: 'role'},//父角色
    org: {type: Schema.Types.ObjectId, ref: 'org'},          //机构
    type: {type: String}  //类型
};

module.exports = function(schema, opts) {
    schema = schema ||  require('./doc')(null, opts);
    schema.add(schemaDefine);
    return schema;
};
