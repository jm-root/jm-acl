/**
 * Created by sahara on 2016/12/23.
 */
var jm = require('jm-ms-daorouter');
var async = require('async');
var ms = jm.ms;

module.exports = function (service, opts) {
    var acl = service.acl;
    var user = service.user;
    var router = ms();
    jm.enableEvent(user);
    //获取用户资源下的权限
    var _userResourcesPermission = function (opts, cb) {
        var id = opts.params.id;
        var resource = opts.data.resource;
        service.allowedPermissions(id, resource, function (err, doc) {
            if (err) {
                logger.error(err);
                return cb(err, null);
            }
            cb()
        });
    };
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

    router
        .add('/:id/resource', 'get', _userResourcesPermission)
        .add('/:id/resources', 'get', userResources)
        .add('/:id/resources/tree', 'get', userResourcesTree)
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
                            ID: 1,
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
        opts.options = {sort: {crtime: -1}};
        next();
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
        if (opts.data.roles) {
            async.waterfall([
                function (cb) {
                    service.userRoles(user, function (err, doc) {
                        if (err) {
                            opts.err = err;
                        }
                        cb(null, doc);
                    })
                },
                function (roles, cb) {
                    service.removeUserRoles(user, roles, function (err, doc) {
                        if (err) {
                            opts.err = err;
                        }
                        cb(null, doc);
                    })
                },
                function (doc, cb) {
                    service.addUserRoles(user, opts.data.roles, function (err, doc) {
                        if (err) {
                            opts.err = err;
                        }
                        cb(null, doc);
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
    user.routes.after_remove = function (opts, cb, next) {
        var user = opts.params.id.toString();
        async.waterfall([
            function (cb) {
                service.userRoles(user, function (err, doc) {
                    if (err) {
                        opts.err = err;
                    }
                    cb(null, doc);
                })
            },
            function (roles, cb) {
                service.removeUserRoles(user, roles, function (err, doc) {
                    if (err) {
                        opts.err = err;
                    }
                    cb(null, doc);
                })
            }
        ], function (err) {
            if (err) {
                opts.err = err;
            }
            next();
        });
    };
    return router;
};