var jm = jm || {};
if ((typeof exports !== 'undefined' && typeof module !== 'undefined')) {
    jm = require('jm-sdk-core');
    require('jm-ms');
}

(function () {
    var sdk = jm.sdk;
    var storage = sdk.storage;
    var ms = jm.ms;

    var modelName = 'acl';
    if(sdk[modelName]) return;
    sdk.on('init', function (opts) {
        opts[modelName] = opts[modelName] || {};
        opts[modelName].uri = opts[modelName].uri || opts.uri;
        opts[modelName].timeout = opts[modelName].timeout || opts.timeout;
        sdk[modelName].init(opts[modelName]);
    });
    var cb_default = function(err, doc) {};

    /**
     * acl对象
     * @class  acl
     * @param {Object} [opts={}] 参数
     * @example
     * opts参数:{
     *  uri: 服务器uri(可选)
     * }
     */
    sdk.acl = {
        init: function (opts) {
            var self = this;
            opts = opts || {};
            var uri = opts.uri;
            var prefix = opts.prefix || '/' + modelName;
            this.uri = uri + prefix;
            var app = ms();
            self.client = app;
            app.use(function(opts, cb, next){
                opts.data || (opts.data={});
                if(!opts.data.token){
                    var token = storage.getItem('token') || null;
                    if(token) opts.data.token = token;
                }
                next();
            });
            ms.client({
                uri: this.uri,
                timeout: opts.timeout || 0
            }, function(err, doc){
                if(!err && doc) {
                    app.use({fn: doc});
                    doc.on('open', function(){
                        sdk.emit('open', modelName);
                    });
                    doc.on('close', function(){
                        sdk.emit('close', modelName);
                    });
                }
            });
            jm.enableEvent(this);
        },

        /**
         * 检测是否有权限访问
         * @function acl#isAllowed
         * @param {Object} [opts={}] 参数
         * @example
         * opts参数:{
         *  token: (可选)
         *  user: 用户(可选)
         *  resource: 资源(可选)
         *  permisssions: 权限(可选)
         * }
         * @param {callback} [cb=function(err,doc){}] 回调
         * @example
         * cb参数格式:
         * doc参数:{
         *  ret: 结果 1允许 0禁止
         *  }
         * 出错时, doc参数:{
         *  err: 错误码,
         *  msg: 错误信息
         * }
         */
        isAllowed: function (opts, cb) {
            cb || (cb = cb_default);
            opts || (opts = {});
            var url = '/isAllowed';
            this.client.get({
                uri: url,
                data: opts
            }, cb);
        },

        /**
         * 获取用户角色
         * @function acl#userRoles
         * @param {Object} [opts={}] 参数
         * @example
         * opts参数:{
         *  token: (可选)
         * }
         * @param {callback} [cb=function(err,doc){}] 回调
         * @example
         * cb参数格式:
         * doc参数:{
         *  ret: 角色数组
         *  }
         * 出错时, doc参数:{
         *  err: 错误码,
         *  msg: 错误信息
         * }
         */
        userRoles: function (opts, cb) {
            cb || (cb = cb_default);
            opts || (opts = {});
            var url = '/userRoles';
            this.client.get({
                uri: url,
                data: opts
            }, cb);
        }

    };

})();
