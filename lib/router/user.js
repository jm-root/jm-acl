/**
 * Created by sahara on 2016/12/23.
 */
var jmcore = require('jm-ms-core');
var jm = require('jm-ms-daorouter');
var async=require('async');
var ms = jm.ms;

module.exports = function (service, opts) {

    var user = service.user;
    var router = ms();
    jmcore.enableEvent(user);
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
        });;
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
    router.add('/:id/role','get',_getUserRoles);
    router.add('/:id/role','post',_setUserRoles);
    router.add('/:id/role','delete',_delUserRoles);
    router.add('/:id/resource','get',_userResourcesPermission);
    router.add('/:id/orgs','get',_userOrg);
    return router;
};