var async = require('async');
var jm = require('jm-ms-core');
var ms = jm.ms;
var logger = jm.getLogger('jm-acl');
module.exports = function (service, opts) {
    var router = ms();

    router.add('/', 'get', function (opts, cb) {
        async.waterfall([
            function (cb) {
                service.acl.backend.clean(cb);
            },
            function (cb) {
                service.resource.init(require('../../config/resources'), cb);
            },
            function (ret, cb) {
                service.role.init(require('../../config/roles'), cb);
            },
            function (ret, cb) {
                service.permission.init(require('../../config/permissions'), cb);
            }
        ], function (err, doc) {
            if (err) {
                logger.error(err.stack);
                return cb(err, {ret: 0});
            }
            cb(null, {ret: 1});
        });
    });

    return router;
};