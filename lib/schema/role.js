// 角色
var schemaDefine = {
  parents: [{type: String}] // 父角色(编码code)
}

module.exports = function (schema, opts) {
  schema = schema || require('./doc')(null, opts)
  schema.add(schemaDefine)
  return schema
}
