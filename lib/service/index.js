var jm = require('jm-core');
var ERR = jm.ERR;
var Acl = require('acl');
var async=require('async');
var _ = require('lodash');
var logger = jm.getLogger('jm-acl');
var Promise = require('bluebird');

module.exports = function (opts) {
    opts || (opts = {});
    var mq = opts.mq;
    if(typeof opts.mq === 'string') {
        mq = require('jm-mq')({url: opts.mq});
    }
    var superRole = opts.superRole || 'root';
    var guestRole = opts.guestRole || 'guest';
    var userRole = opts.userRole || 'user';
    var debug = opts.debug || false;
    var disableAutoInit = opts.disableAutoInit || false;
    var tableNamePrefix = opts.tableNamePrefix;
    opts.tableNamePrefix === undefined && (tableNamePrefix = 'acl_' );

    var mkError = function(err){
        return new Error(err.msg);
    };

    var cb_default = function(err, doc){
    };

    var promiseReject = function(err,cb){
        return Promise.reject(mkError(err)).asCallback(function(error){
            cb(error,err);
        });
    };

    var o = {
        ready: false,
        debug: debug,
        disableAutoInit: disableAutoInit,
        superRole: superRole,
        guestRole: guestRole,
        userRole: userRole,
        mq: mq,

        hasSuperRole: function(user, cb) {
            return this.hasRole(user, superRole, cb);
        },

        /**
         * 检测是否有权限访问，处理过程如下
         * 1，如果请求的资源没有登记到acl，允许访问
         * 2，如果请求的所有权限都没有登记到acl，允许访问
         * 3，如果请求的资源是guestRole角色拥有的, 允许访问
         * 4，如果请求的资源是userRole角色拥有并验证身份的, 允许访问
         * 5，如果请求的用户具有superRole角色，允许访问
         * 6，查询是否有权限
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
            if(typeof user == 'function') cb = user, user=null;
            if(typeof resource == 'function') cb = resource, resource=null;
            if(typeof permissions == 'function') cb = permissions, permissions=null;

            //如果已经加载资源，快速检测
            if(this.resource.loaded){
                //如果资源没有登记到acl，允许访问
                if (!resource || !this.resource.idByCode(resource)) return Promise.resolve(true).asCallback(cb);

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
                if (!bExistPermission) return Promise.resolve(true).asCallback(cb);
            }

            return self.areAnyRolesAllowed(guestRole, resource, permissions).then(function(ret){
                //如果请求的资源是guestRole角色拥有的, 允许访问
                if(ret) return Promise.resolve(true).asCallback(cb);
                return self.areAnyRolesAllowed(userRole, resource, permissions).then(function(ret){
                    //如果请求的资源是userRole角色拥有并验证身份的, 允许访问
                    if(ret&&user) return Promise.resolve(true).asCallback(cb);
                    if(!user||!resource||!permissions) return Promise.resolve(false).asCallback(cb);
                    //如果请求的用户具有superRole角色，允许访问
                    return self.hasSuperRole(user).then(function (ret) {
                        if(ret) return Promise.resolve(true).asCallback(cb);
                        return self.acl.isAllowed(user, resource, permissions, cb);
                    });
                });
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
            if(typeof user == 'function') cb = user, user=null;
            if(typeof roles == 'function') cb = roles, roles=null;
            if(!user || !roles) {
                return promiseReject(ERR.FA_PARAMS,cb);
            }
            return this.acl.addUserRoles(user, roles).then(function(){
                return Promise.resolve(true).asCallback(cb);
            }).catch(function(err){
                return Promise.reject(err).asCallback(function(error){
                    cb(error,false);
                });
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
            if(typeof user == 'function') cb = user, user=null;
            if(typeof roles == 'function') cb = roles, roles=null;
            if(!user || !roles) {
                return promiseReject(ERR.FA_PARAMS,cb);
            }
            return this.acl.removeUserRoles(user, roles).then(function(){
                return Promise.resolve(true).asCallback(cb);
            }).catch(function(err){
                return Promise.reject(err).asCallback(function(error){
                    cb(error,false);
                });
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
            var self = this;
            cb || (cb=cb_default);
            if(!user) return Promise.resolve([]).asCallback(cb);
            return self.acl.userRoles(user, cb);
        },

        roleUsers: function(role, cb) {
            cb || (cb=cb_default);
            if(!role) {
                return promiseReject(ERR.FA_PARAMS,cb);
            }
            return this.acl.roleUsers(role, cb);
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
            if(typeof user == 'function') cb = user, user=null;
            if(typeof role == 'function') cb = role, role=null;
            if(!user || !role) {
                return Promise.resolve(false).asCallback(cb);
            }
            return this.acl.hasRole(user, role, cb);
        },

        addRoleParents: function(role, parents, cb) {
            cb || (cb=cb_default);
            if(!role) {
                return promiseReject(ERR.FA_PARAMS,cb);
            }
            return this.acl.addRoleParents(role, parents, cb);
        },

        removeRoleParents: function(role, parents, cb) {
            cb || (cb=cb_default);
            if(!role) {
                return promiseReject(ERR.FA_PARAMS,cb);
            }
            return this.acl.removeRoleParents(role, parents, cb);
        },

        removeRole: function(role, cb) {
            cb || (cb=cb_default);
            if(!role) {
                return promiseReject(ERR.FA_PARAMS,cb);
            }
            return this.acl.removeRole(role, cb);
        },

        removeResource: function(resource, cb) {
            cb || (cb=cb_default);
            if(!resource) {
                return promiseReject(ERR.FA_PARAMS,cb);
            }
            return this.acl.removeResource(resource, cb);
        },

        allow: function(roles, resources, permissions, cb) {
            cb || (cb=cb_default);
            return this.acl.allow(roles, resources, permissions, cb);
        },

        removeAllow: function(role, resources, permissions, cb) {
            cb || (cb=cb_default);
            return this.acl.removeAllow(role, resources, permissions, cb);
        },

        allowedPermissions: function(user, resources, cb) {
            cb || (cb=cb_default);
            return this.acl.allowedPermissions(user, resources, cb);
        },

        areAnyRolesAllowed: function(roles, resource, permissions, cb) {
            cb || (cb=cb_default);
            return this.acl.areAnyRolesAllowed(roles, resource, permissions, cb);
        },

        roleResources: function(role, cb) {
            cb || (cb=cb_default);
            return this.whatResources(role, cb);
        },

        whatResources: function(role, permissions, cb) {
            cb || (cb=cb_default);
            if(typeof permissions == 'function') cb = permissions;
            if(!role) {
                return promiseReject(ERR.FA_PARAMS,cb);
            }
            //处理permissions为空时采用2参数
            var args = [].slice.call(arguments);
            if(args.length==3&&!permissions) args.splice(1,1);
            //加return支持原来函数bluebird功能
            return this.acl.whatResources.apply(this.acl, args);
        },

        /**
         * 获取用户所有的资源及权限
         * @method acl#userResources
         * @param {String|Number} [user] 用户, 一般为userId
         * @param {String} [resource] 资源,如指定了将返回该资源下所有资源及权限
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
        userResources: function (user, resource, cb) {
            var self = this;
            cb || (cb=cb_default);
            if(arguments.length==2){
                cb = resource;
                resource = null;
            }
            var pick = [];
            if(resource){
                var rows = self.resource.flatTree(resource);
                pick = _.map(rows, 'code');
            }

            self.hasSuperRole(user, function (err, doc) {
                if(err) return cb(err, doc);
                if(doc){
                    var ret={};
                    for(var key in self.resource.nodesByCode){
                        if(!resource||pick.indexOf(key)!=-1)
                            ret[key]=self.resource.nodesByCode[key].permissions;
                    }
                    cb(null, ret);
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
                            self.roleResources(roles, function (err, doc) {
                                if(err){
                                    return cb(err, doc);
                                }
                                cb(null, doc);
                            });
                        },
                        function(resources, cb){
                            if(!resource) return cb(null, resources);
                            var ret = _.pick(resources, pick);
                            cb(null, ret);
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
            self.hasSuperRole(user, function (err, doc) {
                if(err) return cb(err, doc);
                if(doc){
                    cb(null, {rows:self.resource.roots});
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
                        cb(null,{rows:self.resource.roots});
                    });
                }
            });
        }

    };
    jm.enableEvent(o);

    var db = opts.db;
    if(typeof opts.db === 'string') {
        db = require('jm-dao').DB.connect(opts.db);
    }
    var acl = null;
    if(db) {
        db.on('open', function(){
            o.acl = new Acl(new Acl.mongodbBackend(db.db, '_' + tableNamePrefix));
        });
    }

    o.role = require('./role')(o, {db: db, prefix: tableNamePrefix});
    o.resource = require('./resource')(o, {db: db, prefix: tableNamePrefix});
    o.user = require('./user')(o, {db: db, prefix: tableNamePrefix});
    o.permission = require('./permission')(o, {db: db, prefix: tableNamePrefix});
    require('./init')(o);

    var vNames = ['permission', 'resource', 'role'];
    o.reload = function() {
        vNames.forEach(function(name){
            o.reloadByName(name);
        });
    };
    o.reloadByName = function(name){
        if(!name || !o[name]) return;
        o[name].load();
    };
    if(mq) {
        var _onmessage = function(channel, message){
            logger.info('mq channel: %s, message: %s', channel, message);
            vNames.forEach(function(name){
                if (channel == 'acl.reload.' + name) {
                    o[name].emit('load');
                }
            });
        };

        mq.psubscribe('acl.reload.*');
        mq.onPMessage(function(pattern, channel, message){
            _onmessage(channel, message);
        });

        o.reloadByName = function(name){
            mq.publish('acl.reload.' + name, '');
        };
    }

    o.on('loading', function(name){
        o.ready = false;
        logger.info('loading: %s', name);
    });

    o.on('loaded', function(name){
        var ready = true;
        vNames.forEach(function(name){
            if(!o[name].loaded) ready = false;
        });
        o.ready = ready;
        logger.info('loaded: %s', name);
    });

    return o;
};

