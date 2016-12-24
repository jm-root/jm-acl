/**
 * Created by sahara on 2016/12/23.
 */
var jmcore = require('jm-ms-core');
var jm = require('jm-ms-daorouter');
var async=require('async');
var ms = jm.ms;

module.exports = function (service, opts) {
    var acl = service.acl;
    var role = service.role;
    var router = ms();
    jmcore.enableEvent(acl);
    //获取用户角色
    var _getuserRoles=function (opts, cb) {
        var id=opts.params.id;
        acl.userRoles(id,cb);
    };
    //设置用户的角色
    var _setuserRoles=function (opts,cb) {
        var id=opts.data.id;
        var roles=opts.data.roles;
        acl.addUserRoles(id,roles,cb);
    };
    //移除用户角色
    var _deluserRoles=function (opts, cb) {
        var id=opts.data.id;
        var roles=opts.data.roles;
        acl.removeUserRoles(id,roles,cb);
    };
    //获取用户资源及其权限
    var _userResources=function (opts, cb) {
        var id=opts.params.id;
        var resource=opts.data.resource;
        acl.allowedPermissions(id,resource,cb);
    };
    //用户所属组织
    var _userorg=function (opts, cb) {
        var  id=opts.params.id;
        async.waterfall([
            function (cb) {
                acl.userRoles(id,function (err, roles) {
                    if(err){
                        return cb(err,null);
                    }
                    cb(null,roles);
                });
            },
            function (roles,cb) {
                var orgs=[];
                async.each(roles,function (roleId, callback) {
                    role.find({_id:roleId},function (err,doc) {
                        if(err){
                            return cb(err ,null);
                        }
                            if(orgs.indexOf(item)==(-1)){
                                orgs.push(item);
                            }
                        callback()
                    })
                },function(err){
                    if(err) return cb(err);
                    cb(null,orgs);
                });
            }
        ],function (err, doc) {
            if(err) return cb(err);
            cb(null,doc);
        });
    };
    router.add('/:id/role','get',_getuserRoles);
    router.add('/:id/role','post',_setuserRoles);
    router.add('/:id/role','delete',_deluserRoles);
    router.add('/:id/resource','get',_userResources);
    router.add('/:id/orgs','get',_userorg);
    return router;
};