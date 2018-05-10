// 权限
var schemaDefine = {
}

module.exports = function (schema, opts) {
  schema = schema || require('./doc')(null, opts)
  schema.add(schemaDefine)
  return schema
}
