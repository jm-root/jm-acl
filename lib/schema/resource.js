var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//资源
var schemaDefine = {
    parent:{type: Schema.Types.ObjectId, ref: 'resource'},//父类资源
    org: {type: Schema.Types.ObjectId, ref: 'org'},          //机构
    code: {type: String, unique: true, required: true, index: true, lowercase:true},  //资源编码
    title: {type: String},   //名称
    permissions: [String],   //权限
    perNoLimit: [String],   //什么权限不限制
    perSignOnLimit: [String], //需要登录的权限
    description: {type: String},   //描述
    status: {type: Number, default: 1},    //0:隐藏,1:正常
    crtime: {type: Date, default: Date.now}  //创建时间
};

module.exports = function(schema, opts) {
    schema = schema ||  new Schema();
    schema.add(schemaDefine);
    return schema;
};
