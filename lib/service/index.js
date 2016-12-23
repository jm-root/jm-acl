var _ = require('lodash');
var async = require('async');
var jmcommon = require('jm-common');
var DB = jmcommon.DB;
var mq = jmcommon.mq;
jmcommon.root.registries.router = {enable_router_save:true};
var config = require('../../config');
var ERR = require('../../consts').ERR;

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;

module.exports =  function(opts){
    opts = opts || {};
    opts.config = opts.config || {};
    _.defaultsDeep(opts.config, config);
    config = opts.config;
    console.log('acl config version : '+config.env);

    var superRole = opts.superRole || 'superadmin';

    opts.aclOpts = {
        db: opts.db || DB.connect(config.db),
        superRole: superRole
    };

    var o = {
        config: config
        ,superRole: superRole
        ,logger: require('./log4js')
        ,utils: require('./utils')
    };

    jmcommon.enableEvent(o);

    var Acl = require('./acl');
    o.acl = new Acl(opts.aclOpts);

    o.sdk = opts.sdk || require('jm-playsdk').sdk;
    !opts.sdk&&o.sdk.init({uri:config.sdk});

    var sso = o.sso = o.sdk.sso||{};
    var acl = o.acl;


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
    acl.filter = opts.filter ||
        function (opts, cb) {
            var d = Date.now();
            o.logger.debug('acl.filter start');

            opts = opts || {};
            opts.path = opts.path || '';
            opts.method = opts.method&&opts.method.toLowerCase() || '';
            var res = {userRoles:[],permissions:[]};
            async.waterfall([
                function(cb){
                    var token = opts.token;
                    if(!token) return cb();

                    var d1 = Date.now();
                    sso.getUser({token:token}, function(err, doc){
                        if(err || !doc) {
                            return cb();
                        }
                        o.logger.debug('acl.filter>>sso.getUser requested:'+(Date.now()-d1));
                        res.id = doc.id;
                        res.token = token;
                        cb();
                    });
                },
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
                            acl.userRoles(res.id, function(err, roles){
                                console.log(roles+"+++++++++++"+err);
                                if(!err) res.userRoles = roles;
                                cb();
                            });
                        },
                        function(cb){
                            console.log("2");
                            acl.allowedPermissions(res.id, resource, function(err, obj){
                                if(!err){
                                    res.permissions = obj[resource]||[];
                                }
                                cb();
                            });
                        }
                    ],function(err,result){
                        console.log("3");
                        var isSuper = res.userRoles.indexOf(superRole)!=-1;
                        if(isSuper&&!res.permissions.length) res.permissions.push('*');
                        cb();
                    })
                },
                function(cb){
                    console.log("4");
                    var method = opts.method;
                    acl.resource.findOne({code:res.resource,status:1},function(err,doc){
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
                console.log("5");
                if(err) return cb(err, result);
                o.logger.debug('acl.filter end: '+(Date.now()-d));
                cb(null, res);
            });

            var isAdmin = function(opts,cb){
                var id = res.id;
                if(!id){
                    return cb(new Error('未登录'), ERR.acl.NOT_LOGIN);
                }
                acl.hasRole(id, superRole, function(err, is_in_role) {
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

