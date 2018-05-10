/**
 * Created by sahara on 2016/12/26.
 */
var jm = require('jm-core')
var async = require('async')

module.exports = function (service, opts) {
  opts || (opts = {})
  opts.modelName || (opts.modelName = 'user')
  opts.schema || (opts.schema = require('../schema/user')())
  var model = jm.dao(opts)
  jm.enableEvent(model)
  return model
}
