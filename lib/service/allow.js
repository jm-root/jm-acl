var jm = require('jm-ms-core')
var Promise = require('bluebird')
var logger = jm.getLogger('acl')

module.exports = function (service, opts) {
  var root = require('jm-ms-core').ms()
  var router = require('jm-ms-core').ms()

  // 超级用户
  root.use(function (opts, cb, next) {
    logger.debug('filter by superRole: %s', jm.utils.formatJSON(opts))
    service.hasSuperRole(opts.user).then(function (ret) {
      if (ret) return cb(null, true)
      next()
    })
  })

  root.use(router)

  // 默认处理
  root.use(function (opts, cb) {
    logger.debug('filter by default: %s', jm.utils.formatJSON(opts))
    if (opts.matched) return cb(null, false)
    cb(null, service.defaultAllow)
  })

  service.isAllowed = function (user, resource, permissions, cb) {
    var self = this
    if (typeof user === 'function') cb = user, user = null
    if (typeof resource === 'function') cb = resource, resource = null
    if (typeof permissions === 'function') cb = permissions, permissions = null

    permissions || (permissions = [])
    if (!Array.isArray(permissions)) {
      permissions = [permissions]
    }

    if (!resource || !permissions.length) return Promise.resolve(self.defaultAllow).asCallback(cb)

    root.request({
      uri: resource,
      permissions: permissions,
      user: user
    }, function (err, doc) {
      return Promise.resolve(doc).asCallback(cb)
    })
  }

  function createRouter (node, _router, _prefix) {
    if (!_router) {
      _router = jm.ms()
      router.use(node.code, _router)
      _prefix = node.code
      logger.debug('process for root node: %s', _prefix)
    }
    if (node.children && node.children.length) {
      for (var i in node.children) {
        createRouter(node.children[i], _router, _prefix)
      }
    }
    var r = jm.ms()
    var resource = node.code
    var uri = resource.replace(_prefix, '')
    uri || (uri = '/')
    logger.debug('createRouter for resource:%s uri:%s noRecursion:%s', resource, uri, node.noRecursion || 0)
    r.add({
      end: node.noRecursion || false,
      uri: uri,
      fn: function (opts, cb, next) {
        logger.debug('filter by %s: %s', resource, jm.utils.formatJSON(opts))
        opts.matched || (opts.matched = true)
        var user = opts.user
        var permissions = opts.permissions
        service.areAnyRolesAllowed(service.guestRole, resource, permissions).then(function (ret) {
          // 如果请求的资源是guestRole角色拥有的, 允许访问
          if (ret) return cb(null, true)
          if (!user) return next()
          service.areAnyRolesAllowed(service.userRole, resource, permissions).then(function (ret) {
            // 如果请求的资源是userRole角色拥有并验证身份的, 允许访问
            if (ret) return cb(null, true)
            service.acl.isAllowed(user, resource, permissions, function (err, doc) {
              if (doc) return cb(null, true)
              next()
            })
          })
        })
      }
    })
    _router.use(r)
  }

  service.on('loaded', (name) => {
    if (name !== 'resource') return
    router.clear()
    for (var key in service.resource.roots) {
      var val = service.resource.roots[key]
      createRouter(val)
    }
  })
}
