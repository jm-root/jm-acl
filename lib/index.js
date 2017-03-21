require('../consts');

/**
 * acl服务
 * @class acl
 * @param {Object} [opts={}] 参数
 * @example
 * opts参数:{
 *  db:(必填)
 *  mq:(可选，如果有，则更新时通过消息服务器通知重新加载)
 *  superRole: (可选, 超级角色, 默认为'superadmin')
 *  guestRole: (可选, 游客角色, 默认为'guest')
 *  userRole: (可选, 登录用户角色, 默认为'user')
 *  disableAutoInit: (可选, 禁止自动初始化, 默认为false，检测到未初始化时，自动初始化)
 *  tableNamePrefix: (可选, 表名前缀, 默认为'')
 *  defaultAllow: (可选, 是否默认允许访问未登记的资源或者权限, 默认为false, 禁止访问)
 * }
 * @returns {Object}
 * @example
 * 返回结果:{
 * }
 */
var jm = require('jm-core');
if(!jm.acl){
    jm.acl = function(opts){
        opts = opts || {};
        ['db', 'mq', 'superRole', 'guestRole', 'userRole', 'disableAutoInit', 'tableNamePrefix', 'defaultAllow'].forEach(function(key) {
            process.env[key] && (opts[key] = process.env[key]);
        });
        var o = require('./service')(opts);
        o.router = require('./router');
        return o;
    };
}
module.exports = jm.acl;
