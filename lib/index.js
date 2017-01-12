require('../consts');
var service = require('./service');

/**
 * acl服务
 * @class acl
 * @param {Object} [opts={}] 参数
 * @example
 * opts参数:{
 *  db:(必填)
 *  superRole: (可选, 超级角色, 默认为'superadmin')
 *  guestRole: (可选, 游客角色, 默认为'guest')
 * }
 * @returns {Object}
 * @example
 * 返回结果:{
 * }
 */
module.exports = function(opts){
    opts = opts || {};
    var o = service(opts);

    o.router = function(opts){
        return require('./router')(o, opts);
    };

    return o;
};
