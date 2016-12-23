var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//角色
var schemaDefine = {
    parent:{type: Schema.Types.ObjectId, ref: 'role'},//父角色
    org: {type: Schema.Types.ObjectId, ref: 'org'},          //机构
    code: {type: String, unique: true, required: true, index: true},    //编码
    title: {type: String},   //名字
    type: {type: String},   //类型
    description: {type: String},   //描述
    status: {type: Number, default: 1},    //0:隐藏,1:正常
    crtime: {type: Date, default: Date.now}  //创建时间
};

module.exports = function(schema, opts) {
    schema = schema ||  new Schema();
    schema.add(schemaDefine);
    return schema;
};
