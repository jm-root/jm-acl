var async = require('async');
var jm = require('jm-ms-core');
var ms = jm.ms;
var logger = jm.getLogger('jm-acl');
module.exports = function (service, opts) {
    var router = ms();

    router.add('/', 'get', function (opts, cb) {
        service.init(opts, function(err, doc){
            return cb(err, {ret: doc});
        });
    });

    return router;
};