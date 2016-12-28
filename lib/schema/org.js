var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//组织机构
var schemaDefine = {
    parent: {type: Schema.Types.ObjectId, ref: 'org'}      //父节点
};

module.exports = function(schema, opts) {
    schema = schema || require('./doc')(null, opts);
    schema.add(schemaDefine);
    return schema;
};
