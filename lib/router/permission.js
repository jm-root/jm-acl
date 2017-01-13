/**
 * Created by sahara on 2016/12/23.
 */
var jm = require('jm-ms-daorouter');
var ms = jm.ms;

module.exports = function (service, opts) {
    var permission = service.permission;
    var router = ms();
    jm.enableEvent(permission);
    router.use(ms.daorouter(permission));
    return router;
};
