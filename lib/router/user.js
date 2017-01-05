/**
 * Created by sahara on 2016/12/23.
 */
var jm = require('jm-ms-daorouter');
var async=require('async');
var ms = jm.ms;

module.exports = function (service, opts) {
    var acl=service.acl;
    var user = service.user;
    var router = ms();
    jm.enableEvent(user);
    //获取用户资源下的权限
    var _userResourcesPermission=function (opts, cb) {
        var id=opts.params.id;
        var resource=opts.data.resource;
        user.userResourcesPermission(id,resource,function (err,doc) {
            if(err){
                logger.error(err);
                return cb(err,null);
            }
            cb()
        });
    };
    //获取用户所有的资源及权限
    var userResources=function (opts, cb) {
        var id=opts.params.id;
        service.userResources(id, cb);
    };
    //获取用户资源树
    var userResourcesTree=function (opts,cb) {
        var id=opts.params.id;
        service.userResourcesTree(id, cb);
    };
    router.add('/:id/resource','get',_userResourcesPermission);
    router.add('/:id/resources','get',userResources);
    router.add('/:id/resources/tree','get',userResourcesTree);
    router.use(ms.daorouter(user));
    user.routes.after_create=function (opts,cb, next) {
        var user=opts.doc._id;
        service.addUserRoles(user.toString(), opts.doc.roles, function (err, doc) {
            if(err) opts.err = err;
        });
        next();
    };
    user.routes.after_update=function (opts,cb, next) {
        service.addUserRoles(opts.doc._id,opts.data.roles,function (err,doc) {
            if(err){
                opts.err= err;
            }
            next();
        });
    };
    //获取用户角色
    var _getUserRoles=function (opts, cb) {
        var id=opts.params.id;
    };
    //移除用户角色
    var _delUserRoles=function (opts, cb) {
        var id=opts.data.id;
        var roles=opts.data.roles;
        user.delUserRoles(id,roles,function (err,doc) {
            if(err){
                logger.error(err);
                return cb(err,null);
            }
            cb()
        });
    };
    return router;
};