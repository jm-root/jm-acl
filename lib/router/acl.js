var jm = require('jm-ms-core');
var async=require('async');
var ms = jm.ms;

module.exports = function (service, opts) {
    var router = ms();
    router.add('/isAllowed', 'get', function(opts, cb){
        var data = opts.data || {};
        service.isAllowed(data.user, data.resource, data.permissions, cb);
    });
    return router;
};