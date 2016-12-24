var jm = require('jm-core');
var ERR = require('../../consts').ERR;
var Acl = require('acl');

module.exports =  function(opts){
    opts || (opts={});
    var o = {};
    jm.enableEvent(o);

    o.acl = new Acl(new Acl.mongodbBackend(opts.db.db, 'acl_'));
    o.org = require('./org')(o, opts);
    o.role = require('./role')(o, opts);
    o.resource = require('./resource')(o, opts);
    o.permission = require('./permission')(o, opts);
    o.utils = require('./utils');

    /**
     * 过滤效验
     * @method acl#filter
     * @param {Object} [opts={}] 参数
     * @example
     * opts参数:{
     *  token: 用户令牌(可选)
     *  path: 请求路径(可选, 默认'')
     *  method: 请求类型(可选, 默认'')
     * }
     * @param {callback} [cb=function(err,doc){}] 回调
     * @example
     * cb参数格式:
     * 成功响应:
     * doc: {
     *  id: '用户id',
     *  token: '经验证后的token',
     *  userRoles: '(数组)该用户拥有的角色',
     *  permissions: '(数组)该用户拥有的权限',
     *  resource: '对应的资源'
     * }
     * 错误响应:
     * doc: {
     *  err: 错误码,
     *  msg: 错误信息
     * }
     */
    o.filter = opts.filter ||
        function (opts, cb) {
            var d = Date.now();
            o.logger.debug('acl.filter start');

            opts = opts || {};
            opts.path = opts.path || '';
            opts.method = opts.method&&opts.method.toLowerCase() || '';
            var res = {userRoles:[],permissions:[]};
            async.waterfall([
                function(cb){
                    res.resource = opts.path.toLowerCase()
                        .replace(/([a-z]|[0-9]){24}/g,":id")
                        .replace(/_(.+?)_/g,":name")
                        .replace(/\/$/g,"");
                    cb();
                },
                function(cb){
                    if(!res.id){
                        return cb();
                    }
                    var resource = res.resource;
                    async.waterfall([
                        function(cb){
                            o.acl.userRoles(res.id, function(err, roles){
                                if(!err) res.userRoles = roles;
                                cb();
                            });
                        },
                        function(cb){
                            acl.allowedPermissions(res.id, resource, function(err, obj){
                                if(!err){
                                    res.permissions = obj[resource]||[];
                                }
                                cb();
                            });
                        }
                    ],function(err,result){
                        var isSuper = res.userRoles.indexOf( "superadmin")!=-1;
                        if(isSuper&&!res.permissions.length) res.permissions.push('*');
                        cb();
                    })
                },
                function(cb){
                    var method = opts.method;
                    o.resource.findOne({code:res.resource,status:1},function(err,doc){
                        if(err) return cb(err,ERR.acl.SYSTEM);
                        if(!doc) return cb();
                        opts.perSignOnLimit = doc.perSignOnLimit || [];
                        var perNoLimit = doc.perNoLimit || [];
                        if(perNoLimit.indexOf(method)!=-1)
                            return cb();
                        isAdmin(opts,cb);
                    });
                }
            ],function(err,result){
                if(err) return cb(err, result);
                o.logger.debug('acl.filter end: '+(Date.now()-d));
                cb(null, res);
            });

            var isAdmin = function(opts,cb){
                var id = res.id;
                if(!id){
                    return cb(new Error('未登录'), ERR.acl.NOT_LOGIN);
                }
                acl.hasRole(id, "superadmin", function(err, is_in_role) {
                    if(is_in_role){
                        return cb();
                    }
                    author(opts,cb);
                });
            };

            var author = function(opts,cb){
                var resource = res.resource;
                var permission =  opts.method;
                var perSignOnLimit = opts.perSignOnLimit;

                if(!resource || !permission) return cb(new Error('没有权限'), ERR.acl.NOT_PERMISSION);
                if(perSignOnLimit.indexOf(permission) != -1) return cb();

                acl.isAllowed(res.id, resource, permission, function(err, r){
                    if(r){
                        return cb();
                    }
                    cb(new Error('没有权限'), ERR.acl.NOT_PERMISSION);
                });
            };
        };

    return o;
};

