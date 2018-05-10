/**
 * Created by sahara on 2016/12/23.
 */
var jm = require('jm-ms-daorouter')
var async = require('async')
var ms = jm.ms
var ERR = jm.ERR
module.exports = function (service, opts) {
  var user = service.user
  var router = ms()
  jm.enableEvent(user)
  // 获取用户所有的资源及权限
  var userResources = function (opts, cb) {
    service.userResources(opts.params.id, opts.data.resource, cb)
  }
  // 获取用户资源树
  var userResourcesTree = function (opts, cb) {
    service.userResourcesTree(opts.params.id, cb)
  }
  // 删除用户
  var delUser = function (opts, cb) {
    var user = opts.params.id.toString()
    async.waterfall([
      function (cb) {
        service.userRoles(user, function (err, doc) {
          if (err)cb(err, null)
          cb(null, doc)
        })
      },
      function (roles, cb) {
        service.removeUserRoles(user, roles, function (err, doc) {
          if (err)cb(err, null)
          cb()
        })
      },
      function (cb) {
        _delUser(user, function (err, doc) {
          if (err)cb(err, null)
          cb()
        })
      }
    ], function (err) {
      if (err)cb(err, null)
      cb(null, {ret: '删除用户成功'})
    })
  }
  var _delUser = function (userId, cb) {
    async.waterfall([
      function (cb) { // 获取用户创建的角色
        service.role.find({creator: userId}, function (err, doc) {
          if (err) cb(err, ERR.FA_NOTFOUND)
          cb(null, doc)
        })
      },
      function (roles, cb) { // 移除用户创建的角色
        async.each(roles, function (role, callback) {
          delRoleUsers(role._id, function (err, doc) {
            callback()
          })
        }, function (err) {
          if (err) return cb(err)
          cb()
        })
      },
      function (cb) { // 获取用户分配的角色用户
        user.find({creator: userId}, function (err, doc) {
          if (err) cb(err, ERR.FA_NOTFOUND)
          cb(null, doc)
        })
      },
      function (users, cb) { // 移除用户分配的角色用户
        async.each(users, function (user, callback) {
          _delUser(user._id, function (err, doc) {
            if (err)cb(err, null)
            callback()
          })
        }, function (err) {
          if (err) return cb(err)
          cb()
        })
      },
      function (cb) { // 移除用户
        user.remove({_id: userId}, function (err, doc) {
          if (err)cb(err, null)
          cb(null, doc)
        })
      }
    ], function (err, doc) {
      if (err)cb(err, null)
      cb(null, doc)
    })
  }
  var delRoleUsers = function (id, cb) {
    var roleId = [id]
    var roleCode = []
    async.waterfall([
      function (cb) { // 获取其子角色
        service.role.findOne({_id: id}, function (err, doc) {
          if (err) return cb(err)
          if (!doc) return cb({err: -1, msg: '角色不存在'})
          roleCode.push(doc.code)
          service.role.find({parents: doc.code }, function (err, ary) {
            if (err) return cb(err)
            ary.forEach(function (item) {
              roleCode.push(item.code)
              roleId.push(item._id)
            })
            cb(null, roleCode)
          })
        })
      },
      function (roleCode, cb) { // 移除角色关系表(包含子角色)
        async.each(roleCode, function (code, callback) {
          service.removeRole(code, function (err, doc) {
            if (err) return callback(err)
            callback()
          })
        }, function (err) {
          if (err) return cb(err)
          cb(null, roleCode)
        })
      },
      function (roleCode, cb) { // 获取拥有此角色的用户
        var userIds = []
        async.each(roleCode, function (code, callback) {
          service.roleUsers(code, function (err, docs) {
            if (err) return callback(err)
            docs.forEach(function (item) {
              if (userIds.indexOf(item) == -1) {
                userIds.push(item)
              }
            })
            callback()
          })
        }, function (err) {
          if (err) return cb(err)
          cb(null, userIds)
        })
      },
      function (userIds, cb) { // 移除用户角色关系
        async.each(userIds, function (id, callback) {
          service.removeUserRoles(id, roleCode, function (err, doc) {
            if (err) return callback(err)
            callback()
          })
        }, function (err) {
          if (err) return cb(err)
          cb(null, userIds)
        })
      },
      function (userIds, cb) {
        service.role.remove({ _id: { $in: userIds }}, function (err, doc) {
          cb(err, doc)
        })
      }
    ], function (err, results) {
      if (err) {
        opts.err = err
      }
      cb()
    })
  }
  // 获取用户角色的详细信息
  var getUserRoles = function (opts, cb) {
    var userId = opts.params.id
    async.waterfall([
      function (cb) {
        service.userRoles(userId, function (err, doc) {
          cb(null, doc)
        })
      },
      function (roleCodes, cb) {
        var roles = {}
        async.each(roleCodes, function (role, callback) {
          service.role.find({code: role}, function (err, doc) {
            if (err) {
              cb(err, null)
            }
            if (doc) {
              roles[role] = doc[0]
            }
            callback()
          })
        }, function (err, doc) {
          if (err) {
            cb(err, doc)
          }
          cb(null, roles)
        })
      }
    ], function (err, doc) {
      if (err) {
        cb(err, doc)
      }
      cb(null, doc)
    })
  }
  router
    .add('/:id/roles', 'get', getUserRoles)
    .add('/:id/roles', 'put', function (opts, cb, next) {
      service.addUserRoles(opts.params.id, opts.data.roles || opts.data.role, function (err, doc) {
        doc = {ret: 0}
        if (!err) doc = {ret: 1}
        cb(err, doc)
      })
    })
    .add('/:id/roles', 'delete', function (opts, cb, next) {
      service.removeUserRoles(opts.params.id, opts.data.roles || opts.data.role, function (err, doc) {
        doc = {ret: 0}
        if (!err) doc = {ret: 1}
        cb(err, doc)
      })
    })
    .add('/:id/resources', 'get', userResources)
    .add('/:id/resources/tree', 'get', userResourcesTree)
    .add('/:id', 'delete', delUser)
    .use(service.routes.filter_creator)
    .use(
      ms.daorouter(
        user,
        {
          list: {
            conditions: {},

            options: {
              sort: [{'crtime': -1}]
            },

            fields: {
              roles: 1,
              nick: 1,
              creator: 1,
              crtime: 1,
              status: 1,
              visible: 1,
              tags: 1
            },

            populations: {
              path: 'creator',
              select: {
                nick: 1
              }
            }

          },
          get: {
            fields: {
              roles: 1,
              nick: 1,
              creator: 1,
              crtime: 1,
              status: 1,
              visible: 1,
              tags: 1
            },

            populations: {
              path: 'creator',
              select: {
                nick: 1
              }
            }
          }
        }
      ))

  user.routes.before_list = function (opts, cb, next) {
    opts.conditions = {}
    if (opts.data.keyword) {
      var keyword = opts.data.keyword || ''
      var pattern = '.*?' + decodeURIComponent(keyword) + '.*?'
      opts.conditions = {
        '$or': [
          [{nick: {$regex: pattern, $options: 'i'}}],
          [{_id: keyword}]
        ]
      }
    }
    if (opts.data.creator) {
      opts.conditions['creator'] = opts.data.creator
    }
    next()
  }

  user.routes.before_create = function (opts, cb, next) {
    var id = opts.data._id
    user.count({_id: id}, function (err, count) {
      if (err) opts.err = err
      if (count) return cb(ERR.FA_NOTFOUND)
      next()
    })
  }
  user.routes.after_create = function (opts, cb, next) {
    var user = opts.doc._id
    service.addUserRoles(user.toString(), opts.doc.roles, function (err, doc) {
      if (err) opts.err = err
    })
    next()
  }
  user.routes.after_update = function (opts, cb, next) {
    var user = opts.params.id.toString()
    var oldPermission
    async.waterfall([
      function (cb) { // 获取更新之前的资源权限
        service.userResources(opts.data._id.toString(), function (err, doc) {
          if (err) {
            opts.err = err
          }
          oldPermission = doc
          cb()
        })
      },
      function (cb) { // 获取更新之前的用户角色
        service.userRoles(opts.data._id.toString(), function (err, doc) {
          if (err) {
            opts.err = err
          }
          cb(null, doc)
        })
      },
      function (roles, cb) { // 移除更新之前的用户角色
        service.removeUserRoles(opts.data._id.toString(), roles, function (err, doc) {
          if (err) {
            opts.err = err
          }
          cb()
        })
      },
      function (cb) { // 添加新的角色
        service.addUserRoles(user, opts.data.roles, function (err, doc) {
          if (err) {
            opts.err = err
          }
          cb()
        })
      },
      function (cb) { // 获取更新之后的资源权限
        var removePermission = {}
        service.userResources(opts.data._id.toString(), function (err, doc) {
          if (err) {
            opts.err = err
          }
          for (var key in oldPermission) {
            if (!doc[key]) {
              removePermission[key] = oldPermission[key]
            } else {
              oldPermission[key].forEach(function (permission) {
                if (doc[key].indexOf(permission) == -1) {
                  if (!removePermission[key]) {
                    removePermission[key] = [permission]
                  } else {
                    removePermission[key].push(permission)
                  }
                }
              })
            }
          }
          cb(null, removePermission)
        })
      },
      function (removePermission, cb) {
        if (JSON.stringify(removePermission) != '{}') {
          updateUserPermission(user, removePermission, function (err, doc) {
            cb(err, doc)
          })
        } else {
          cb()
        }
      }
    ], function (err) {
      if (err) {
        opts.err = err
      }
      next()
    })
  }
  var updateUserPermission = function (user, removePermission, cb) {
    async.waterfall([
      function (cb) { // 获取用户创建的角色
        service.role.find({creator: user}, function (err, doc) {
          if (err) cb(err, ERR.FA_NOTFOUND)
          cb(null, doc)
        })
      },
      function (roles, cb) { // 循环用户创建的角色的资源权限
        async.each(roles, function (item, callback) {
          removeRolesPermission(item._id, removePermission, function (err, doc) {
            callback()
          })
        }, function (err, doc) {
          if (err) {
            cb(err, null)
          }
          cb()
        })
      },
      function () { // 获取用户分配的用户
        service.user.find({creator: user}, function (err, doc) {
          if (err) cb(err, ERR.FA_NOTFOUND)
          cb(null, doc)
        })
      },
      function (users, cb) { // 循环用户分配的用户
        async.each(users, function (user, callback) {
          updateUserPermission(user._id, removePermission, function (err, doc) {
            callback()
          })
        }, function (err, doc) {
          cb(err, doc)
        })
      }
    ], function (err, doc) {
      if (err) {
        cb(err)
      }
      cb(null, doc)
    })
  }
  var removeRolesPermission = function (role, removePermission, cb) {
    async.waterfall([
      function (cb) {
        service.roleResources(role, function (err, doc) {
          cb(err, doc)
        })
      }, function (permissions, cb) {
        for (var key in removePermission) {
          if (permissions[key]) {
            async.each(removePermission[key], function (item, callback) {
              if (permissions[key].indexOf(item) > -1) {
                service.removeAllow(role, key, item, function (err, doc) {
                  callback(err, doc)
                })
              }
            }, function (err, doc) {
              cb(err, doc)
            })
          } else {
            cb()
          }
        }
      }
    ], function (err, doc) {

    })
  }
  return router
}
