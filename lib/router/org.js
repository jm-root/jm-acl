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
    var findOrgstree=function (opts,cb) {
        opts.conditions={
            _id:opts.params.id
        };
        acl.findTree(opts,org,cb)
    };
    //获取某个组织下的所有角色
    var findOrgsroles=function (opts,cb) {
        var id=opts.params.id;
        role.find2({parent:id},cb);
    };
    //移除某个组织下的角色
    var delOrgsroles=function (opts, cb) {
        var id=opts.params.id;
        role.update({org:id},{org:null},{multi:true},function (err, doc) {
            if(err){
                cb(err,"移除组织失败");
            }
            cb(null,"成功移除组织");
        });
    };
    //获取某个组织下的所有用户
    var findOrgsusers=function (opts,cb) {
        var id=opts.params.id;
        async.waterfall([
            function (cb) {//获取组织所有角色
              role.find({parent:id},function (err, roles) {
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
    router.add('/:id/tree','get',findOrgstree);
    router.add('/:id/roles','get',findOrgsroles);
    router.add('/:id/roles','delete',delOrgsroles);
    router.add('/:id/users','get',findOrgsusers);
    router.use(ms.daorouter(org));
    org.routes.before_remove = function(opts, cb){
        var id = opts.params.id || opts.data.id;
        var orgIds = [id];
        async.waterfall([
            function(cb){
                org.findOne({_id:id},function(err,doc){
                    if(err) return cb(err);
                    if(!doc) return cb({err:-1,msg:'组织不存在'});
                    orgIds.push(doc.code);
                    org.distinct('_id',{parent:doc._id},function(err,ary){
                        if(err) return cb(err);
                        orgIds = orgIds.concat(ary);
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