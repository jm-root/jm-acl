var async = require('async')
var jm = require('jm-ms-core')
var logger = jm.getLogger('acl')
module.exports = function (service) {
  service.init = function (opts = {}, cb) {
    async.waterfall([
      function (cb) {
        service.acl.backend.clean(cb)
      },
      function (cb) {
        service.resource.init(opts.resources || require('../../config/resources'), cb)
      },
      function (ret, cb) {
        service.role.init(opts.roles || require('../../config/roles'), cb)
      },
      function (ret, cb) {
        service.permission.init(opts.permissions || require('../../config/permissions'), cb)
      }
    ], function (err, doc) {
      if (err) {
        logger.error(err.stack)
        if (cb) cb(err, false)
        return
      }
      if (cb) cb(null, true)
    })
  }
}
