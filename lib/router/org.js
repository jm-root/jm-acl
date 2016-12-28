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
    var getTree = function (opts, cb) {
        opts || (opts = {});
        cb(null, {ret: org.getTree(opts.params.id)});
    };
    // //获取某个组织下的所有角色
    // var findOrgsRoles=function (opts,cb) {
    //
    // };
    // //移除某个组织下的角色
    // var delOrgsRoles=function (opts, cb) {
    //     var id=opts.params.id;
    //     role.update({org:id},{org:null},{multi:true},function (err, doc) {
    //         if(err){
    //             cb(err,"移除角色失败");
    //         }
    //         cb(null,"成功移除角色");
    //     });
    // };
    // //获取某个组织下的所有用户
    // var findOrgsUsers=function (opts,cb) {
    //     var id=opts.params.id;
    //     async.waterfall([
    //         function (cb) {//获取所有子组织
    //             org.find({parent:id},{_id:1},function (err, orgs) {
    //                 if(err){
    //                     return cb(err,null);
    //                 }
    //                 cb(null,orgs)
    //             })
    //         },
    //         function (orgs,cb) {//获取组织所有角色
    //           role.find({org:{ $in: orgs }},{_id:1},function (err, roles) {
    //               if(err){
    //                   return cb(err,null);
    //               }
    //               cb(null,roles)
    //           })
    //         },
    //         function (roles, cb) {//获取角色的用户
    //             var users=[];
    //             async.each(roles,function (role, callback) {
    //                 acl.roleUsers(role,function (err, docs) {
    //                     if(err){
    //                         return cb(err ,null);
    //                     }
    //                     docs.forEach(function (item) {
    //                         if(users.indexOf(item)==(-1)){
    //                             users.push(item);
    //                         }
    //                     }) ;
    //                     callback()
    //                 })
    //             },function(err){
    //                 if(err) return cb(err);
    //                 cb(null,users);
    //             })
    //         }
    //     ],function (err, doc) {
    //         if(err){
    //             cb(err,null);
    //         }
    //         cb(null,doc);
    //     });
    // };
    // router.add('/:id/roles','get',findOrgsroles);
    // router.add('/:id/roles','delete',delOrgsroles);
    // router.add('/:id/users','get',findOrgsusers);

    router.add('/tree', 'get', getTree);
    router.add('/:id/tree', 'get', getTree);
    router.use(ms.daorouter(org));
    return router;
};