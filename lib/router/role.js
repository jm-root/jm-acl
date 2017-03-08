/**
 * Created by sahara on 2016/12/23.
 */
var jm = require('jm-ms-daorouter');
var async=require('async');
var ms = jm.ms;
var logger = jm.getLogger('jm-acl');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;

module.exports = function (service, opts) {
    var role = service.role;
    var acl = service.acl;
    var router = ms();

    //只增加修改角色不会删除已有角色
    var init = function(opts, cb){
        var rows = opts.data.rows||[];
        rows = Array.isArray(rows) ? rows : [rows];
        role.createAndUpdate(rows,function(err,ret){
            err ? cb(err):cb(null, {ret:ret});
        });
    };

    /**
     * @api {get} /roles/:id/resources 获取角色下的资源
     * @apiVersion 0.0.1
     * @apiGroup Acl
     * @apiUse Error
     *
     * @apiParam {String} permissions 权限(可选,可数组)
     *
     * @apiParamExample {json} 请求参数例子:
     * {
     * }
     *
     * @apiSuccessExample {json} 成功:
     * 方式一:
     * {
     *  '资源':['权限']
     * }
     * 方式二:
     * {
     *  rows:['具有指定权限的资源']
     * }
     */
    var roleResources=function (opts, cb, next) {
        var id = opts.params.id;
        if(!ObjectId.isValid(id)) return next('route');
        var code = opts.data.code||role.codeById(id);
        var permissions=opts.data.permissions;
        if(permissions)
            permissions = Array.isArray(permissions) ? permissions : permissions.toString().split(',');

        service.whatResources(code, permissions, function (err, doc) {
            if (err) {
                logger.error(err);
                return cb(err, null);
            }
            var ret = Array.isArray(doc)? {rows:doc} : doc;
            cb(null, ret)
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
                                callback(error);
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
    router
        .add('/init', 'post', init)
        .add('/:id/resources','get',roleResources)
        .add('/:id/users','get',_roleUsers )
        .add('/:id/resource','post',_setResourcePermission)
        .add('/:id/resource','delete',_remove)
        .use(service.routes.filter_creator)
        .use(ms.daorouter(role))
    ;

    role.routes.before_list = function (opts, cb, next) {
        opts.conditions = {};
        if(opts.data.creator){
            opts.conditions['creator']=opts.data.creator;
        }
        next();
    };
    role.routes.after_create = function (opts, cb, next) {
        if(!opts.err) service.reloadByName('role');

        if (opts.doc.parents) {
            if(!opts.doc.parents.length) return next();
            acl.addRoleParents(opts.doc.code, opts.doc.parents, function (err, doc) {
                if (err) {
                    opts.err = err;
                }
                next();
            })
        } else {
            next();
        }
    };
    role.routes.before_update = function(opts, cb, next){
        if(opts.data.parents){
            var code = role.codeById(opts.params.id);
            acl.removeRoleParents(code, function (err, doc) {
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
        if(!opts.err) service.reloadByName('role');

        if(opts.data.parents){
            var code = role.codeById(opts.params.id);
            acl.addRoleParents(code,opts.data.parents,function (err, doc) {
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
                opts.params.id=roleId;
                next();
        });
    };

    role.routes.after_remove = function(opts, cb, next){
        if(!opts.err) service.reloadByName('role');
        next();
    };

    return router;
};