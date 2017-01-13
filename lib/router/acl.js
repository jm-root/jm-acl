var jm = require('jm-ms-core');
var async=require('async');
var ms = jm.ms;

module.exports = function (service, opts) {
    var router = ms();

    router.add('/isAllowed', 'get', function(opts, cb){
        var data = opts.data || {};
        service.isAllowed(data.user, data.resource, data.permissions, function(err, doc){
            if(!err && doc) {
                doc = {ret: 1};
            } else {
                if(!err) doc = {ret: 0};
            }
            cb(err, doc);
        });
    });

    router.add('/reload', 'get', function(opts, cb){
        cb(null, {ret:1});
        if(opts.data.name){
            service.reloadByName(opts.data.name);
        }else{
            service.reload();
        }

    });

    return router;
};