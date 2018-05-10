var jm = require('jm-ms-help')
module.exports = function (service, opts) {
  var router = jm.ms()
  router.add('/', 'get', function (opts, cb, next) {
    opts.help || (opts.help = {})
    opts.help.status = 1
    if (!service.ready) opts.help.status = 0
    next()
  })
  jm.ms.enableHelp(router, require('../../package.json'))
  return router
}
