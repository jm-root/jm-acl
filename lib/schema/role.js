var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//角色
var schemaDefine = {
};

module.exports = function(schema, opts) {
    schema = schema ||  require('./doc')(null, opts);
    schema.add(schemaDefine);
    return schema;
};
