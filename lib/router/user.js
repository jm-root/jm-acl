/**
 * Created by sahara on 2016/12/23.
 */
var jm = require('jm-ms-daorouter');
var async=require('async');
var ms = jm.ms;

module.exports = function (service, opts) {
    var acl=service.acl;
    var user = service.user;
    var router = ms();
    jm.enableEvent(user);
    router.use(ms.daorouter(user));
    //获取用户角色
    var _getUserRoles=function (opts, cb) {
        var id=opts.params.id;
        user.getUserRoles(id,function (err,doc) {
            if(err){
                logger.error(err);
                return cb(err,null);
            }
            cb()
        });
    };
    //设置用户的角色
    var _setUserRoles=function (opts,cb) {
        var id=opts.data.id;
        var roles=opts.data.roles;
        user.setUserRoles(id,roles,function (err,doc) {
            if(err){
                logger.error(err);
                return cb(err,null);
            }
            cb()
        });
    };
    //移除用户角色
    var _delUserRoles=function (opts, cb) {
        var id=opts.data.id;
        var roles=opts.data.roles;
        user.delUserRoles(id,roles,function (err,doc) {
            if(err){
                logger.error(err);
                return cb(err,null);
            }
            cb()
        });
    };
    //获取用户资源下的权限
    var _userResourcesPermission=function (opts, cb) {
        var id=opts.params.id;
        var resource=opts.data.resource;
        user.userResourcesPermission(id,resource,function (err,doc) {
            if(err){
                logger.error(err);
                return cb(err,null);
            }
            cb()
        });
    };
    //用户所属组织
    var _userOrg=function (opts, cb) {
        var  id=opts.params.id;
        user.userOrg(id,function (err,doc) {
            if(err){
                logger.error(err);
                return cb(err,null);
            }
            cb()
        });
    };
    //获取用户所有的资源及权限
    var userResources=function (opts, cb) {
        var id=opts.params.id;
        async.waterfall([
            function (cb) {
                acl.userRoles(id,function (err,doc) {
                    if(err){
                        logger.error(err);
                        return cb(err,null);
                    }
                    cb(null,doc)
                });
            },
            function (roles,cb) {
                var resources=[];
                async.each(roles,function (item,callback) {
                    acl.whatResources(item,function (err,docs) {
                        if(err){
                            logger.error(err);
                            return callback(err,null);
                        }
                        for (var key in docs) {
                            if (docs.hasOwnProperty(key)){
                                if(resources.indexOf(key)==-1){
                                    resources.push(key);
                                }
                            }
                        }
                        callback()
                    });

                },function (err, docs) {
                    if(err){
                        logger.error(err);
                        return cb(err,null);
                    }
                    cb(null,resources);
                });
            },
            function (resources,cb) {
                acl.allowedPermissions(id,resources,function (err, doc) {
                    if(err){
                        logger.error(err);
                        return cb(err,null);
                    }
                    cb(null,doc);
                });
            }
        ],function (err,doc) {
            if(err){
                logger.error(err);
                return cb(err,null);
            }
            cb(null,doc);
        });
    };
    //获取用户资源树
    var userResourcesTree=function (opts,cb) {
        userResources(opts,function (err, docs) {
            var codes=[];
            var roots=[];
            var nodes=[];
            for (var key in docs) {
                if (docs.hasOwnProperty(key)){
                    codes.push(key);
                }
            }
           codes.forEach(function (code){
                var node={
                    'code':code,
                    'title':service.resource.titleByCode(code)||'',
                    'permissions':docs[code]
                };
                if(nodes[node.code]){
                    node.children = nodes[node.code].children;
                }
                nodes[node.code] = node;
                node.parent=findParent(code,codes);
                if(node.parent){
                    nodes[node.parent] || (nodes[node.parent]={});
                    nodes[node.parent].children || (nodes[node.parent].children = []);
                    nodes[node.parent].children.push(node);
                } else {
                    roots.push(node);
                }
            });
            cb(null,roots);
        });
    };
    var findParent=function (code,codes) {
      if(service.resource.parentByCode(code)){
            if(codes.indexOf(service.resource.parentByCode(code))!=-1){
                    return service.resource.parentByCode(code);
            }
            findParent(service.resource.parentByCode(code),codes)
      }else{
          return null;
      }
    };
    router.add('/:id/role','get',_getUserRoles);
    router.add('/:id/role','post',_setUserRoles);
    router.add('/:id/role','delete',_delUserRoles);
    router.add('/:id/resource','get',_userResourcesPermission);
    router.add('/:id/resources','get',userResources);
    router.add('/:id/resources/tree','get',userResourcesTree);
    router.add('/:id/orgs','get',_userOrg);
    return router;
};