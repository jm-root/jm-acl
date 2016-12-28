var jm = require('jm-core');
var ERR = require('../../consts').ERR;
var Acl = require('acl');

module.exports = function (opts) {
    opts || (opts = {});
    var db = opts.db;
    var superRole = opts.superRole || 'superadmin';
    var guestUser = opts.guestUser || 'guest';
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
         * @param {Object} [opts={}] 参数
         * @example
         * opts参数:{
         *  resource: 资源(可选, 默认'')
         *  permissions: 权限数组(可选, 默认'')
         *  user: 用户，一般为userId(可选)
         * }
         * @param {callback} [cb=function(err,doc){}] 回调
         * @example
         * cb参数格式:
         * 成功响应:
         * doc: {
         *  ret: 结果 0 禁止 1 允许
         * }
         * 错误响应:
         * doc: {
         *  err: 错误码,
         *  msg: 错误信息
         * }
         */
        isAllowed: function (opts, cb) {
            var self = this;
            var resource = opts.resource;

            //如果资源没有登记到acl，允许访问
            if (!resource || !this.resource.idByCode(resource)) return cb(null, true);

            var permissions = opts.permissions;
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

            var user = opts.user || guestUser;
            //如果请求的用户具有superRole角色，允许访问
            self.acl.hasRole(user, superRole, function (err, doc) {
                if (doc) return cb(null, true);
                self.acl.isAllowed(user, resource, permissions, cb);
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
    o.utils = require('./utils');
    o.filter = require('./filter')(o);

    return o;
};

