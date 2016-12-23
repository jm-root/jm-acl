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
    return ms();
    opts = opts || {};
    service.routes = service.routes || {};
    var routes = service.routes;
    var utils = service.utils;
    var logger = service.logger;
    var sso = service.sso;
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
    routes.help = function(opts, cb, next){
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
                var hkey = 'SystemInit', key = 'acl';
                service.sdk.config.getConfig({root:hkey,key:key},function(err,doc){
                    if(err){
                        return cb(doc||err);
                    }
                    if(doc.ret&&!doc.ret.isInit){
                        return cb({msg:'已更新过'});
                    }
                    var data = doc.ret || {};
                    data.isInit = false;
                    service.sdk.config.setConfig({root:hkey,key:key,value:data},function(err,doc){});
                    cb();
                });
            },
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

    routes.initResources = function(opts, cb, next){
        var req = opts.data;
        var json = req.json || {};
        acl.initResources(json,function(){
            cb(null, {});
        });
    };

    routes.initPermissions = function(opts, cb, next){
        var req = opts.data;
        var json = req.json || {};

        function refresh(roleName, resource, permissions){
            acl.removeAllow(roleName, resource,function(){
                if(permissions.length){
                    acl.allow(service.superRole,resource,['*']);
                    acl.allow(roleName, resource, permissions);
                }
            });
        }
        _.forEach(json, function(role, roleName) {
            _.forEach(role, function(permissions, resource) {
                refresh(roleName, resource, permissions);
            });
        });

        cb(null, {});
    };

    routes.filter = function(opts, cb, next){
        var o = opts.data || {};
        acl.filter({token: o.token, path:o.path, method: o.method},cb);
    };

    routes.filterNext = function(opts, cb, next){
        var o = opts.data || {};
        acl.filter({token: o.token, path:opts.originalUri, method: opts.type},function(err,doc){
            if(err){
                return cb(err,doc);
            }
            opts.res = doc;
            next();
        });
    };

    routes.listOrgs = function(opts, cb, next){
        var req = opts.data;
        var page = req.page;
        var rows = req.rows;
        var status = req.status;
        var search = req.search;
        var conditions = {};
        if(status){
            status = Array.isArray(status) ? status : status.toString().split(',');
            if(status.length) conditions.status = {$in:status};
        }
        if(search){
            var ary = [];
            var pattern=".*?"+search+".*?";
            ary.push({title:{$regex:pattern}});
            conditions.$or = ary;
        }

        acl.org.find2({
            conditions: conditions,
            fields: orgOpts.list.fields,
            populations: orgOpts.list.populations,
            options: orgOpts.list.options,
            lean: true,
            page: page,
            rows: rows
        }, function (err, doc) {
            if (err) {
                logger.error(err);
                return cb(err, ERR.acl.SYSTEM);
            }
            if (page || rows) {
                cb(null, doc);
            } else {
                cb(null, {rows: doc});
            }
        });
    };

    routes.getOrgs = function(opts, cb, next){
        var req = opts.data;
        var id = opts.params.id || req.id;
        if(!ObjectId.isValid(id)){
            return next('route');
        }
        acl.org.findById2(id, {
            fields: orgOpts.get.fields,
            populations: orgOpts.get.populations,
            options: orgOpts.get.options,
            lean: true
        }, function (err, doc) {
            if (err) {
                logger.error(err);
                return cb(err, ERR.acl.SYSTEM);
            }
            cb(null, doc||{});
        });
    };

    routes.getOrgsTree = function(opts, cb, next){
        var req = opts.data;
        var code = req.code || 'root';
        acl.findOrgTree({
            conditions: {code: code},
            fields: {crtime: 0, __v: 0},
            options: {sort: {sort: 1, crtime: 1}}
        }, function (err, doc) {
            if (err) {
                logger.error(err);
                return cb(err, ERR.acl.SYSTEM);
            }
            cb(null, doc);
        });
    };

    routes.getOrgsUsers = function(opts, cb, next){
        var res = opts.res || {};
        var token = res.token;
        var req = opts.data;
        var id = opts.params.id || req.id;
        if(!ObjectId.isValid(id)){
            return next('route');
        }
        var page = req.page;
        var rows = req.rows;

        async.waterfall([
            function(cb){
                acl.org.findOne({_id:id},function(err,doc){
                    if(err){
                        logger.error(err);
                        return cb(ERR.acl.SYSTEM);
                    }
                    if(!doc) return cb({err:ERR.FAIL.err,msg:'组织不存在'});
                    cb(null,doc.code);
                })
            },
            function(org,cb){
                acl.whatRoles(org,function(err, roles){//查询机构下所有角色
                    if(err){
                        logger.error(err);
                        return cb(ERR.acl.SYSTEM);
                    }
                    roles = _.map(roles,'code');
                    acl.userrole.distinct('uid',{roles:{$in:roles}},function(err,ids){//去重
                        if(err){
                            logger.error(err);
                            return cb(ERR.acl.SYSTEM);
                        }
                        cb(null,ids);
                    });
                })
            }
        ],function(err,ids){
            if(err){
                return cb(new Error('失败'), err);
            }
            sso.getUsers({
                token: token,
                ids: ids,
                fields: {nick: 1, headimgurl: 1},
                sort: {_id: 1},
                page: page,
                rows: rows
            }, function (err, doc) {
                cb(err, doc);
            });
        });
    };

    routes.getOrgsRoles = function(opts, cb, next){
        var req = opts.data;
        var id = opts.params.id || req.id;
        if(!ObjectId.isValid(id)){
            return next('route');
        }
        var page = req.page;
        var rows = req.rows;

        async.waterfall([
            function(cb){
                acl.org.findOne({_id:id},function(err,doc){
                    if(err){
                        logger.error(err);
                        return cb(ERR.acl.SYSTEM);
                    }
                    if(!doc) return cb({err:ERR.FAIL.err,msg:'组织不存在'});
                    cb(null,doc.code);
                })
            }
        ],function(err,org){
            if(err){
                return cb(new Error('失败'), err);
            }
            acl.role.find2({
                conditions: {orgs:org,status:1},
                fields: {code:1,orgs:1,title:1,type:1,description:1,status:1},
                options: {sort:{crtime:1}},
                lean: true,
                page: page,
                rows: rows
            },function (err, doc) {
                if(err){
                    logger.error(err);
                    return cb(err, ERR.acl.SYSTEM);
                }
                if(page || rows) {
                    cb(null, doc);
                }else{
                    cb(null, {rows: doc});
                }
            });
        });
    };

    routes.getOrgsResources = function(opts, cb, next){
        var req = opts.data;
        var id = opts.params.id || req.id;
        if(!ObjectId.isValid(id)){
            return next('route');
        }
        var page = req.page;
        var rows = req.rows;

        async.waterfall([
            function(cb){
                acl.org.findOne({_id:id},function(err,doc){
                    if(err){
                        logger.error(err);
                        return cb(ERR.acl.SYSTEM);
                    }
                    if(!doc) return cb({err:ERR.FAIL.err,msg:'组织不存在'});
                    cb(null,doc.code);
                })
            }
        ],function(err,org){
            if(err){
                return cb(new Error('失败'), err);
            }
            acl.resource.find2({
                conditions: {orgs:org,status:1},
                fields: {code:1,orgs:1,title:1,permissions:1,description:1,status:1},
                options: {sort:{code:1,crtime:-1}},
                lean: true,
                page: page,
                rows: rows
            },function (err, doc) {
                if(err){
                    logger.error(err);
                    return cb(err, ERR.acl.SYSTEM);
                }
                if(page || rows) {
                    cb(null, doc);
                }else{
                    cb(null, {rows: doc});
                }
            });
        });
    };

    routes.setOrgs = function(opts, cb, next){
        var req = opts.data;
        //验证必填字段
        var params = utils.requireField(req,['code','title']);
        if(params){
            return cb(new Error('失败'), {err:ERR.acl.REQUIRE.err, msg:ERR.acl.REQUIRE.msg, path:params});
        }
        //提取所需字段
        var org = utils.extractAttrFromObj(req, ['pcode','pid','code','title','description','sort','type','status']);
        if(org.pid&&!ObjectId.isValid(org.pid)){
            return cb(new Error('失败'), {err:ERR.acl.PARAM.err,msg:'pid is not ObjectId'});
        }
        async.waterfall([
            function(cb){
                if(org.pcode){
                    acl.org.findOne({code:org.pcode},function(err,doc){//获取父节点的id
                        if(err){
                            logger.error(err);
                            return cb(ERR.acl.SYSTEM);
                        }
                        if(doc) org.pid = doc._id;
                        cb();
                    });
                }else{
                    cb();
                }
            },
            function(cb){
                if(!org.pid) return cb({err:ERR.acl.REQUIRE.err, msg:ERR.acl.REQUIRE.msg, path:'pid'});

                acl.org.count({_id:org.pid},function(err,count){
                    if(err){
                        logger.error(err);
                        return cb(ERR.acl.SYSTEM);
                    }
                    if(!count) return cb({err:ERR.FAIL.err,msg:'父节点不存在'});
                    cb();
                });
            },
            function(cb){
                acl.org.count({code:org.code},function(err,count){
                    if(err){
                        logger.error(err);
                        return cb(ERR.acl.SYSTEM);
                    }
                    if(count) return cb(ERR.acl.DATA_EXIST);
                    cb();
                });
            }
        ],function(err,result){
            if(err){
                return cb(new Error('失败'), err);
            }
            acl.addOrg(org,function(err,doc){
                if(err){
                    logger.error(err);
                    return cb(err, ERR.acl.SYSTEM);
                }
                cb(null, {id:doc.id});
            })
        });
    };

    routes.setOrgsById = function(opts, cb, next){
        var req = opts.data;
        var id = opts.params.id || req.id;
        if(!ObjectId.isValid(id)){
            return next('route');
        }
        var org = utils.extractAttrFromObj(req, ['pid','title','description','sort','type','status']);
        if(org.pid&&!ObjectId.isValid(org.pid)){
            return cb(new Error('失败'), {err:ERR.acl.PARAM.err,msg:'pid is not ObjectId'});
        }
        acl.org.update({_id:id}, org, function (err, doc) {
            if(err){
                logger.error(err);
                return cb(err, ERR.acl.SYSTEM);
            }
            if(!doc.n) return cb(null, ERR.FAIL);
            cb(null, {});
        });
    };

    routes.setOrgsRoles = function(opts, cb, next){
        var req = opts.data;
        var id = opts.params.id || req.id;
        if(!ObjectId.isValid(id)){
            return next('route');
        }
        //验证必填字段
        var params = utils.requireField(req,[ 'code','title','description']);
        if(params){
            return cb(new Error('失败'), {err:ERR.acl.REQUIRE.err, msg:ERR.acl.REQUIRE.msg, path:params});
        }
        //提取所需字段
        var role = utils.extractAttrFromObj(req, [ 'code','title','description','type','status']);

        async.waterfall([
            function(cb){
                acl.org.findOne({_id:id},function(err,doc){
                    if(err){
                        logger.error(err);
                        return cb(ERR.acl.SYSTEM);
                    }
                    if(!doc) return cb({err:ERR.FAIL.err,msg:'组织不存在'});
                    role.orgs = [doc.code];
                    cb();
                })
            },
            function(cb){
                acl.role.count({code:role.code},function(err,count){
                    if(err){
                        logger.error(err);
                        return cb(ERR.acl.SYSTEM);
                    }
                    if(count) return cb(ERR.acl.DATA_EXIST);
                    cb();
                });
            }
        ],function(err,result){
            if(err){
                return cb(new Error('失败'), err);
            }
            acl.addRoles(role,function(err,doc){
                if(err){
                    logger.error(err);
                    return cb(null, ERR.acl.SYSTEM);
                }
                cb(null, {code:role.code});
            })
        });
    };

    routes.setOrgsResources = function(opts, cb, next){
        var req = opts.data;
        var id = opts.params.id || req.id;
        if(!ObjectId.isValid(id)){
            return next('route');
        }
        //验证必填字段
        var params = utils.requireField(req,[ 'code','title']);
        if(params){
            return cb(new Error('失败'), {err:ERR.acl.REQUIRE.err, msg:ERR.acl.REQUIRE.msg, path:params});
        }
        //提取所需字段
        var resource = utils.extractAttrFromObj(req, [ 'code','title','description','permissions','perNoLimit','perSignOnLimit','status']);
        var permissions = resource.permissions;
        if(permissions) resource.permissions = Array.isArray(permissions) ? permissions : permissions.toString().split(',');
        var perNoLimit = resource.perNoLimit;
        if(perNoLimit) resource.perNoLimit = Array.isArray(perNoLimit) ? perNoLimit : perNoLimit.toString().split(',');
        var perSignOnLimit = resource.perSignOnLimit;
        if(perSignOnLimit) resource.perSignOnLimit = Array.isArray(perSignOnLimit) ? perSignOnLimit : perSignOnLimit.toString().split(',');

        async.waterfall([
            function(cb){
                acl.org.findOne({_id:id},function(err,doc){
                    if(err){
                        logger.error(err);
                        return cb(ERR.acl.SYSTEM);
                    }
                    if(!doc) return cb({err:ERR.FAIL.err,msg:'组织不存在'});
                    resource.orgs = [doc.code];
                    cb();
                })
            },
            function(cb){
                acl.resource.count({code:resource.code},function(err,count){
                    if(err){
                        logger.error(err);
                        return cb(ERR.acl.SYSTEM);
                    }
                    if(count) return cb(ERR.acl.DATA_EXIST);
                    cb();
                });
            }
        ],function(err,result){
            if(err){
                return cb(new Error('失败'), err);
            }
            acl.resource.create(resource,function(err,doc){
                if(err){
                    logger.error(err);
                    return cb(new Error('失败'), ERR.acl.SYSTEM);
                }
                cb(null, {id:doc.id});
            })
        });
    };

    routes.delOrgs = function(opts, cb, next) {
        var req = opts.data;
        var id = req.id;
        var ids = Array.isArray(id) ? id : id.toString().split(',');
        acl.org.count({_id: { $in: ids },code:'root'},function(err,count){
            if(err){
                logger.error(err);
                return cb(new Error('失败'), ERR.acl.SYSTEM);
            }
            if(count) return cb(new Error('失败'), {err:ERR.FAIL.err,msg:'根节点不能删除'});

            async.eachSeries(ids,function(id,callback){
                acl.removeOrg(id,function(err,ret){
                    callback(err);
                });
            },function(err){
                if(err){
                    logger.error(err);
                    return cb(new Error('失败'), err);
                }
                cb(null, {});
            });
        });
    };

    routes.delOrgsById = function(opts, cb, next) {
        var req = opts.data;
        var id = opts.params.id || req.id;
        if(!ObjectId.isValid(id)){
            return next('route');
        }
        acl.org.count({_id:id,code:'root'},function(err,count) {
            if (err) {
                logger.error(err);
                return cb(new Error('失败'), ERR.acl.SYSTEM);
            }
            if(count) return cb(new Error('失败'), {err:ERR.FAIL.err,msg:'根节点不能删除'});

            acl.removeOrg(id,function(err,ret){
                if(err){
                    logger.error(err);
                    return cb(new Error('失败'), err);
                }
                cb(null, {});
            });
        });
    };

    routes.delOrgsRoles = function(opts, cb, next) {
        var req = opts.data;
        var id = opts.params.id || req.id;
        if(!ObjectId.isValid(id)){
            return next('route');
        }
        var role = req.role||[];
        var roles = Array.isArray(role) ? role : role.toString().split(',');

        async.waterfall([
            function(cb){
                acl.org.findOne({_id:id},function(err,doc){
                    if(err){
                        logger.error(err);
                        return cb(ERR.acl.SYSTEM);
                    }
                    if(!doc) return cb({err:ERR.FAIL.err,msg:'组织不存在'});
                    cb(null,doc.code);
                })
            }
        ],function(err,org){
            if(err){
                return cb(new Error('失败'), err);
            }
            acl.removeOrgFromRoles(org,roles,function(err){
                if(err){
                    logger.error(err);
                    return cb(new Error('失败'), ERR.acl.SYSTEM);
                }
                cb(null, {});
            })
        });
    };

    routes.delOrgsResources = function(opts, cb, next) {
        var req = opts.data;
        var id = opts.params.id || req.id;
        if(!ObjectId.isValid(id)){
            return next('route');
        }
        var resource = req.resource || req.resource||[];
        var resources = Array.isArray(resource) ? resource : resource.toString().split(',');

        async.waterfall([
            function(cb){
                acl.org.findOne({_id:id},function(err,doc){
                    if(err){
                        logger.error(err);
                        return cb(ERR.acl.SYSTEM);
                    }
                    if(!doc) return cb({err:ERR.FAIL.err,msg:'组织不存在'});
                    cb(null,doc.code);
                })
            }
        ],function(err,org){
            if(err){
                return cb(new Error('失败'), err);
            }
            acl.removeOrgFromResources(org,resources,function(err){
                if(err){
                    logger.error(err);
                    return cb(new Error('失败'), ERR.acl.SYSTEM);
                }
                cb(null, {});
            })
        });
    };

    routes.setResources = function(opts, cb, next) {
        var req = opts.data;
        //验证必填字段
        var params = utils.requireField(req,[ 'code','title']);
        if(params){
            return cb(new Error('失败'), {err:ERR.acl.REQUIRE.err, msg:ERR.acl.REQUIRE.msg, path:params});
        }
        //提取所需字段
        var resource = utils.extractAttrFromObj(req, [ 'code','title','description','orgs','permissions','perNoLimit','perSignOnLimit','status']);
        var permissions = resource.permissions;
        if(permissions) resource.permissions = Array.isArray(permissions) ? permissions : permissions.toString().split(',');
        var perNoLimit = resource.perNoLimit;
        if(perNoLimit) resource.perNoLimit = Array.isArray(perNoLimit) ? perNoLimit : perNoLimit.toString().split(',');
        var perSignOnLimit = resource.perSignOnLimit;
        if(perSignOnLimit) resource.perSignOnLimit = Array.isArray(perSignOnLimit) ? perSignOnLimit : perSignOnLimit.toString().split(',');

        async.waterfall([
            function(cb){
                if(resource.orgs){
                    resource.orgs = Array.isArray(resource.orgs) ? resource.orgs : [resource.orgs];
                    acl.org.count({code:{$in:resource.orgs}},function(err,count){
                        if(err) return cb(ERR.acl.SYSTEM);
                        if(count!=resource.orgs.length) return cb({err:ERR.FAIL.err,msg:'组织不存在'});
                        cb();
                    });
                }else{
                    cb();
                }
            },
            function(cb){
                acl.resource.count({code:resource.code},function(err,count){
                    if(err){
                        logger.error(err);
                        return cb(ERR.acl.SYSTEM);
                    }
                    if(count) return cb(ERR.acl.DATA_EXIST);
                    cb();
                });
            }
        ],function(err,result){
            if(err){
                return cb(new Error('失败'), err);
            }
            acl.resource.create(resource,function(err,doc){
                if(err){
                    logger.error(err);
                    return cb(new Error('失败'), ERR.acl.SYSTEM);
                }
                if(acl.superRole){
                    acl.removeAllow(acl.superRole, resource.code,function(){
                        acl.allow(acl.superRole, resource.code, ['*']);
                    });
                }
                cb(null, {id:doc.id});
            })
        });
    };

    routes.setResourcesById = function(opts, cb, next) {
        var req = opts.data;
        var id = opts.params.id || req.id;
        if(!ObjectId.isValid(id)){
            return next('route');
        }
        var resource = utils.extractAttrFromObj(req, ['orgs','title','description','status','permissions','perNoLimit','perSignOnLimit']);
        var permissions = resource.permissions;
        if(permissions) resource.permissions = Array.isArray(permissions) ? permissions : permissions.toString().split(',');
        var perNoLimit = resource.perNoLimit;
        if(perNoLimit) resource.perNoLimit = Array.isArray(perNoLimit) ? perNoLimit : perNoLimit.toString().split(',');
        var perSignOnLimit = resource.perSignOnLimit;
        if(perSignOnLimit) resource.perSignOnLimit = Array.isArray(perSignOnLimit) ? perSignOnLimit : perSignOnLimit.toString().split(',');

        async.waterfall([
            function(cb){
                acl.resource.findOne({_id:id},function(err,doc){
                    if(err) return cb(ERR.acl.SYSTEM);
                    if(!doc) return cb(ERR.acl.DATA_NOT_EXIST);
                    cb(null,doc);
                });
            },
            function(re,cb){
                if(!permissions) return cb();
                var removePer = _.xor(re.permissions||[], resource.permissions);
                if(!removePer.length) return cb();
                acl.roleper.update({resource:re.code},{$pullAll:{permissions:removePer}},{multi:true},function(err,doc){
                    if(err) return cb(ERR.acl.SYSTEM);
                    cb();
                });
            }
        ],function(err){
            if(err) return cb(err);
            acl.resource.update({_id:id}, resource, function (err, doc) {
                if(err){
                    logger.error(err);
                    return cb(new Error('失败'), err);
                }
                if(!doc.n) return cb(new Error('失败'), ERR.FAIL);
                cb(null, {});
            });
        });
    };

    routes.listResources = function(opts, cb, next) {
        var req = opts.data;
        var page = req.page;
        var rows = req.rows;
        var status = req.status;
        var search = req.search;
        var orgs = req.orgs;
        var conditions = {};
        if(status){
            status = Array.isArray(status) ? status : status.toString().split(',');
            if(status.length) conditions.status = {$in:status};
        }
        if(search){
            var ary = [];
            var pattern=".*?"+search+".*?";
            ary.push({title:{$regex:pattern}});
            conditions.$or = ary;
        }
        if(orgs){
            if(orgs==='none'){
                conditions.$or = conditions.$or || [];
                conditions.$or.push({orgs:{$exists:false}});
                conditions.$or.push({orgs:{$size:0}});
            }else{
                orgs = Array.isArray(orgs) ? orgs : orgs.toString().split(',');
                conditions.orgs = {$in:orgs};
            }
        }

        acl.resource.find2({
            conditions: conditions,
            fields: {code:1,orgs:1,title:1,permissions:1,perNoLimit:1,perSignOnLimit:1,description:1,status:1},
            options: {sort:{code:1,_id:-1}},
            lean: true,
            page: page,
            rows: rows
        },function (err, doc) {
            if(err){
                logger.error(err);
                return cb(new Error('失败'), ERR.acl.SYSTEM);
            }
            if(page || rows) {
                cb(null, doc);
            }else{
                cb(null, {rows: doc});
            }
        });
    };

    routes.delResources = function(opts, cb, next) {
        var req = opts.data;
        var resource = req.resource || req.resource||[];
        var resources = Array.isArray(resource) ? resource : resource.toString().split(',');
        async.eachSeries(resources,function(resource,callback){
            acl.removeResource(resource,function(err,ret){
                callback(err);
            });
        },function(err){
            if(err){
                logger.error(err);
                return cb(new Error('失败'), err);
            }
            cb(null, {});
        });
    };

    routes.getUserRoles = function(opts, cb, next) {
        var req = opts.data;
        var res = opts.res || {};
        var id = req.id || res.id;
        if(!id) return cb(null, {roles:[]});
        acl.userRoles(id, function(err, roles){
            if(err){
                logger.error(err);
                return cb(new Error('失败'), ERR.acl.SYSTEM);
            }
            cb(null, {roles:roles});
        });
    };

    routes.getUserPermissions = function(opts, cb, next) {
        var req = opts.data;
        var res = opts.res || {};
        var id = res.id;
        if(!id) return cb(null, {});
        var resource = req.resource || '';
        var userId = req.userId;
        if(userId&&!ObjectId.isValid(userId)){
            return cb(new Error('失败'), {err:ERR.acl.PARAM.err,msg:'userId格式错误'});
        }
        userId = userId || id;
        resource = Array.isArray(resource) ? resource : resource.toString().split(',');

        acl.allowedPermissions(userId, resource, function(err, obj){
            if(err){
                logger.error(err);
                return cb(new Error('失败'), ERR.acl.SYSTEM);
            }
            cb(null, obj||{});
        });
    };

    routes.getRoles = function(opts, cb, next) {
        var req = opts.data;
        var orgs = req.orgs;
        if(orgs&&!_.isArrayLike(orgs)) return cb(new Error('失败'), ERR.acl.PARAM);

        acl.whatRoles(orgs,function(err, roles){
            if(err){
                logger.error(err);
                return cb(new Error('失败'), ERR.acl.SYSTEM);
            }
            cb(null, {rows:roles});
        })
    };

    routes.setRoles = function(opts, cb, next) {
        var req = opts.data;
        //验证必填字段
        var params = utils.requireField(req,[ 'code','title','description']);
        if(params){
            return cb(new Error('失败'), {err:ERR.acl.REQUIRE.err, msg:ERR.acl.REQUIRE.msg, path:params});
        }
        //提取所需字段
        var role = utils.extractAttrFromObj(req, [ 'code','title','description','orgs','type','status']);
        async.waterfall([
            function(cb){
                if(role.orgs){
                    role.orgs = Array.isArray(role.orgs) ? role.orgs : [role.orgs];
                    acl.org.count({code:{$in:role.orgs}},function(err,count){
                        if(err) return cb(ERR.acl.SYSTEM);
                        if(count!=role.orgs.length) return cb({err:ERR.FAIL.err,msg:'组织不存在'});
                        cb();
                    });
                }else{
                    cb();
                }
            },
            function(cb){
                acl.role.count({code:role.code},function(err,count){
                    if(err) return cb(ERR.acl.SYSTEM);
                    if(count) return cb(ERR.acl.DATA_EXIST);
                    cb();
                });
            }
        ],function(err,result){
            if(err) return cb(new Error('失败'), err);
            acl.addRoles(role,function(err,ret){
                if(err){
                    logger.error(err);
                    return cb(new Error('失败'), ERR.FAIL);
                }
                ret = ret[0]||{};
                if(!ret.n) return cb(new Error('失败'), ERR.FAIL);
                ret = ret.upserted[0] || {};
                if(!ret._id) return cb(new Error('失败'), ERR.FAIL);
                cb(null, {id:ret._id});
            });
        });
    };

    routes.setRolesById = function(opts, cb, next) {
        var req = opts.data;
        var id = opts.params.id || req.id;
        if(!ObjectId.isValid(id)){
            return next('route');
        }
        var role = utils.extractAttrFromObj(req, ['title','description','status','orgs']);
        var orgs = role.orgs;
        if(orgs) role.orgs = Array.isArray(orgs) ? orgs : orgs.toString().split(',');

        acl.role.update({_id:id}, role, function (err, doc) {
            if(err){
                logger.error(err);
                return cb(new Error('失败'), err);
            }
            if(!doc.n) return cb(new Error('失败'), ERR.FAIL);
            cb(null, {});
        });
    };

    routes.delRoles = function(opts, cb, next) {
        var req = opts.data;
        var role = opts.params.role || req.role;
        role = role.replace(/_/g,"");
        if([service.superRole].indexOf(role)!=-1){
            return cb(new Error('失败'), {err:ERR.FAIL.err,msg:'系统默认配置角色不能删除'});
        }
        acl.removeRole(role,function(err,ret){
            if(err){
                logger.error(err);
                return cb(new Error('失败'), ERR.acl.SYSTEM);
            }
            cb(null, {});
        });
    };

    routes.getRolesUsers = function(opts, cb, next) {
        var res = opts.res || {};
        var token = res.token;
        var req = opts.data;
        var page = req.page;
        var rows = req.rows;
        var role = opts.params.role || req.role;
        role = role.replace(/_/g,"");
        acl.roleUsers(role, function(err, users){
            if(err){
                logger.error(err);
                return cb(new Error('失败'), ERR.acl.SYSTEM);
            }
            sso.getUsers({
                token: token,
                ids: users,
                fields: {nick: 1, headimgurl: 1},
                sort: {_id: -1},
                page: page,
                rows: rows
            }, function (err, doc) {
                cb(err, doc);
            });
        });
    };

    routes.setUserRoles = function(opts, cb, next) {
        var res = opts.res || {};
        var token = res.token;
        var req = opts.data;
        var user = opts.params.user || req.user;
        var role = req.role || [];
        var roles = Array.isArray(role) ? role : role.toString().split(',');
        if(!ObjectId.isValid(user)){
            return cb(new Error('失败'), {err:ERR.acl.PARAM.err,msg:ERR.acl.PARAM.msg, path:'user'});
        }
        async.waterfall([
            function(cb){
                sso.findUser({token:token, id:user},function(err,doc){
                    if(err) return cb(err,doc);
                    cb();
                });
            },
            function(cb){
                acl.role.count({code:{$in:roles}},function(err,count){
                    if(err){
                        logger.error(err);
                        return cb(ERR.acl.SYSTEM);
                    }
                    if(count!=roles.length) return cb({err:ERR.FAIL.err,msg:'角色不存在'});
                    cb();
                });
            }
        ],function(err,result){
            if(err){
                return cb(new Error('失败'), err);
            }
            acl.addUserRoles(user, roles, function(err){
                if(err){
                    logger.error(err);
                    return cb(new Error('失败'), ERR.acl.SYSTEM);
                }
                service.sdk.sso.updateUser({token:token,userId:user,tags:{'1':['角色']}},function(err,doc){
                    if(err) logger.error(err);
                });
                cb(null, {});
            });
        });
    };

    routes.delUserRoles = function(opts, cb, next) {
        var res = opts.res || {};
        var token = res.token;
        var req = opts.data;
        var user = opts.params.user || req.user;
        var role = req.role || [];
        var roles = Array.isArray(role) ? role : role.toString().split(',');
        if(!ObjectId.isValid(user)){
            return cb(new Error('失败'), {err:ERR.acl.PARAM.err,msg:ERR.acl.PARAM.msg, path:'user'});
        }

        acl.removeUserRoles(user, roles, function(err){
            if(err){
                logger.error(err);
                return cb(new Error('失败'), ERR.acl.SYSTEM);
            }
            service.sdk.sso.updateUser({token:token,userId:user,tags:{'-1':['角色']}},function(err,doc){
                if(err) logger.error(err);
            });
            cb(null, {});
        });
    };

    routes.getRoleResources = function(opts, cb, next) {
        var req = opts.data;
        var role = opts.params.role || req.role;
        role = role.replace(/_/g,"");
        var complex = req.complex;//是否经过合成的
        if(complex) complex = !!(complex=='1'||complex=='true');

        acl.whatResources(role,function(err, resou){
            if(err){
                return cb(new Error('失败'), ERR.acl.SYSTEM);
            }
            if(!complex){
                return cb(null, resou);
            }
            var org = req.org||[];
            var orgs = Array.isArray(org) ? org : org.toString().split(',');
            var page = req.page;
            var rows = req.rows;
            var conditions = {};
            if(orgs.length) conditions.orgs = {$in:orgs};

            acl.resource.find2({
                conditions: conditions,
                fields: {code:1, title:1, permissions:1, description:1},
                options: {sort:{code:1,_id:-1}},
                lean: true,
                page: page,
                rows: rows
            },function(err, doc){
                if(err){
                    logger.error(err);
                    return cb(new Error('失败'), ERR.acl.SYSTEM);
                }
                if(page || rows) {
                    complexFun(doc.rows,resou);
                    cb(null, doc);
                }else{
                    complexFun(doc,resou);
                    cb(null, {rows: doc});
                }
            });
        });
        var complexFun = function(ary,res){
            _.forEach(ary, function(obj) {
                var perAry = res[obj.code];
                obj.isChecked = perAry!=undefined;
                var all = false;
                if(perAry) all = perAry.indexOf("*")!=-1;
                var permissions = [];
                _.forEach(obj.permissions, function(permission) {
                    var pObj = {};
                    permissions.push(pObj);
                    pObj.code = permission;
                    pObj.isChecked = false;
                    if(perAry&&perAry.length){
                        pObj.isChecked = all||perAry.indexOf(permission)!=-1;
                    }
                });
                obj.permissions = permissions;
            });
            return ary;
        }
    };

    routes.postRolePermissions = function(opts, cb, next) {
        var req = opts.data;
        var role = opts.params.role || req.role;
        role = role.replace(/_/g, "");
        if(role==service.superRole){
            return cb(null, {});
        }
        var resource = req.resource;
        var permissions = req.permissions;
        if(!_.isArrayLike(resource)) return cb(new Error('失败'), ERR.acl.PARAM);
        if(!_.isArrayLike(permissions)) return cb(new Error('失败'), ERR.acl.PARAM);

        async.waterfall([
            function(cb){
                acl.role.count({code:role},function(err,count){
                    if(err){
                        logger.error(err);
                        return cb(ERR.acl.SYSTEM);
                    }
                    if(!count) return cb({err:ERR.FAIL.err,msg:'角色不存在'});
                    cb();
                });
            },
            function(cb){
                acl.resource.count({code:resource},function(err,count){
                    if(err){
                        logger.error(err);
                        return cb(ERR.acl.SYSTEM);
                    }
                    if(!count) return cb({err:ERR.FAIL.err,msg:'资源不存在'});
                    cb();
                });
            }
        ],function(err,result){
            if(err) return cb(new Error('失败'), err);

            acl.allow(role, resource, permissions,function(err){
                if(err){
                    logger.error(err);
                    return cb(new Error('失败'), ERR.FAIL);
                }
                cb(null, {});
            });
        });
    };

    routes.delRolePermissions = function(opts, cb, next) {
        var req = opts.data;
        var role = opts.params.role || req.role;
        role = role.replace(/_/g, "");
        if (role == service.superRole) {
            return cb(null, {});
        }
        var resource = req.resource;
        var permissions = req.permissions;
        if(!_.isArrayLike(resource)) return cb(new Error('失败'), ERR.acl.PARAM);
        if(!_.isArrayLike(permissions)) return cb(new Error('失败'), ERR.acl.PARAM);

        acl.removeAllow(role, resource, permissions,function(err){
            if(err){
                logger.error(err);
                return cb(new Error('失败'), ERR.FAIL);
            }
            cb(null, {});
        });
    };

    routes.delRoleResources = function(opts, cb, next) {
        var req = opts.data;
        var role = opts.params.role || req.role;
        role = role.replace(/_/g, "");
        if (role == service.superRole) {
            return cb(null, {});
        }
        var resource = req.resource;
        if(!_.isArrayLike(resource)) return cb(new Error('失败'), ERR.acl.PARAM);

        acl.removeAllow(role, resource, function(err){
            if(err){
                logger.error(err);
                return cb(new Error('失败'), ERR.FAIL);
            }
            cb(null, {});
        });
    };
    //获取用户组织
    routes.getUserOrgs = function(opts, cb, next) {
        var req = opts.data;
        var res = opts.res || {};
        var id = req.id || res.id;
        if(!id) return cb(new Error('失败'), ERR.acl.NOT_LOGIN);
        async.waterfall([
            function (cb) {
                acl.userRoles(id, function(err, roles){//获取用户角色
                    if(err){
                        logger.error(err);
                        return cb(new Error('失败'), ERR.acl.SYSTEM);
                    }
                    cb(null,roles);
                });
            },
            function (roles,cb) {//获取用户组织
                var orgs=[];
                async.each(roles,function(role,callback){
                    acl.role.findOne({code:role},function(err,doc){
                        if(err) return callback(err);
                        doc.orgs.forEach(function(item){
                            if(orgs.indexOf(item)==(-1)){
                                orgs.push(item);
                            }
                        });
                        callback();
                    });
                },function(err){
                    if(err) return cb(err);
                    cb(null,orgs);
                });
            },

            function (orgs,cb) {//去重两级
                var orgsCode=[];
                if(orgs.indexOf("root")==(-1)) {
                    async.each(orgs, function (org, callback) {
                        acl.org.findOne({code: org}, function (err, doc) {
                            if (err) return callback(err);
                            acl.org.find( {_id: doc.pid}, function (err, porg) {//判断父组织是否在用户所属组织中
                                if (err) return cb(err);
                                if(orgs.indexOf(porg)==(-1)){
                                    orgsCode.push(org);
                                }
                                callback();
                            });
                        });
                    }, function (err) {
                        if (err) return cb(err);
                        cb(null, orgsCode);
                    });
                }else{
                    cb(null,["root"]);
                }
            },
            function (orgsCode,cb) {//获取用户组织树
                if(orgsCode.indexOf("root")>(-1)){
                    acl.findOrgTree({
                        conditions: {code: 'root'},
                        fields: {crtime: 0, __v: 0},
                        options: {sort: {sort: 1, crtime: 1}}
                    }, function (err, doc) {
                        if (err) {
                            logger.error(err);
                            return cb(err, ERR.acl.SYSTEM);
                        }
                        cb(null, doc);
                    });
                }else if(orgsCode.length>1){
                    var code={code:"",title:"合并树", children: []};
                        async.each(orgsCode,function(org,callback){
                            acl.findOrgTree({
                                conditions: {code: org},
                                fields: {crtime: 0, __v: 0},
                                options: {sort: {sort: 1, crtime: 1}}
                            }, function (err, doc) {
                                if (err) {
                                    logger.error(err);
                                    return cb(err, ERR.acl.SYSTEM);
                                }
                                code.children.push(doc);
                                callback();
                            });
                        },function(err){
                            if(err) return cb(err);
                            cb(null,code);
                        });
                }else{
                    acl.findOrgTree({
                        conditions: {code: orgsCode[0]},
                        fields: {crtime: 0, __v: 0},
                        options: {sort: {sort: 1, crtime: 1}}
                    }, function (err, doc) {
                        if (err) {
                            logger.error(err);
                            return cb(err, ERR.acl.SYSTEM);
                        }
                        cb(doc);
                    });
                }
            }
            ],function (err ,doc) {

                 if(err) return cb(new Error('失败'), err);
                 cb(null, doc)
            }
        );
    };
    //获取用户资源
    routes.getUserResources = function(opts, cb, next) {
        var req = opts.data;
        var res = opts.res || {};
        var id = req.id || res.id;
        if(!id) return cb(null, {resource:[]});
        async.waterfall([
                function (cb) {
                    acl.userRoles(id, function(err, roles){
                        if(err){
                            logger.error(err);
                            return cb(new Error('失败'), ERR.acl.SYSTEM);
                        }
                        cb(null,roles);
                    });
                },
                function (roles,cb) {
                    var resource=[];
                    async.each(roles,function (role,cb) {
                        acl.roleper.find({role:role},function (err, doc) {
                            if(err) {
                                logger.error(err);
                                return callback(err);
                            }
                            doc.forEach(function(item){
                                if(resource.indexOf(item.resource)==(-1)){
                                    resource.push(item.resource);
                                }
                            });

                            cb();
                        })
                    },function(err){
                        if(err) {
                            logger.error(err);
                            return cb(err);
                        }
                        cb(null,{resource:resource});
                    })
                }
            ],function (err ,doc) {
             if(err) {
                logger.error(err);
                return cb(err);
            }
                 cb(null,doc);
            }
        );
    };

    var _help = function(opts, cb, next){routes.help(opts, cb, next);};
    var _filter = function(opts, cb, next){routes.filter(opts, cb, next);};

    var _filterNext = function(opts, cb, next){routes.filterNext(opts, cb, next);};
    var _init = function(opts, cb, next){routes.init(opts, cb, next);};
    var _initResources = function(opts, cb, next){routes.initResources(opts, cb, next);};
    var _initPermissions = function(opts, cb, next){routes.initPermissions(opts, cb, next);};
    var _listOrgs = function(opts, cb, next){routes.listOrgs(opts, cb, next);};
    var _getOrgs = function(opts, cb, next){routes.getOrgs(opts, cb, next);};
    var _getOrgsTree = function(opts, cb, next){routes.getOrgsTree(opts, cb, next);};
    var _getOrgsUsers = function(opts, cb, next){routes.getOrgsUsers(opts, cb, next);};
    var _getOrgsRoles = function(opts, cb, next){routes.getOrgsRoles(opts, cb, next);};
    var _getOrgsResources = function(opts, cb, next){routes.getOrgsResources(opts, cb, next);};
    var _setOrgs = function(opts, cb, next){routes.setOrgs(opts, cb, next);};
    var _setOrgsById = function(opts, cb, next){routes.setOrgsById(opts, cb, next);};
    var _setOrgsRoles = function(opts, cb, next){routes.setOrgsRoles(opts, cb, next);};
    var _setOrgsResources = function(opts, cb, next){routes.setOrgsResources(opts, cb, next);};
    var _delOrgs = function(opts, cb, next){routes.delOrgs(opts, cb, next);};
    var _delOrgsById = function(opts, cb, next){routes.delOrgsById(opts, cb, next);};
    var _delOrgsRoles = function(opts, cb, next){routes.delOrgsRoles(opts, cb, next);};
    var _delOrgsResources = function(opts, cb, next){routes.delOrgsResources(opts, cb, next);};
    var _setResources = function(opts, cb, next){routes.setResources(opts, cb, next);};
    var _setResourcesById = function(opts, cb, next){routes.setResourcesById(opts, cb, next);};
    var _listResources = function(opts, cb, next){routes.listResources(opts, cb, next);};
    var _delResources = function(opts, cb, next){routes.delResources(opts, cb, next);};
    var _getUserRoles = function(opts, cb, next){routes.getUserRoles(opts, cb, next);};
    var _getUserPermissions = function(opts, cb, next){routes.getUserPermissions(opts, cb, next);};
    var _getRoles = function(opts, cb, next){routes.getRoles(opts, cb, next);};
    var _setRoles = function(opts, cb, next){routes.setRoles(opts, cb, next);};
    var _setRolesById = function(opts, cb, next){routes.setRolesById(opts, cb, next);};
    var _delRoles = function(opts, cb, next){routes.delRoles(opts, cb, next);};
    var _getRolesUsers = function(opts, cb, next){routes.getRolesUsers(opts, cb, next);};
    var _setUserRoles = function(opts, cb, next){routes.setUserRoles(opts, cb, next);};
    var _delUserRoles = function(opts, cb, next){routes.delUserRoles(opts, cb, next);};
    var _getRoleResources = function(opts, cb, next){routes.getRoleResources(opts, cb, next);};
    var _postRolePermissions = function(opts, cb, next){routes.postRolePermissions(opts, cb, next);};
    var _delRolePermissions = function(opts, cb, next){routes.delRolePermissions(opts, cb, next);};
    var _delRoleResources = function(opts, cb, next){routes.delRoleResources(opts, cb, next);};

    var _getUserOrgs= function(opts, cb, next){routes.getUserOrgs(opts, cb, next);};
    var _getUserResources = function(opts, cb, next){routes.getUserResources(opts, cb, next);};
    var router = ms();
    router
        .add({
            uri: '/',
            type: 'get',
            fn: [_help]
        })
        .add({
            uri: '/filter',
            type: 'get',
            fn: [_filter]
        })
        .use({
            fn: _filterNext
        })//初始化角色表
        .add({
            uri: '/init',
            type: 'get',
            fn: _init
        })
        .add({
            uri: '/initresources',
            type: 'get',
            fn: _initResources
        })
        .add({
            uri: '/initpermissions',
            type: 'get',
            fn: _initPermissions
        })//获取机构列表
        .add({
            uri: '/orgs',
            type: 'get',
            fn: _listOrgs
        })//获取某一机构
        .add({
            uri: '/orgs/:id',
            type: 'get',
            fn: _getOrgs
        })//获取某一机构下所有子结构
        .add({
            uri: '/orgs/tree',
            type: 'get',
            fn: _getOrgsTree
        })//获取某一机构下所有子用户
        .add({
            uri: '/orgs/:id/users',
            type: 'get',
            fn: _getOrgsUsers
        })//获取某一机构下所有子角色
        .add({
            uri: '/orgs/:id/roles',
            type: 'get',
            fn: _getOrgsRoles
        })//获取某一机构下所有资源
        .add({
            uri: '/orgs/:id/resources',
            type: 'get',
            fn: _getOrgsResources
        })//新建一个机构
        .add({
            uri: '/orgs',
            type: 'post',
            fn: _setOrgs
        })//更新一个机构
        .add({
            uri: '/orgs/:id',
            type: 'post',
            fn: _setOrgsById
        })//新建某一机构下子角色
        .add({
            uri: '/orgs/:id/roles',
            type: 'post',
            fn: _setOrgsRoles
        })//新建某一机构下子资源
        .add({
            uri: '/orgs/:id/resources',
            type: 'post',
            fn: _setOrgsResources
        })//移除某一机构包含其所有子角色
        .add({
            uri: '/orgs',
            type: 'delete',
            fn: _delOrgs
        })//移除某一机构
        .add({
            uri: '/orgs/:id',
            type: 'delete',
            fn: _delOrgsById
        })//移除角色关联的组织
        .add({
            uri: '/orgs/:id/roles',
            type: 'delete',
            fn: _delOrgsRoles
        })//移除资源关联的组织
        .add({
            uri: '/orgs/:id/resources',
            type: 'delete',
            fn: _delOrgsResources
        })//新建一个资源
        .add({
            uri: '/resources',
            type: 'post',
            fn: _setResources
        })//更新一个资源
        .add({
            uri: '/resources/:id',
            type: 'post',
            fn: _setResourcesById
        })//获取资源列表
        .add({
            uri: '/resources',
            type: 'get',
            fn: _listResources
        })//移除某一资源
        .add({
            uri: '/resources',
            type: 'delete',
            fn: _delResources
        })//获取用户的角色
        .add({
            uri: '/user/roles',
            type: 'get',
            fn: _getUserRoles
        })//获取用户的权限
        .add({
            uri: '/user/permissions',
            type: 'get',
            fn: _getUserPermissions
        })//获取角色
        .add({
            uri: '/roles',
            type: 'get',
            fn: _getRoles
        })//新建角色
        .add({
            uri: '/roles',
            type: 'post',
            fn: _setRoles
        })//更新角色
        .add({
            uri: '/roles/:id',
            type: 'post',
            fn: _setRolesById
        })//移除角色
        .add({
            uri: '/roles/:role',
            type: 'delete',
            fn: _delRoles
        })//获取某一角色的用户
        .add({
            uri: '/roles/:role/users',
            type: 'get',
            fn: _getRolesUsers
        })//给用户设置角色
        .add({
            uri: '/roles/:user/roles',
            type: 'post',
            fn: _setUserRoles
        })//给用户删除角色
        .add({
            uri: '/roles/:user/roles',
            type: 'delete',
            fn: _delUserRoles
        })//获取角色资源
        .add({
            uri: '/roles/:role/resources',
            type: 'get',
            fn: _getRoleResources
        })//新建角色权限  或者更新角色权限
        .add({
            uri: '/roles/:role/permissions',
            type: 'post',
            fn: _postRolePermissions
        })//删除角色权限
        .add({
            uri: '/roles/:role/permissions',
            type: 'delete',
            fn: _delRolePermissions
        })//删除角色资源
        .add({
            uri: '/roles/:role/resources',
            type: 'delete',
            fn: _delRoleResources
        })//获取用户组织
        .add({
            uri: '/user/orgs',
            type: 'get',
            fn: _getUserOrgs
        })//获取用户拥有的资源
        .add({
            uri: '/user/resources',
            type: 'get',
            fn: _getUserResources
        })
    ;

    return router;
};