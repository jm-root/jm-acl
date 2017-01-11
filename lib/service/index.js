var jm = require('jm-core');
var ERR = require('../../consts').ERR;
var Acl = require('acl');
var async=require('async');

module.exports = function (opts) {
    opts || (opts = {});
    var db = opts.db;
    var superRole = opts.superRole || 'root';
    var guestRole = opts.guestRole || 'guest';

    var mkError = function(err){
        return new Error(err.msg);
    };

    var cb_default = function(err, doc){
    };

    var o = {
        superRole: superRole,
        guestRole: guestRole,
        /**
         * 检测是否有权限访问，处理过程如下
         * 1，如果请求的资源没有登记到acl，允许访问
         * 2，如果请求的所有权限都没有登记到acl，允许访问
         * 3，如果请求的用户具有superRole角色，允许访问
         * 4，查询是否有权限
         * @method acl#isAllowed
         * @param {String|Number} [user] 用户, 一般为userId
         * @param {String} [resource] 资源
         * @param {String|Array} [permissions=[]] 权限数组
         * @param {callback} [cb=function(err,doc){}] 回调
         * @example
         * cb参数格式:
         * 成功响应:
         * doc: 结果(true or false)
         * 错误响应:
         * doc: {
         *  err: 错误码,
         *  msg: 错误信息
         * }
         */
        isAllowed: function (user, resource, permissions, cb) {
            cb || (cb=cb_default);
            var self = this;

            //如果已经加载资源，快速检测
            if(this.resource.loaded){
                //如果资源没有登记到acl，允许访问
                if (!resource || !this.resource.idByCode(resource)) return cb(null, true);

                var resource_node = this.resource.nodesByCode[resource];
                var bExistPermission = false;
                if(!Array.isArray(permissions)){
                    permissions = [permissions];
                }
                for (var i in permissions) {
                    var permission = permissions[i];
                    if (resource_node.permissions && resource_node.permissions.indexOf(permission) != -1) {
                        bExistPermission = true;
                        break;
                    }
                }
                //如果请求的所有权限没有登记到acl，允许访问
                if (!bExistPermission) return cb(null, true);
            }

            if(!user) {
                return self.areAnyRolesAllowed(guestRole, resource, permissions, cb);
            }
            //如果请求的用户具有superRole角色，允许访问
            self.hasRole(user, superRole, function (err, doc) {
                if (doc) return cb(null, true);
                self.acl.isAllowed(user, resource, permissions, cb);
            });
        },

        /**
         * 为用户添加角色
         * @method acl#addUserRoles
         * @param {String|Number} [user] 用户, 一般为userId
         * @param {String|Array} [roles=[]] 角色或角色数组
         * @param {callback} [cb=function(err,doc){}] 回调
         * @example
         * cb参数格式:
         * 成功响应:
         * doc: 结果(true or false)
         * 错误响应:
         * doc: {
         *  err: 错误码,
         *  msg: 错误信息
         * }
         */
        addUserRoles: function(user, roles, cb) {
            cb || (cb=cb_default);
            if(!user || !roles) {
                return cb(mkError(jm.ERR.FA_PARAMS), jm.ERR.FA_PARAMS);
            }
            this.acl.addUserRoles(user, roles, function(err){
                var doc = true;
                if(err) doc = false;
                cb(err, doc);
            });
        },

        /**
         * 为用户删除角色
         * @method acl#removeUserRoles
         * @param {String|Number} [user] 用户, 一般为userId
         * @param {String|Array} [roles=[]] 角色或角色数组
         * @param {callback} [cb=function(err,doc){}] 回调
         * @example
         * cb参数格式:
         * 成功响应:
         * doc: 结果(true or false)
         * 错误响应:
         * doc: {
         *  err: 错误码,
         *  msg: 错误信息
         * }
         */
        removeUserRoles: function(user, roles, cb) {
            cb || (cb=cb_default);
            if(!user || !roles) {
                return cb(mkError(jm.ERR.FA_PARAMS), jm.ERR.FA_PARAMS);
            }
            this.acl.removeUserRoles(user, roles, function(err){
                var doc = true;
                if(err) doc = false;
                cb(err, doc);
            });
        },

        /**
         * 获取用户的角色
         * @method acl#userRoles
         * @param {String|Number} [user] 用户, 一般为userId
         * @param {callback} [cb=function(err,doc){}] 回调
         * @example
         * cb参数格式:
         * 成功响应:
         * doc: 角色数组
         * 错误响应:
         * doc: {
         *  err: 错误码,
         *  msg: 错误信息
         * }
         */
        userRoles: function(user, cb) {
            cb || (cb=cb_default);
            this.acl.userRoles(user, cb);
        },

        roleUsers: function(role, cb) {
            cb || (cb=cb_default);
            if(!role) {
                return cb(mkError(jm.ERR.FA_PARAMS), jm.ERR.FA_PARAMS);
            }
            this.acl.roleUsers(role, cb);
        },

        /**
         * 检测用户是否拥有指定角色
         * @method acl#hasRole
         * @param {String|Number} [user] 用户, 一般为userId
         * @param {String} [role] 角色
         * @param {callback} [cb=function(err,doc){}] 回调
         * @example
         * cb参数格式:
         * 成功响应:
         * doc: 结果(true or false)
         * 错误响应:
         * doc: {
         *  err: 错误码,
         *  msg: 错误信息
         * }
         */
        hasRole: function(user, role, cb) {
            cb || (cb=cb_default);
            if(!user || !roles) {
                return cb(mkError(jm.ERR.FA_PARAMS), jm.ERR.FA_PARAMS);
            }
            this.acl.hasRole(user, role, cb);
        },

        addRoleParents: function(role, parents, cb) {
            cb || (cb=cb_default);
            if(!role) {
                return cb(mkError(jm.ERR.FA_PARAMS), jm.ERR.FA_PARAMS);
            }
            this.acl.addRoleParents(role, parents, cb);
        },

        removeRoleParents: function(role, parents, cb) {
            cb || (cb=cb_default);
            if(!role) {
                return cb(mkError(jm.ERR.FA_PARAMS), jm.ERR.FA_PARAMS);
            }
            this.acl.removeRoleParents(role, parents, cb);
        },

        removeRole: function(role, cb) {
            cb || (cb=cb_default);
            if(!role) {
                return cb(mkError(jm.ERR.FA_PARAMS), jm.ERR.FA_PARAMS);
            }
            this.acl.removeRole(role, cb);
        },

        removeResource: function(resource, cb) {
            cb || (cb=cb_default);
            if(!resource) {
                return cb(mkError(jm.ERR.FA_PARAMS), jm.ERR.FA_PARAMS);
            }
            this.acl.removeResource(resource, cb);
        },

        allow: function(roles, resources, permissions, cb) {
            cb || (cb=cb_default);
            this.acl.allow(roles, resources, permissions, cb);
        },

        removeAllow: function(role, resources, permissions, cb) {
            cb || (cb=cb_default);
            this.acl.removeAllow(role, resources, permissions, cb);
        },

        allowedPermissions: function(user, resources, cb) {
            cb || (cb=cb_default);
            this.acl.allowedPermissions(user, resources, cb);
        },

        areAnyRolesAllowed: function(roles, resource, permissions, cb) {
            cb || (cb=cb_default);
            this.acl.areAnyRolesAllowed(roles, resource, permissions, cb);
        },

        roleResources: function(role, cb) {
            cb || (cb=cb_default);
            if(!role) {
                return cb(mkError(jm.ERR.FA_PARAMS), jm.ERR.FA_PARAMS);
            }
            this.acl.whatResources(role, cb);
        },

        whatResources: function(role, permissions, cb) {
            cb || (cb=cb_default);
            if(!role) {
                return cb(mkError(jm.ERR.FA_PARAMS), jm.ERR.FA_PARAMS);
            }
            this.acl.whatResources.apply(this.acl, arguments);
        },

        /**
         * 获取用户所有的资源及权限
         * @method acl#userResources
         * @param {String|Number} [user] 用户, 一般为userId
         * @param {callback} [cb=function(err,doc){}] 回调
         * @example
         * cb参数格式:
         * 成功响应:
         * doc: 所有资源及权限数组{resouce:[permissions]}
         * 错误响应:
         * doc: {
         *  err: 错误码,
         *  msg: 错误信息
         * }
         */
        userResources: function (user, cb) {
            cb || (cb=cb_default);
            var self = this;
            self.hasRole(user, superRole, function (err, doc) {
                if(err) return cb(err, doc);
                if(doc){
                    cb(null, self.resource.nodesByCode);
                }else{
                    async.waterfall([
                        function (cb) {
                            self.userRoles(user, function (err, doc) {
                                if(err){
                                    return cb(err, doc);
                                }
                                cb(null, doc)
                            });
                        },
                        function (roles, cb) {
                            var resources= {};
                            async.each(roles, function (item, cb) {
                                self.roleResources(item, function (err, doc) {
                                    if(err){
                                        return cb(err, doc);
                                    }
                                    for (var key in doc) {
                                        if(!resources[key]){
                                            resources[key] = doc[key];
                                        }else{
                                            doc[key].forEach(function(permission){
                                                if(resources[key].indexOf(permission)==-1){
                                                    resources[key].push(permission);
                                                }
                                            });
                                        }
                                    }
                                    cb();
                                });
                            },function (err, doc) {
                                if(err){
                                    return cb(err, doc);
                                }
                                cb(null, resources);
                            });
                        }
                    ], cb);
                }
            });
        },

        /**
         * 获取用户所有的资源及权限, 以树状结构返回
         * @method acl#userResourcesTree
         * @param {String|Number} [user] 用户, 一般为userId
         * @param {callback} [cb=function(err,doc){}] 回调
         * @example
         * cb参数格式:
         * 成功响应:
         * doc: 所有资源树
         * 错误响应:
         * doc: {
         *  err: 错误码,
         *  msg: 错误信息
         * }
         */
        userResourcesTree: function (user, cb) {
            cb || (cb=cb_default);
            var self = this;
            self.hasRole(user, superRole, function (err, doc) {
                if(err) return cb(err, doc);
                if(doc){
                    cb(null, self.resource.roots);
                }else{
                    var roots = [];
                    var nodes = {};
                    var nodesByCode = {};
                    for(var id in self.resource.nodes) {
                        var node = self.resource.nodes[id];
                        node = {
                            id: node.id,
                            code: node.code,
                            title: node.title,
                            parent: node.parent
                        };
                        if(nodes[node.id]){
                            node.children = nodes[node.id].children;
                        }
                        nodes[node.id] = node;
                        nodesByCode[node.code] = node;
                        if(node.parent){
                            nodes[node.parent] || (nodes[node.parent]={});
                            nodes[node.parent].children || (nodes[node.parent].children = []);
                            nodes[node.parent].children.push(node);
                        } else {
                            roots.push(node);
                        }
                    }
                    self.userResources(user, function (err, docs) {
                        for (var code in docs) {
                            if(nodesByCode[code])
                                nodesByCode[code].permissions = docs[code].permissions;
                        }
                        cb(null,roots);
                    });
                }
            });
        }

    };
    jm.enableEvent(o);

    o.acl = new Acl(new Acl.mongodbBackend(opts.db.db, 'acl_'));
    o.org = require('./org')(o, {db: db});
    o.role = require('./role')(o, {db: db});
    o.resource = require('./resource')(o, {db: db});
    o.user = require('./user')(o, {db: db});
    o.permission = require('./permission')(o, {db: db});

    return o;
};

