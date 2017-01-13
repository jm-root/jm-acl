var jm = require('jm-dao');
var Promise = require('bluebird');
var logger = jm.getLogger('jm-acl');
module.exports = function (service, opts) {
    opts || (opts={});
    opts.modelName || (opts.modelName = 'org');
    opts.schema || (opts.schema = require('../schema/org')());
    var model = jm.dao(opts);
    jm.enableEvent(model);
    require('./common')(model);
    model.on('loaded', function(){
        service.emit('loaded', model.modelName);
    });

    model.__create = model.create;
    var create = function (opts) {
        return new Promise(function (resolve, reject) {
            model.__create(opts, function (err, doc) {
                if (err) {
                    return reject(err, doc);
                }
                var id = doc.id;
                if (opts.children) {
                    Promise.map(opts.children, function (item, index) {
                        item.parent = id;
                        return create(item);
                    }).then(function (results) {
                        return resolve(doc);
                    }).catch(function (err) {
                        return reject(err);
                    });
                } else {
                    resolve(doc);
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

    model.init = function(opts, cb){
        var self = this;
        model.remove({}, function(err, doc){
            if(err) return cb(err, doc);
            Promise.map(opts, function(item, index) {
                return create(item);
            }).then(function(results){
                cb(null, true);
                service.reloadByName('org');
            }).catch(function (e) {
                logger.error(e.stack);
                cb(null, false);
            });
        });
    };

    return model;
};
