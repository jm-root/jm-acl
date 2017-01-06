/**
 * Created by sahara on 2016/12/23.
 */
var jm = require('jm-ms-daorouter');
var async=require('async');
var ms = jm.ms;

module.exports = function (service, opts) {
    var org = service.org;
    var role = service.role;
    var acl = service.acl;
    var router = ms();
    //获取某个组织结构图
    var getTree = function (opts, cb) {
        opts || (opts = {});
        cb(null, {ret: org.getTree(opts.params.id)});
    };
    router.add('/tree', 'get', getTree);
    router.add('/:id/tree', 'get', getTree);
    router.use(ms.daorouter(org));
    return router;
};