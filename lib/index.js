var service = require('./service');

/**
 * acl服务
 * @class acl
 * @param {Object} [opts={}] 参数
 * @example
 * opts参数:{
 *  config: (可选, 如果不填，取默认配置)
 *  db:(可选, mongoose对象)
 *  sdk: (可选, jm-playsdk对象,默认创建)
 *  superRole: (可选, 超级角色,默认为'superadmin')
 * }
 * @returns {Object}
 * @example
 * 返回结果:{
 * }
 */
module.exports = function(opts){
    opts = opts || {};
    var o = {};//service(opts);

    o.router = function(opts){
        return require('./router')(o, opts);
    };

    return o;
};
