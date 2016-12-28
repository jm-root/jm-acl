/**
 * Created by sahara on 2016/12/23.
 */
var jm = require('jm-ms-daorouter');
var async=require('async');
var ms = jm.ms;

module.exports = function (service, opts) {
    var role = service.role;
    var acl = service.acl;
    var router = ms();
    //获取角色结构树
    var findRolestree=function (opts, cb) {
        opts.conditions={
            _id:opts.params.id
        };
        acl.findTree(opts,role,function (err,doc) {
            if(err){
                logger.error(err);
                return cb(err,null);
            }
            cb()
        });
    };
    //查询角色有哪些资源（无permission） 或者限定权限下的某资源 （有permission）
    var roleResources=function (opts, cb) {
        var id=opts.params.id;
        var permission=opts.data.permissions;
      acl.whatResources(id,permission,function (err,doc) {
          if(err){
              logger.error(err);
              return cb(err,null);
          }
          cb()
      });
    };
    //获取某角色的用户
    var _roleUsers=function (opts, cb) {
        var id=opts.params.id;
        acl.roleUsers(id,function (err,doc) {
            if(err){
                logger.error(err);
                return cb(err,null);
            }
            cb(null,{rows:doc})
        });
    };
    //给某些角色增加某些资源的某些权限
    var _setResourcePermission=function (opts, cb) {
        var roles=opts.data.roles;
        var resources=opts.data.resources;
        var permissions=opts.data.permissions;
        acl.allow(roles, resources, permissions,function (err,doc) {
            if(err){
                logger.error(err);
                return cb(err,null);
            }
            cb()
        });
    };
    //移除角色的某些资源的某些权限
    var _remove=function (opts, cb) {
        var roles=opts.data.roles;
        var resources=opts.data.resources;
        var permissions=opts.data.permissions;
        acl.removeAllow(roles, resources, permissions,function (err,doc) {
            if(err){
                logger.error(err);
                return cb(err,null);
            }
            cb()
        });
    };
    jm.enableEvent(role);
    router.add('/:id/tree','get',findRolestree);
    router.add('/:id/resource','get',roleResources);
    router.add('/:id/user','get',_roleUsers );
    router.add('/:id/resource','post',_setResourcePermission);
    router.add('/:id/resource','delete',_remove);
    router.use(ms.daorouter(role));
    role.routes.after_create = function(opts, cb, next){
        if(opts.doc.parent){
                acl.addRoleParents(opts.doc._id,opts.doc.parent,function (err, doc) {
                    if(err){
                        opts.err = err;
                    }
                    next();
                })
            }else{
                next();
            }
    };
    role.routes.before_update = function(opts, cb, next){
        if(opts.data.parent){
            acl.removeRoleParents({_id:opts.params.id},function (err, doc) {
                if(err){
                    opts.err = err;
                }
                next();
            })
        }else{
            next();
        }
    };
    role.routes.after_update = function(opts, cb, next){
        if(opts.data.parent){
            acl.addRoleParents(opts.doc._id,opts.doc.parent,function (err, doc) {
                if(err){
                    opts.err = err;
                }
                next();
            })
        }else{
            next();
        }
    };
    role.routes.before_remove = function(opts, cb, next){
        var id = opts.params.id || opts.data.id;
        var roleIds = [id];
        async.waterfall([
            function(cb){//获取其子角色
                role.findOne({_id:id},function(err,doc){
                    if(err) return cb(err);
                    if(!doc) return cb({err:-1,msg:'角色不存在'});
                    role.find({parent:id},function(err,ary){
                        if(err) return cb(err);
                        ary.forEach(function (item) {
                            roleIds.push(item._id);
                        });
                        cb();
                    });
                });
            },
            function(cb){//移除角色关系表(包含子角色)
                async.each(roleIds,function(id,callback){
                    acl.removeRole(id,function(err,doc){
                        if(err) return callback(err);
                        callback();
                    });
                },function(err){
                    if(err) return cb(err);
                    cb();
                });
            },
            function (cb) {//获取拥有此角色的用户
                var userIds = [];
                async.each(roleIds,function(id,callback){
                    acl.roleUsers(id,function(err,docs){
                        if(err) return callback(err);
                        docs.forEach(function (item) {
                            if(userIds.indexOf(item)==-1){
                                userIds.push(item);
                            }
                        });
                        callback();
                    });
                },function(err){
                    if(err) return cb(err);
                    cb(null,userIds);
                });
            },
            function (userIds,cb) {//移除用户角色关系
                async.each(userIds,function(id,callback){
                    acl.removeUserRoles(id,roleIds,function(err,doc){
                        if(err) return callback(err);
                        callback();
                    });
                },function(err){
                    if(err) return cb(err);
                    cb(null,userIds);
                });
            },
            function(cb){//移除资源
                role.remove({ _id: { $in: roleIds }},cb);
            }
        ], function (err, results) {
            err ? cb(err) :  cb(null,{ret: "成功删除角色"});
        });
    };
    return router;
};