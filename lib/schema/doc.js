/**
 * Created by sahara on 2016/12/23.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schemaDefine = {
    code: {type: String, unique: true, sparse: true, index: true},  //编码
    title: {type: String},  //名称
    description: {type: String},   //描述
    sort: {type:Number, default: 0},        //排序
    creator: {type: Schema.Types.ObjectId},     //创建者
    crtime: {type: Date,  default: Date.now},//创建时间
    moditime: {type: Date},//修改时间
    tags: [String],//标签
    visible: {type: Boolean,  default: true},//是否显示
    status: {type: Number,  default: 1}     //状态
};

module.exports = function(schema, opts) {
    schema = schema || new Schema();
    schema.add(schemaDefine);
    return schema;
};