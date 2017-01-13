//兼容旧版本，以后会删掉
var jm = require('jm-ms-core');
var async=require('async');
var ms = jm.ms;
module.exports = function (service, opts) {
    var router = ms();
    router.add('/user/roles', 'get', function(opts, cb){
        service.userRoles(opts.data.acl_user, function(err, doc){
            if(!err && doc){
                doc = {roles: doc};
            }
            cb(err, doc || {});
        })
    });

    router.add('/filter', 'get', function(opts, cb, next) {
        if(opts.data.acl){
            var user = opts.data.acl.user;
            var token = opts.data.acl.token;
            service.userRoles(user, function(err, doc){
                cb(null, {
                    id: user,
                    token: token,
                    userRoles: doc,
                    permissions: ['*']
                });
            });
        }else{
            cb(null, {});
        }
    });


    return router;
};