var jm = require('jm-ms-core')
var ms = jm.ms
module.exports = function (service, opts) {
  var router = ms()

  router
    .use('/', function (opts, cb) {
      service.init(opts.data, function (err, doc) {
        return cb(err, {ret: doc})
      })
    })

  return router
}
