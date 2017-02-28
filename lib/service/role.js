var Promise = require('bluebird');
var jm = require('jm-dao');
var logger = jm.getLogger('jm-acl');
module.exports = function (service, opts) {
    opts || (opts = {});
    opts.modelName || (opts.modelName = 'role');
    opts.schema || (opts.schema = require('../schema/role')());
    var model = jm.dao(opts);
    jm.enableEvent(model);
    require('./common')(model);
    model.on('loading', function(){
        service.emit('loading', model.modelName);
    });
    model.on('loaded', function(){
        service.emit('loaded', model.modelName);
    });

    var acl = service.acl;

    model.__create = model.create;
    var create = function (opts) {
        return new Promise(function (resolve, reject) {
            model.__create(opts, function (err, doc) {
                if (err) {
                    return reject(err, doc);
                }
                if(opts.parents){
                    acl.addRoleParents(opts.code, opts.parents, function (_err, _doc) {
                        if (err) {
                            return reject(_err, _doc);
                        }
                        resolve(doc);
                    });
                }else {
                    resolve(doc);
                }
                if(opts.allows) {
                    for(var i in opts.allows) {
                        var allow = opts.allows[i];
                        acl.allow(opts.code, allow.resource, allow.permissions);
                    }
                }
            });
        });
    };
    model.create = function(opts, cb) {
        create(opts)
            .then(function(doc){
                cb(null, doc);
            })
            .catch(function (err) {
                cb(err);
            });
        return this;
    };

    model.init = function (opts, cb) {
        var self = this;
        model.remove({}, function (err, doc) {
            if (err) return cb(err, doc);
            Promise.map(opts, function (item, index) {
                return create(item);
            }).then(function (results) {
                cb(null, true);
                service.reloadByName('role');
            }).catch(function (e) {
                logger.error(e.stack);
                cb(null, false);
            });
        });
    };
    return model;
};
