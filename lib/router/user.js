/**
 * Created by sahara on 2016/12/23.
 */
var jm = require('jm-ms-daorouter');
var async = require('async');
var ms = jm.ms;
var consts = require('../../consts');
var ERR = consts.ERR;
module.exports = function (service, opts) {
    var user = service.user;
    var router = ms();
    jm.enableEvent(user);
    //获取用户所有的资源及权限
    var userResources = function (opts, cb) {
        var id = opts.params.id;
        service.userResources(id, cb);
    };
    //获取用户资源树
    var userResourcesTree = function (opts, cb) {
        var id = opts.params.id;
        service.userResourcesTree(id, cb);
    };
    //删除用户
    var delUse=function (opts, cb) {
        var user = opts.params.id.toString();
            async.waterfall([
                function (cb) {
                    service.userRoles(user, function (err, doc) {
                        if(err)cb(err,null);
                        cb(null, doc);
                    })
                },
                function (roles, cb) {
                    service.removeUserRoles(user, roles, function (err, doc) {
                        if(err)cb(err,null);
                        cb();
                    })
                },
                function (cb) {
                    _delUser(user,function (err,doc) {
                        if(err)cb(err,null);
                        cb();
                    });
                }
            ], function (err) {
                if(err)cb(err,null);
                cb(null,{ret:'删除用户成功'});
            });
    };
    var _delUser=function (userId,cb) {
        async.waterfall([
            function (cb) {//获取用户创建的角色
                service.role.find({creator:userId},function (err,doc) {
                    if(err)  cb(err,ERR.acl.DATA_NOT_EXIST);
                    cb(null,doc);
                });
            },
            function (roles,cb) {//移除用户创建的角色
                async.each(roles,function (role,callback) {
                    delUserRoles(role._id,function (err, doc) {
                        callback();
                    });
                },function(err){
                    if(err) return cb(err);
                    cb();
                })
            },
            function (cb) {//获取用户分配的角色用户
                user.find({creator:userId},function (err, doc) {
                    if(err)  cb(err,Err.acl.DATA_NOT_EXIST);
                    cb(null,doc);
                });
            },
            function (users,cb) {//移除用户分配的角色用户
                async.each(users,function (user,callback) {
                    _delUser(user._id,function (err,doc) {
                        if(err)cb(err,null);
                            callback();
                        })
                },function(err){
                     if(err) return cb(err);
                        cb();
                })
            },
            function (cb) {//移除用户
                user.remove({_id:userId},function (err,doc) {
                    if(err)cb(err,null);
                    cb(null,doc)
                })
            }
        ],function (err,doc) {
            if(err)cb(err,null);
            cb(null,doc)
        });
    };
    var delUserRoles=function (id,cb) {
        var roleId=[id];
        var roleCode = [];
        async.waterfall([
            function(cb){//获取其子角色
                service.role.findOne({_id:id},function(err,doc){
                    if(err) return cb(err);
                    if(!doc) return cb({err:-1,msg:'角色不存在'});
                    roleCode.push(doc.code);
                    service.role.find({parents: doc.code },function(err,ary){
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
                    service.removeRole(code,function(err,doc){
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
                    service.roleUsers(code,function(err,docs){
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
                    service.removeUserRoles(id,roleCode,function(err,doc){
                        if(err) return callback(err);
                        callback();
                    });
                },function(err){
                    if(err) return cb(err);
                    cb(null,userIds);
                });
            },
            function (userIds,cb) {
                service.role.remove({ _id: { $in: userIds }}, function (err, doc) {
                    cb(err,doc);
                })
            }
        ], function (err, results) {
            if(err){
                opts.err=err;
            }
            cb();
        });
    };
    router
        .add('/:id/resources', 'get', userResources)
        .add('/:id/resources/tree', 'get', userResourcesTree)
        .add('/:id', 'delete', delUse)
        .use(
            ms.daorouter(
                user,
                {
                    list: {
                        conditions: {},

                        options: {
                            sort: [{'crtime': -1}]
                        },

                        fields: {
                            roles: 1,
                            nick: 1,
                            creator: 1,
                            crtime: 1,
                            status: 1,
                            visible: 1,
                            tags: 1
                        },

                        populations: {
                            path: "creator",
                            select: {
                                nick: 1
                            }
                        }

                    },
                    get: {
                        fields: {
                            roles: 1,
                            nick: 1,
                            creator: 1,
                            crtime: 1,
                            status: 1,
                            visible: 1,
                            tags: 1
                        },

                        populations: {
                            path: "creator",
                            select: {
                                nick: 1
                            }
                        }
                    }
                }
            ))
    ;

    user.routes.before_list = function (opts, cb, next) {
        service.hasRole(opts.data.creator,service.superRole,function (err,doc) {
            if(err) opts.err=err;
            opts.conditions={};
            if (opts.data.keyword) {
                var keyword = opts.data.keyword || "";
                var pattern = ".*?" + decodeURIComponent(keyword) + ".*?";
                opts.conditions = {
                    "$or": [
                        [{nick: {$regex: pattern, $options: "i"}}],
                        [{_id: keyword}]
                    ]
                };
            }
            if(!doc){
                  opts.conditions['creator']=opts.data.creator;
            }
            next();
        });
    };

    user.routes.before_create = function (opts, cb, next) {
        var id = opts.data._id;
        user.count({_id:id},function(err,count){
            if (err) opts.err = err;
            if(count) return cb(ERR.acl.DATA_EXIST);
            next();
        });
    };
    user.routes.after_create = function (opts, cb, next) {
        var user = opts.doc._id;
        service.addUserRoles(user.toString(), opts.doc.roles, function (err, doc) {
            if (err) opts.err = err;
        });
        next();
    };
    user.routes.after_update = function (opts, cb, next) {
        var user = opts.params.id.toString();
        var oldPermission;
            async.waterfall([
                function (cb) {//获取更新之前的资源权限
                    service.userResources(opts.data._id.toString(),function (err,doc){
                        if(err){
                            opts.err=err;
                        }
                        oldPermission=doc;
                        cb();
                    });
                },
                function (cb) {//获取更新之前的用户角色
                    service.userRoles(opts.data._id.toString(),function (err,doc){
                        if(err){
                            opts.err=err;
                        }
                        cb(null,doc);
                    });
                },
                function (roles,cb) {//移除更新之前的用户角色
                    service.removeUserRoles(opts.data._id.toString(),roles,function (err,doc){
                        if(err){
                            opts.err=err;
                        }
                        cb();
                    });
                },
                function (cb) {//添加新的角色
                    service.addUserRoles(user, opts.data.roles, function (err, doc) {
                        if (err) {
                            opts.err = err;
                        }
                        cb();
                    })
                },
                function (cb) {//获取更新之后的资源权限
                    var removePermission={};
                    service.userResources(opts.data._id.toString(),function (err,doc){
                        if(err){
                            opts.err=err;
                        }
                        for (var key in oldPermission) {
                            if(!doc[key]){
                                removePermission[key] = oldPermission[key];
                            }else{
                                oldPermission[key].forEach(function(permission){
                                    if(doc[key].indexOf(permission)==-1){
                                        if(!removePermission[key]){
                                            removePermission[key] =[permission];
                                        }else {
                                            removePermission[key].push(permission);
                                        }
                                    }
                                });
                            }
                        }
                        cb(null,removePermission);
                    });
                },
                function (removePermission,cb) {
                    if(JSON.stringify(removePermission) != "{}"){
                        updateUserPermission(user,removePermission,function (err, doc) {
                            cb(err, doc);
                        });
                    }else{
                        cb()
                    }
                }
            ], function (err) {
                if (err) {
                    opts.err = err;
                }
                next();
            });
    };
    var updateUserPermission=function (user,removePermission,cb) {
        async.waterfall([
            function (cb) {//获取用户创建的角色
                service.role.find({creator:user},function (err,doc) {
                    if(err)  cb(err,ERR.acl.DATA_NOT_EXIST);
                    cb(null,doc);
                });
            },
            function (roles,cb) {//循环用户创建的角色的资源权限
                async.each(roles,function (item,callback) {
                    removeRolesPermission(item._id,removePermission,function (err, doc) {
                        callback();
                    });
                },function (err, doc) {
                    if(err){
                        cb(err,null)
                    }
                    cb()
                })
            },
            function () {//获取用户分配的用户
                service.user.find({creator:user},function (err,doc) {
                    if(err)  cb(err,ERR.acl.DATA_NOT_EXIST);
                    cb(null,doc);
                });
            },
            function (users,cb) {//循环用户分配的用户
                async.each(users,function (user,callback) {
                    updateUserPermission(user._id,removePermission,function (err, doc) {
                        callback();
                    });
                },function (err,doc) {
                    cb(err,doc)
                });
            }
        ],function (err,doc) {
            if(err){
                cb(err);
            }
            cb(null,doc);
        });
    };
    var removeRolesPermission=function (role,removePermission,cb) {
        async.waterfall([
            function (cb) {
                service.roleResources(role,function (err,doc) {
                    cb(err,doc);
                })
            },function (permissions,cb) {
                for (var key in removePermission) {
                    if(permissions[key]){
                       async.each( removePermission[key],function (item,callback) {
                            if(permissions[key].indexOf(item)>-1){
                                service.removeAllow (role,key,item,function (err,doc) {
                                    callback(err,doc);
                                })
                            }
                        },function (err,doc) {
                           cb(err,doc);
                        });
                    }else{
                        cb();
                    }
                }
            }
        ],function (err,doc) {

        });
    };
    return router;
};