var mongoose = require('mongoose')
var Schema = mongoose.Schema

// 资源
var schemaDefine = {
  parent: {type: Schema.Types.ObjectId, ref: 'resource'}, // 父类资源
  noRecursion: {type: Number, default: 0}, // 是否禁止资源权限向下继承, 默认0表示不禁止
  permissions: [{type: String}] // 权限(编码code)
}

module.exports = function (schema, opts) {
  schema = schema || require('./doc')(null, opts)
  schema.add(schemaDefine)
  return schema
}
