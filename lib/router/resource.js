/**
 * Created by sahara on 2016/12/23.
 */
var jm = require('jm-ms-daorouter');
var async=require('async');
var ms = jm.ms;

module.exports = function (service, opts) {
    var resource = service.resource;
    var acl = service.acl;
    var router = ms();
    //获取资源组织结构图
    var getTree = function (opts, cb) {
        opts || (opts = {});
        cb(null, {ret: resource.getTree(opts.params.id)});
    };
    router.add('/tree', 'get', getTree);
    router.add('/:id/tree', 'get', getTree);
    router.use(ms.daorouter(resource));
    resource.routes.before_remove = function(opts, cb, next){
        var id = opts.params.id || opts.data.id;
        next();
    };
    return router;
};