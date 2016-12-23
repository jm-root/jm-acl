/**
 * Created by sahara on 2016/12/23.
 */
var jmcore = require('jm-ms-core');
var jm = require('jm-ms-daorouter');
var async=require('async');
var ms = jm.ms;

module.exports = function (service, opts) {
    var permission = service.permission;
    var router = ms();
    jmcore.enableEvent(permission);
    router.use(ms.daorouter(permission));
    return router;
};