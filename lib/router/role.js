/**
 * Created by sahara on 2016/12/23.
 */
var jm = require('jm-ms-daorouter');
var async=require('async');
var ms = jm.ms;
var logger = jm.getLogger();
module.exports = function (service, opts) {
    var role = service.role;
    var acl = service.acl;
    var router = ms();
    var roleResources=function (opts, cb) {
        var id=opts.params.id;
        var role=opts.data.code;
        acl.whatResources(role,function (err,doc) {
            if(err){
                 logger.error(err);
                 return cb(err,null);
            }
            cb(null,doc)
        });
    };
    //获取某角色的用户
    var _roleUsers=function (opts, cb) {
        var id=opts.params.id;
        acl.roleUsers(id,function (err,doc) {
            if(err){
                logger.error(err);
                return cb(err,null);
            }
            cb(null,{rows:doc})
        });
    };
    //移除角色的某些资源的某些权限
    var _remove=function (opts, cb) {
        var roles=opts.data.roles;
        var resources=opts.data.resources;
        var permissions=opts.data.permissions;
        if(permissions){
            acl.removeAllow(roles, resources, permissions,cb);
        }else{
            acl.removeAllow(roles, resources,cb);
        }
    };
    //给某些角色增加某些资源的某些权限
    var _setResourcePermission=function (opts, cb) {
        var roles=opts.data.roles;
        var allows=opts.data.addPermission;
        var remove=opts.data.removePermission;
        async.series({
            flag1:function(done){
                async.each(remove,function (item,callback) {
                    if(item.permissions){
                        service.removeAllow(roles,item.resources,item.permissions, function (error,doc) {
                            if(!error){
                                callback();
                            }else {
                                done(error, null);
                            }
                        });
                    }else {
                        callback();
                    }
                },function (error, doc) {
                    if(!error){
                        done(null,doc);
                    }else {
                        done(error, null);
                    }
                });
            },
            flag2:function(done){
                acl.allow([{roles:roles,allows: allows}],function (error,doc) {
                    if(!error){
                        done(null,doc);
                    }else {
                        done(error, null);
                    }
                });
            }
        },function(error,result){
            if(error){
                cb(error, null);
            }else {
               cb(null,{ret:"1"});
            }
        });
    };
    router.add('/:id/resources','get',roleResources);
    router.add('/:id/user','get',_roleUsers );
    router.add('/:id/resource','post',_setResourcePermission);
    router.add('/:id/resource','delete',_remove);
    router.use(ms.daorouter(role));
    role.routes.after_create = function(opts, cb, next){
        if(opts.doc.parents){
                acl.addRoleParents(opts.doc.code,opts.doc.parents,function (err, doc) {
                    if(err){
                        opts.err = err;
                    }
                    next();
                })
            }else{
                next();
            }
    };
    role.routes.before_update = function(opts, cb, next){
        if(opts.data.parents){
            acl.removeRoleParents(this.role.codeById(opts.params.id), function (err, doc) {
                if(err){
                    opts.err = err;
                }
                next();
            })
        }else{
            next();
        }
    };
    role.routes.after_update = function(opts, cb, next){
        if(opts.data.parents){
            acl.addRoleParents(this.role.codeById(opts.params.id),opts.doc.parents,function (err, doc) {
                if(err){
                    opts.err = err;
                }
                next();
            })
        }else{
            next();
        }
    };
    role.routes.before_remove = function(opts, cb, next){
        var id = opts.params.id;
        var roleId=[id];
        var roleCode = [];
        async.waterfall([
            function(cb){//获取其子角色
                role.findOne({_id:id},function(err,doc){
                    if(err) return cb(err);
                    if(!doc) return cb({err:-1,msg:'角色不存在'});
                    roleCode.push(doc.code);
                    role.find({parents: doc.code },function(err,ary){
                        if(err) return cb(err);
                            ary.forEach(function (item) {
                                roleCode.push(item.code);
                                roleId.push(item._id)
                            });
                        cb(null,roleCode);
                    });
                });
            },
            function(roleCode,cb){//移除角色关系表(包含子角色)
                async.each(roleCode,function(code,callback){
                    acl.removeRole(code,function(err,doc){
                        if(err) return callback(err);
                        callback();
                    });
                },function(err){
                    if(err) return cb(err);
                    cb(null,roleCode);
                });
            },
            function (roleCode,cb) {//获取拥有此角色的用户
                var userIds = [];
                async.each(roleCode,function(code,callback){
                    acl.roleUsers(code,function(err,docs){
                        if(err) return callback(err);
                        docs.forEach(function (item) {
                            if(userIds.indexOf(item)==-1){
                                userIds.push(item);
                            }
                        });
                        callback();
                    });
                },function(err){
                    if(err) return cb(err);
                    cb(null,userIds);
                });
            },
            function (userIds,cb) {//移除用户角色关系
                console.log(roleCode);
                async.each(userIds,function(id,callback){
                    acl.removeUserRoles(id,roleCode,function(err,doc){
                        if(err) return callback(err);
                        callback();
                    });
                },function(err){
                    if(err) return cb(err);
                    cb(null,userIds);
                });
            }
        ], function (err, results) {
                if(err){
                    opts.err=err;
                }
                console.log(roleId);
                opts.params.id=roleId;
                next();
        });
    };
    return router;
};