var jm = require('jm-dao');
var Promise = require('bluebird');
module.exports = function (service, opts) {
    opts || (opts={});
    opts.modelName || (opts.modelName = 'org');
    opts.schema || (opts.schema = require('../schema/org')());
    var model = jm.dao(opts);
    jm.enableEvent(model);
    require('./common')(model);

    var _init = function(opts){
        return new Promise(function(resolve, reject){
            model.create(opts, function(err, doc) {
                if (err) {
                    return reject(err, doc);
                }
                var id = doc.id;
                if(opts.children){
                    Promise.map(opts.children, function(item, index) {
                        item.parent = id;
                        return _init(item);
                    }).then(function(results){
                        return resolve(doc);
                    }).catch(function (e) {
                        return reject(err);
                    });
                }else{
                    resolve(doc);
                }
            });
        });
    };

    model.init = function(opts, cb){
        var self = this;
        model.remove({}, function(err, doc){
            if(err) return cb(err, doc);
            Promise.map(opts, function(item, index) {
                return _init(item);
            }).then(function(results){
                model.load(null, function(err, doc){
                    if(!err) doc = true;
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
