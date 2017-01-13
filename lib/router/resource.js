/**
 * Created by sahara on 2016/12/23.
 */
var jm = require('jm-ms-daorouter');
var async=require('async');
var ms = jm.ms;

module.exports = function (service, opts) {
    var resource = service.resource;
    var router = ms();
    //获取资源组织结构图
    var getTree = function (opts, cb) {
        opts || (opts = {});
        cb(null, {ret: resource.getTree(opts.params.id)});
    };
    router
        .add('/tree', 'get', getTree)
        .add('/:id/tree', 'get', getTree)
        .use(service.routes.filter_creator)
        .use(ms.daorouter(resource))
    ;
    return router;
};
