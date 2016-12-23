var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//资源
var schemaDefine = {
    org: {type: Schema.Types.ObjectId, ref: 'org'},          //机构
    type: {type: String} , //类型
    parent:{type: Schema.Types.ObjectId, ref: 'resource'},//父类资源
    perNoLimit: [{type: Schema.Types.ObjectId, ref: 'permission'}],   //什么权限不限制
    permissions: [{type: Schema.Types.ObjectId, ref: 'permission'}],   //权限
    perSignOnLimit: [{type: Schema.Types.ObjectId, ref: 'permission'}]//需要登录的权限
};

module.exports = function(schema, opts) {
    schema = schema ||  require('./doc')(null, opts);
    schema.add(schemaDefine);
    return schema;
};
