var jm = require('jm-ms-core')
var ms = jm.ms
var logger = jm.getLogger('acl')

/**
 * @apiDefine Error
 *
 * @apiSuccess (Error 200) {Number} err 错误代码
 * @apiSuccess (Error 200) {String} msg 错误信息
 *
 * @apiSuccessExample {json} 错误:
 * {
 *   err: 错误代码
 *   msg: 错误信息
 * }
 */

module.exports = function (opts) {
  var service = this
  var router = ms()
  if (service.debug) {
    router.use(function (opts, cb, next) {
      logger.debug(opts)
      next()
    })
  }
  service.routes || (service.routes = {})
  var routes = service.routes
  router.use(require('./help')(service))
  routes.filter_creator = function (opts, cb, next) {
    if (!opts.data || !opts.data.acl_user) return next() // 如果没有传递acl_user，代表超级用户，不做任何过滤
    var user = opts.data.acl_user
    service.isAllowed(user, 'global', opts.type, function (err, doc) {
      if (!err && doc) {
        return next()
      }
      if (opts.data.creator && opts.data.creator != user) {
        return cb(null, jm.ERR.FA_NOPERMISSION)
      }
      opts.data.creator = user
      if (opts.params.id && opts.params.id != user) {
        return cb(null, jm.ERR.FA_NOPERMISSION)
      }
      next()
    })
  }

  router.use(function (opts, cb, next) {
    if (!service.ready) return cb(null, jm.ERR.FA_NOTREADY)
    if (!service.inited) {
      service.inited = true
      if (service.disableAutoInit) return next()
      if (!service.role.roots.length) {
        service.ready = false
        service.init({}, function (err, doc) {
          next()
        })
      }
    }
    next()
  })

  router.use('/roles', require('./role')(service))
  router.use('/users', require('./user')(service))
  router.use('/resources', require('./resource')(service))
  router.use('/permissions', require('./permission')(service))
  router.use(require('./acl')(service))

  router.use('/init', require('./init')(service))
  return router
}
