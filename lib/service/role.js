var Promise = require('bluebird');
var jm = require('jm-dao');
module.exports = function (service, opts) {
    opts || (opts = {});
    opts.modelName || (opts.modelName = 'role');
    opts.schema || (opts.schema = require('../schema/role')());
    var model = jm.dao(opts);
    jm.enableEvent(model);
    require('./common')(model);

    var acl = service.acl;
    var _init = function (opts) {
        return new Promise(function (resolve, reject) {
            model.create(opts, function (err, doc) {
                if (err) {
                    return reject(err, doc);
                }
                if(opts.parents){
                    acl.addRoleParents(opts.code, opts.parents, function (err, doc) {
                        if (err) {
                            return reject(err, doc);
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

    model.init = function (opts, cb) {
        var self = this;
        model.remove({}, function (err, doc) {
            if (err) return cb(err, doc);
            Promise.map(opts, function (item, index) {
                return _init(item);
            }).then(function (results) {
                model.load(null, function (err, doc) {
                    if (!err) doc = true;
                    cb(err, doc);
                });
            }).catch(function (e) {
                console.log(e);
                cb(null, false);
            });
        });
    };
    return model;
};
