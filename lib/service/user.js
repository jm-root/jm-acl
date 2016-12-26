/**
 * Created by sahara on 2016/12/26.
 */
var jm = require('jm-common');
var async = require('async');

module.exports = function (service,opts) {
    opts = opts || {};
    var acl=service.acl;
    var org=service.org;
    var role=service.role;
    var resource=service.resource;
    var o = {
        //获取用户角色
        getUserRoles:function (userId, cb) {
            acl.userRoles(userId,cb);
        },
        //设置用户角色（可同时设置多个角色）
        setUserRoles:function (userId,roles,cb) {
            acl.addUserRoles(userId,roles,cb);
        },
        //删除用户角色（可同时删除多个角色）
        delUserRoles:function (userId,roles,cb) {
            acl.removeUserRoles(userId,roles,cb);
        },
        //获取用户资源下的权限
        userResourcesPermission:function (userId,resource,cb) {
            acl.allowedPermissions(userId,resource,cb);
        },
        //判断用户是否拥有此角色
        hasRole:function (userId,roleId,cb) {
            acl.hasRole(userId,roleId,cb);
        },
        //查询某人是否有某资源的某权限
        isAllowed:function ( userId, resource, permissions,cb) {
            acl.isAllowed(userId, resource, permissions,cb);
        },
        //获取用户所属组织
        userOrg:function (userId, cb) {
            async.waterfall([
                function (cb) {
                    acl.userRoles(userId,cb);
                },
                function (roles,cb) {
                    var orgsId=[];
                    async.each(roles,function (item,callback) {
                        role.find({_id:item},function (err,doc) {
                            if(err){
                                return cb(err ,null);
                            }
                            if(orgsId.indexOf(doc.org)==(-1)){
                                orgsId.push(doc.org);
                            }
                            callback()
                        });
                    },function(err){
                        if(err) return cb(err);
                        cb(null,orgsId);
                    });
                },
                function (orgsId, cb) {
                    var orgs=[];
                    async.each(orgsId,function (item,callback) {
                        org.find({_id:item},function (err,doc) {
                            if(err){
                                return cb(err ,null);
                            }
                            if(orgs.indexOf(doc)==(-1)){
                                orgs.push(doc);
                            }
                            callback()
                        });
                    },function(err){
                        if(err) return cb(err);
                        cb(null,orgs);
                    });
                }
            ],function (err, doc) {
                if(err) return cb(err);
                cb(null,doc);
            });
        },
        //获取用户资源
        userResource:function (id,cb) {
            async.waterfall([
                function (cb) {
                    acl.userRoles(userId,cb);
                },
                function (roles,cb) {
                    var resId=[];
                    async.each(roles,function (item,callback) {
                        acl.whatResources(item,function (err, docs) {
                            if(err){
                                return cb(err,null)
                            }
                            docs.forEach(function (item) {
                                if(resId.indexOf(item)==(-1)){
                                    resId.push(item);
                                }
                            });
                            callback()
                        });
                    },function(err){
                        if(err) return cb(err);
                        cb(null,resId);
                    });
                },
                function (resId,cb) {
                    var res=[];
                    async.each(resId,function (item,callback) {
                        resource.find({_id:item},function (err, doc) {
                            if(err){
                                return cb(err,null)
                            }
                                if(res.indexOf(doc)==(-1)){
                                    res.push(doc);
                                }
                            callback()
                        });
                    },function(err){
                        if(err) return cb(err);
                        cb(null,res);
                    });
                }
            ],function (err, doc) {
                if(err) return cb(err);
                cb(null,doc);
            });
        }
    };

    return o;
};