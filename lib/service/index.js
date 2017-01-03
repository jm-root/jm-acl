var jm = require('jm-core');
var ERR = require('../../consts').ERR;
var Acl = require('acl');

module.exports = function (opts) {
    opts || (opts = {});
    var db = opts.db;
    var superRole = opts.superRole || 'superadmin';
    var guestUser = opts.guestUser || 'guest';

    var mkError = function(err){
        return new Error(err.msg);
    };

    var o = {
        superRole: superRole,
        guestUser: guestUser,
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
            var self = this;
            //如果资源没有登记到acl，允许访问
            if (!resource || !this.resource.idByCode(resource)) return cb(null, true);

            var resource_node = this.resource.nodesByCode[resource];
            var bExistPermission = false;
            for (var i in permissions) {
                var permission = permissions[i];
                if (resource_node.permssions.indexOf(permission) != -1) {
                    bExistPermission = true;
                    break;
                }
            }
            //如果请求的所有权限没有登记到acl，允许访问
            if (!bExistPermission) return cb(null, true);

            user || (user = guestUser);
            //如果请求的用户具有superRole角色，允许访问
            self.acl.hasRole(user, superRole, function (err, doc) {
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
            user || (user = guestUser);
            if(!roles) {
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
            user || (user = guestUser);
            if(!roles) {
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
         * doc: 角色黍组
         * 错误响应:
         * doc: {
         *  err: 错误码,
         *  msg: 错误信息
         * }
         */
        userRoles: function(user, cb) {
            user || (user = guestUser);
            this.acl.userRoles(user, cb);
        },

         // [roleUsers](#roleUsers)
         // [hasRole](#hasRole)
         // [addRoleParents](#addRoleParents)
         // [removeRoleParents](#removeRoleParents)
         // [removeRole](#removeRole)
         // [removeResource](#removeResource)
         // [allow](#allow)
         // [removeAllow](#removeAllow)
         // [allowedPermissions](#allowedPermissions)
         // [areAnyRolesAllowed](#areAnyRolesAllowed)
         // [whatResources](#whatResources)
    };
    jm.enableEvent(o);

    o.acl = new Acl(new Acl.mongodbBackend(opts.db.db, 'acl_'));
    o.org = require('./org')(o, {db: db});
    o.role = require('./role')(o, {db: db});
    o.resource = require('./resource')(o, {db: db});
    o.user = require('./user')(o, {db: db});
    o.permission = require('./permission')(o, {db: db});
    o.filter = require('./filter')(o);

    return o;
};

