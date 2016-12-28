var jm = require('jm-core');
var ERR = jm.ERR;

module.exports =  function(service, opts){
    opts || (opts={});

    /**
     * 过滤效验
     * @method acl#filter
     * @param {Object} [opts={}] 参数
     * @example
     * opts参数:{
     *  userId: 用户Id(可选)
     *  uri: 请求路径(可选, 默认'')
     *  method: 请求类型(可选, 默认'')
     * }
     * @param {callback} [cb=function(err,doc){}] 回调
     * @example
     * cb参数格式:
     * 成功响应:
     * doc: {
     *  id: '用户id',
     *  permission: '权限',
     *  resource: '资源'
     * }
     * 错误响应:
     * doc: {
     *  err: 错误码,
     *  msg: 错误信息
     * }
     */
    return function(opts, cb){
        opts = opts || {};
        opts.uri || (opts.uri='');
        opts.type = opts.type&&opts.type.toLowerCase() || '';
        var ret = {};
        ret.permission = opts.type;
        ret.resource = opts.uri.toLowerCase()
            .replace(/([a-z]|[0-9]){24}/g,":id")
            .replace(/_(.+?)_/g,":name")
            .replace(/\/$/g,"");

        var userId = opts.userId;
        var resource = ret.resource;
        var permission = opts.type;

        if(userId) {
            ret.id = userId;
        }
        service.isAllowed({
            user: userId,
            resource: resource,
            permissions: [permission]
        }, function(err, r){
            if(!err && r){
                return cb(null, ret);
            }
            cb(new Error(ERR.FA_NOPERMISSION.msg), ERR.FA_NOPERMISSION);
        });
    };
};

