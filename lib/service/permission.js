var Promise = require('bluebird')
var jm = require('jm-dao')
var logger = jm.getLogger('acl')
module.exports = function (service, opts) {
  opts || (opts = {})
  opts.modelName || (opts.modelName = 'permission')
  opts.schema || (opts.schema = require('../schema/permission')())
  var model = jm.dao(opts)
  jm.enableEvent(model)
  require('./common')(model)
  model.on('loading', function () {
    service.emit('loading', model.modelName)
  })
  model.on('loaded', function () {
    service.emit('loaded', model.modelName)
  })

  var create = function (opts) {
    return new Promise(function (resolve, reject) {
      model.create(opts, function (err, doc) {
        if (err) {
          return reject(err, doc)
        }
        resolve(doc)
      })
    })
  }

  model.init = function (opts, cb) {
    var self = this
    model.remove({}, function (err, doc) {
      if (err) return cb(err, doc)
      Promise.map(opts, function (item, index) {
        return create(item)
      }).then(function (results) {
        cb(null, true)
        service.reloadByName('permission')
      }).catch(function (e) {
        logger.error(e.stack)
        cb(null, false)
      })
    })
  }

  return model
}
