var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//组织机构
var schemaDefine = {
    parent: {type: Schema.Types.ObjectId, ref: 'org'},      //父节点
    code: {type: String, unique: true, sparse: true, index: true},  //机构编码
    type: {type: String},   //分类
    title: {type: String},  //名称
    description: {type: String},   //描述
    sort: {type:Number, default: 0},        //排序
    status: {type: Number, default: 1},     //0:隐藏,1:正常
    crtime: {type: Date, default: Date.now} //创建时间
};

module.exports = function(schema, opts) {
    opts = opts || {};
    if(opts.modelName) schemaDefine.pid.ref = opts.modelName;
    schema = schema ||  new Schema();
    schema.add(schemaDefine);
    return schema;
};
