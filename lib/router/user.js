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
    router.use(ms.daorouter(user));
    //获取用户角色
    var _getUserRoles=function (opts, cb) {
        var id=opts.params.id;
        user.getUserRoles(id,function (err,doc) {
            if(err){
                logger.error(err);
                return cb(err,null);
            }
            cb()
        });
    };
    //设置用户的角色
    var _setUserRoles=function (opts,cb) {
        var id=opts.data.id;
        var roles=opts.data.roles;
        user.setUserRoles(id,roles,function (err,doc) {
            if(err){
                logger.error(err);
                return cb(err,null);
            }
            cb()
        });
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
    //用户所属组织
    var _userOrg=function (opts, cb) {
        var  id=opts.params.id;
        user.userOrg(id,function (err,doc) {
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
    var findParent=function (code,codes) {
      if(service.resource.parentByCode(code)){
            if(codes.indexOf(service.resource.parentByCode(code))!=-1){
                    return service.resource.parentByCode(code);
            }
            findParent(service.resource.parentByCode(code),codes)
      }else{
          return null;
      }
    };
    router.add('/:id/role','get',_getUserRoles);
    router.add('/:id/role','post',_setUserRoles);
    router.add('/:id/role','delete',_delUserRoles);
    router.add('/:id/resource','get',_userResourcesPermission);
    router.add('/:id/resources','get',userResources);
    router.add('/:id/resources/tree','get',userResourcesTree);
    router.add('/:id/orgs','get',_userOrg);
    return router;
};