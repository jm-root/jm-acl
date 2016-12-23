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

    var orgOpts = {
        list: {
            conditions:{
            }
            ,options: {
                sort: {sort:1}
            }
            ,fields: {
                pid: 1,
                code: 1,
                title: 1,
                description: 1,
                sort: 1
            }
            ,populations : [
                {path: 'pid',  select: 'code title description sort'}
            ]
        },
        get : {
            fields: {
                pid: 1,
                code: 1,
                title: 1,
                description: 1,
                sort: 1
            }
            ,populations : [
                {path: 'pid',  select: 'code title description sort'}
            ]
        }
    };

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
                sso.findUser({token:token, account:'admin'},function(err,doc){
                    if(err) return cb();
                    if(!doc) return cb({err:-1,msg:'请先注册admin用户'});
                    acl.addUserRoles(doc._id, service.superRole, function(err){
                        if(err) logger.error(err);
                        cb();
                    });
                });
            },
            function(cb){
                var p = path.join(__dirname,'../../config/roles.json');
                var data = jmcommon.utils.readJsonSync(p);
                acl.addRoles(data,function(){
                    cb();
                });
            },
            function(cb){
                var p = path.join(__dirname,'../../config/organization.json');
                var data = jmcommon.utils.readJsonSync(p);
                acl.initOrg(data,cb);
            },
            function(cb){
                var p = path.join(__dirname,'../../config/resources.json');
                var data = jmcommon.utils.readJsonSync(p);
                acl.initResources(data,function(){
                    cb();
                });
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
    var _filter = function(opts, cb, next){routes.filter(opts, cb, next);};

    var _filterNext = function(opts, cb, next){routes.filterNext(opts, cb, next);};
    var _init = function(opts, cb, next){routes.init(opts, cb, next);};
    var router = ms();
    router.add( '/','get',_help );
/*  router.add( '/filter','get',_filter );
    router.use( _filterNext);
    router.add( '/init','get',_init );*/
    router.use('/org',require('./org')(service));
    router.use('/role',require('./role')(service));
    router.use('/resource',require('./resource')(service));
    router.use('/permission',require('./permission')(service));
    return router;
};