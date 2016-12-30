var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//角色
var schemaDefine = {
    parents: [{type: Schema.Types.ObjectId, ref: 'role'}]      //父角色
};

module.exports = function(schema, opts) {
    schema = schema ||  require('./doc')(null, opts);
    schema.add(schemaDefine);
    return schema;
};
