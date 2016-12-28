//兼容旧版本，以后会删掉
var jm = require('jm-ms-core');
var ms = jm.ms;
module.exports = function (service, opts) {
    var router = ms();
    router.add('/user/roles', 'get', function(opts, cb){
        cb(null, {roles:['superadmin']});
    });
    // router.add('/:id/role','post',_setUserRoles);
    // router.add('/:id/role','delete',_delUserRoles);
    // router.add('/:id/resource','get',_userResourcesPermission);
    // router.add('/:id/orgs','get',_userOrg);
    return router;
};