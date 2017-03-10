/**
 * Created by sahara on 2016/12/23.
 */
var jm = require('jm-ms-daorouter');
var async=require('async');
var ms = jm.ms;

module.exports = function (service, opts) {
    var resource = service.resource;
    var router = ms();

    //只增加修改资源不会删除旧有资源
    var init = function(opts, cb){
        var rows = opts.data.rows||[];
        rows = Array.isArray(rows) ? rows : [rows];
        resource.createOrUpdate(rows,function(err,ret){
            err ? cb(err):cb(null, {ret:ret});
        });
    };
    //获取资源组织结构图
    var getTree = function (opts, cb) {
        opts || (opts = {});
        cb(null, {rows: resource.getTree(opts.params.id)});
    };
    var getResource=function (opts,cb) {
        cb(null,resource.nodes||{});
    };
    router
        .add('/init', 'post', init)
        .add('/all', 'get', getResource)
        .add('/tree', 'get', getTree)
        .add('/:id/tree', 'get', getTree)
        .use(service.routes.filter_creator)
        .use(ms.daorouter(resource))
    ;

    resource.routes.after_create = function (opts, cb, next) {
        if(!opts.err) service.reloadByName('resource');

        next();
    };

    resource.routes.after_update = function (opts, cb, next) {
        if(!opts.err) service.reloadByName('resource');

        next();
    };

    resource.routes.after_remove = function (opts, cb, next) {
        if(!opts.err) service.reloadByName('resource');

        next();
    };

    return router;
};
