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
        console.log("opts")
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
                        console.log("1")
                        cb();
                    })
                },
                function (cb) {
                    _delUser(user,function (err,doc) {
                        if(err)cb(err,null);
                        console.log("2")
                        cb();
                    });
                }
            ], function (err) {
                if(err)cb(err,null);
                console.log("3")
                cb(null,{ret:'删除用户成功'});
            });
    };
    var _delUser=function (userId,cb) {
        async.waterfall([
            function (cb) {//获取用户创建的角色
                service.role.find({creator:userId},function (err,doc) {
                    if(err)  cb(err,Err.acl.DATA_NOT_EXIST);
                    cb(null,doc);
                });
            },
            function (roles,cb) {
                if(roles){//移除用户创建的角色
                    async.each(roles,function (role,callback) {
                        service.role.before_remove({params:role.code},function (err,doc) {
                            if(err)cb(err,null);
                            callback();
                        })
                    },function(err){
                        if(err) return cb(err);
                        cb();
                    })
                }else{
                    cb();
                }
            },
            function (cb) {//获取用户分配的角色用户
                user.find({creator:userId},function (err, doc) {
                    if(err)  cb(err,Err.acl.DATA_NOT_EXIST);
                    cb(null,doc);
                });
            },
            function (users,cb) {
                if(users){//移除用户分配的角色用户
                    async.each(users,function (user,callback) {
                        _delUser(user._id,function (err,doc) {
                            if(err)cb(err,null);
                            callback();
                        })
                    },function(err){
                        if(err) return cb(err);
                        cb();
                    })
                }else{
                    cb();
                }
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
                  opts.conditions[creator]=opts.data.creator;
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
        var remove=[];
        var oldPermission;
        var newPermission;
        if (opts.data.roles) {
            async.waterfall([
                function (cb) {//获取用户之前的角色
                    service.userRoles(user, function (err, doc) {
                        if (err) {
                            opts.err = err;
                        }
                        cb(null, doc);
                    })
                },
                function (roles,cb) {//获取用户的资源及权限
                    service.userResources(opts.data._id.toString(),function (err,doc) {
                        if (err) {
                            opts.err = err;
                        }
                        oldPermission=doc;
                        cb(null, roles);
                    });
                },
                function (roles, cb) {//移除之前的角色
                    service.removeUserRoles(user, roles, function (err, doc) {
                        if (err) {
                            opts.err = err;
                        }
                        cb(null, doc);
                    })
                },
                function (doc, cb) {//添加新的资源权限
                    service.addUserRoles(user, opts.data.roles, function (err, doc) {
                        if (err) {
                            opts.err = err;
                        }
                        cb(null, doc);
                    })
                },
                function (roles,cb) {//获取用户的资源及权限
                    service.userResources(opts.data._id.toString(),function (err,doc) {
                        if (err) {
                            opts.err = err;
                        }
                        newPermission=doc;
                        cb(null, roles);
                    })
                }
            ], function (err) {
                if (err) {
                    opts.err = err;
                }
                next();
            });
        } else {
            next();
        }
    };
    return router;
};