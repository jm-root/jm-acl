var jm = require('jm-ms-core');
var ms = jm.ms;

module.exports = function (service, opts) {
    var router = ms();
    router.add('/','get', function(opts, cb){
        service.org.init();
        service.role.init();
        service.permission.init();
        service.resource.init();
        cb(null, {ret:1});
    });
    return router;
};