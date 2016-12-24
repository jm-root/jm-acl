/**
 * Created by sahara on 2016/12/23.
 */
var jmcore = require('jm-ms-core');
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
        acl.findTree(opts,role,cb);
    };
    //查询角色有哪些资源
    var roleResources=function (opts, cb) {
        var id=opts.params.id;
        var permission=opts.data.id||{};
      acl.whatResources(id,permission,cb);
    };
    //获取某角色的用户
    var _roleUsers=function (opts, cb) {
        var id=opts.params.id;
        acl.roleUsers(id,cb);
    };
    jmcore.enableEvent(role);
    router.add('/:id/tree','get',findRolestree);
    router.add('/:id/resource','get',roleResources);
    router.add('/:id/user','get',_roleUsers );
    router.use(ms.daorouter(role));
    role.routes.before_remove = function(opts, cb, next){
        var id = opts.params.id || opts.data.id;
        var roleIds = [id];
        async.waterfall([
            function(cb){//获取其子角色
                role.findOne({_id:id},function(err,doc){
                    if(err) return cb(err);
                    if(!doc) return cb({err:-1,msg:'角色不存在'});
                    roleIds.push(doc.code);
                    role.distinct('_id',{parent:doc._id},function(err,ary){
                        if(err) return cb(err);
                        roleIds = roleIds.concat(ary);
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
            function(cb){//移除资源
                role.remove({ _id: { $in: roleIds }},cb);
            }
        ], function (err, results) {
            err ? cb(err) :  cb(null,{ret: "成功删除角色"});
        });
    };
    return router;
};