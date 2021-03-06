// 用户
var schemaDefine = {
  nick: {type: String}, // 昵称
  roles: [{type: String}] // 角色(编码code)
}

module.exports = function (schema, opts) {
  schema = schema || require('./doc')(null, opts)
  schema.add(schemaDefine)
  return schema
}
