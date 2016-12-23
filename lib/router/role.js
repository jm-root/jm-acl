/**
 * Created by sahara on 2016/12/23.
 */
var jmcore = require('jm-ms-core');
var jm = require('jm-ms-daorouter');
var async=require('async');
var ms = jm.ms;

module.exports = function (service, opts) {
    var role = service.role;
    var router = ms();
    jmcore.enableEvent(role);
    router.use(ms.daorouter(role));
    role.routes.before_create = function(opts, cb, next){
        next();

    };
    role.routes.before_remove = function(opts, cb, next){
        var id = opts.params.id || opts.data.id;
        service.removeRole(id,cb);//调用nodeacl原有方法 

    };
    return router;
};