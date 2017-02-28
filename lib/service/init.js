var async = require('async');
var jm = require('jm-ms-core');
var logger = jm.getLogger('jm-acl');
module.exports = function (service) {
    service.init = function(opts, cb) {
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
                if(cb) cb(err, false);
                return;
            }
            if(cb) cb(null, true);
        });
    }
};
