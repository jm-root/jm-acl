var async = require('async');
var _ = require('lodash');
var path = require('path');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var jmcommon = require('jm-common');
var jm = require('jm-ms-core');
var ms = jm.ms;
var consts = require('../../consts');
var ERR = consts.ERR;


/**
 * @apiDefine Error
 *
 * @apiSuccess (Error 200) {Number} err 错误代码
 * @apiSuccess (Error 200) {String} msg 错误信息
 *
 * @apiSuccessExample {json} 错误:
 * {
 *   err: 错误代码
 *   msg: 错误信息
 * }
 */

module.exports = function (service, opts) {
    var router = ms();
    service.routes || ( service.routes = {} );
    var routes = service.routes;
    var utils = service.utils;
    var logger = service.logger;
    var acl = service.acl;
    var org = service.org;
    var role = service.role;
    var resource = service.resource;
    var permission = service.permission;
    router.use('/orgs',require('./org')(service));
    router.use('/roles',require('./role')(service));
    router.use('/users',require('./user')(service));
    router.use('/resources',require('./resource')(service));
    router.use('/permissions',require('./permission')(service));

    var package = require('../../package.json');
    routes.help = function(opts, cb){
        cb(null, {
            name: package.name,
            version: package.version
        });
    };

    routes.init = function(opts, cb, next){
        var res = opts.res || {};
        var token = res.token;
        async.waterfall([
            function(cb){
                var p = path.join(__dirname,'../../config/roles.json');
                var data = jmcommon.utils.readJsonSync(p);
                async.each(data,function (item,callback) {
                    role.create(item,function (err, doc) {
                        if(err){
                            logger.error(err);
                            return cb(err, "初始化角色失败");
                        }
                        callback();
                    })
                },function (err,doc) {
                    if(err){
                        logger.error(err);
                        return cb(err, "初始化角色失败");
                    }
                    cb();
                });
            },
            function(cb){
                var p = path.join(__dirname,'../../config/organization.json');
                var data = jmcommon.utils.readJsonSync(p);
                service.createTreeData(org,data,['code','title','description','sort'],cb);
            },
            function(cb){
                var p = path.join(__dirname,'../../config/resources.json');
                var data = jmcommon.utils.readJsonSync(p);
                service.createTreeData(resource,data,['code','title','description','sort'],cb);
            },
            function(cb){
                var perPath = path.join(__dirname,'../../config/permissions.json');
                var permissions = jmcommon.utils.readJsonSync(perPath);
                var roles = permissions || {};
                _.forEach(roles, function(role, roleName) {
                    _.forEach(role, function(permissions, resource) {
                        refresh(roleName, resource, permissions);
                    });
                });
                cb();
            }
        ],function(err,result){
            if(err){
                return cb(new Error('初始失败'),err);
            }
            cb(null,{});
        });
        function refresh(roleName, resource, permissions){
            acl.removeAllow(roleName, resource,function(){
                if(permissions.length){
                    acl.allow(service.superRole,resource,['*']);
                    acl.allow(roleName, resource, permissions);
                }
            });
        }
    };



    var _help = function(opts, cb, next){routes.help(opts, cb, next);};
    router.add( '/','get',_help );
  //  router.add( '/init','get',_init );
    return router;
};