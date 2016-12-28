var async = require('async');
var jm = require('jm-ms-core');
var ms = jm.ms;

module.exports = function (service, opts) {
    var router = ms();

    function initAcl(role, resource, permissions){
        service.acl.removeAllow(role, resource, function(){
            if(permissions.length){
                acl.allow(role, resource, permissions);
            }
        });
    }

    router.add('/','get', function(opts, cb){
        async.waterfall([
            function(cb){
                service.org.init(require('../../config/orgs'), cb);
            },
            function(ret, cb){
                service.permission.init(require('../../config/permissions'), cb);
            },
            function(ret, cb){
                service.resource.init(require('../../config/resources'), cb);
            },
            function(ret, cb){
                service.role.init(require('../../config/roles'), cb);
            // },
            // function(ret, cb){
            //     initAcl(cb);
            }
        ],function(err, doc){
            if(err){
                return cb(err, doc);
            }
            cb(null, {ret:doc});
        });
    });

    return router;
};