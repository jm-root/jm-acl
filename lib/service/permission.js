var Promise = require('bluebird');
var jm = require('jm-dao');
module.exports = function (service, opts) {
    opts || (opts = {});
    opts.modelName || (opts.modelName = 'permission');
    opts.schema || (opts.schema = require('../schema/permission')());
    var model = jm.dao(opts);
    jm.enableEvent(model);
    require('./common')(model);

    var _init = function (opts) {
        return new Promise(function (resolve, reject) {
            model.create(opts, function (err, doc) {
                if (err) {
                    return reject(err, doc);
                }
                resolve(doc);
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
