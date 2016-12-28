/**
 * Created by sahara on 2016/12/23.
 */
var jm = require('jm-ms-daorouter');
var async=require('async');
var ms = jm.ms;

module.exports = function (service, opts) {
    var org = service.org;
    var role = service.role;
    var acl = service.acl;
    var router = ms();
    //获取某个组织结构图
    var findOrgsTree=function (opts,cb) {
        var id=opts.params.id;
        cb(null,org.nodes[id])
    };
    //获取组织结构图
    var orgsTree=function (opts,cb) {
        cb(null,org.nodesByCode.root)
    };
    //获取某个组织下的所有角色
    var findOrgsRoles=function (opts,cb) {
        var id=opts.params.id;
        var orgId=[id];
       async.waterfall([
           function (cb) {//获取所有子组织
               org.find({parent:id},{_id:1},function (err, orgs) {
                   if(err){
                       return cb(err,null);
                   }
                   orgs.forEach(function (item) {
                       orgId=orgId.concat(item._id);
                   });
                   cb(null,orgId)
               })
           },
           function (orgId,cb) {
               org.find({parent:{ $in: orgId }},{_id:1},function (err, doc) {
                   if(err){
                       return cb(err,null);
                   }
                   if(doc){
                       doc.forEach(function (item) {
                           orgId=orgId.concat(item._id);
                       });
                   }
                   cb(null,orgId)
               })
           },
           function (orgId,cb) {//获取组织所有角色
               role.find({org:{ $in: orgId }},function (err, roles) {
                   if(err){
                       return cb(err,null);
                   }
                   cb(null,roles)
               })
           }
       ],function (err,doc) {
           if(err) return cb(err);
           cb(null,doc);
       });
    };
    //移除某个组织下的角色
    var delOrgsRoles=function (opts, cb) {
        var id=opts.params.id;
        role.update({org:id},{org:null},{multi:true},function (err, doc) {
            if(err){
                cb(err,"移除角色失败");
            }
            cb(null,"成功移除角色");
        });
    };
    //获取某个组织下的所有用户
    var findOrgsUsers=function (opts,cb) {
        var id=opts.params.id;
        async.waterfall([
            function (cb) {//获取所有子组织
                org.find({parent:id},{_id:1},function (err, orgs) {
                    if(err){
                        return cb(err,null);
                    }
                    cb(null,orgs)
                })
            },
            function (orgs,cb) {//获取组织所有角色
              role.find({org:{ $in: orgs }},{_id:1},function (err, roles) {
                  if(err){
                      return cb(err,null);
                  }
                  cb(null,roles)
              })
            },
            function (roles, cb) {//获取角色的用户
                var users=[];
                async.each(roles,function (role, callback) {
                    acl.roleUsers(role,function (err, docs) {
                        if(err){
                            return cb(err ,null);
                        }
                        docs.forEach(function (item) {
                            if(users.indexOf(item)==(-1)){
                                users.push(item);
                            }
                        }) ;
                        callback()
                    })
                },function(err){
                    if(err) return cb(err);
                    cb(null,users);
                })
            }
        ],function (err, doc) {
            if(err){
                cb(err,null);
            }
            cb(null,doc);
        });
    };
    router.add('/tree','get',orgsTree);
    router.add('/:id/tree','get',findOrgsTree);
    router.add('/:id/roles','get',findOrgsRoles);
    router.add('/:id/roles','delete',delOrgsRoles);
    router.add('/:id/users','get',findOrgsUsers);
    router.use(ms.daorouter(org));
    org.routes.before_remove = function(opts, cb){
        var id = opts.params.id || opts.data.id;
        var orgIds = [id];
        async.waterfall([
            function(cb){
                role.findOne({_id:id},function(err,doc){
                        if(err) return cb(err);
                        if(!doc) return cb({err:-1,msg:'角色不存在'});
                    org.find({parent:id},function(err,ary){
                        if(err) return cb(err);
                        ary.forEach(function (item) {
                            orgIds.push(item._id);
                        });
                        cb();
                    });
                });
            },
           function(cb){
                role.update({org:{$in:orgIds}},{org:null},{multi:true},cb);
            },
            function(cb){
                org.remove({ _id: { $in: orgIds }},cb);
            }
        ], function (err, results) {
            err ? cb(err) :  cb(null, {ret: "成功删除组织"});
        });
    };
    return router;
};