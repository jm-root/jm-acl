/**
 * Created by sahara on 2016/12/23.
 */
var jm = require('jm-ms-daorouter');
var async=require('async');
var ms = jm.ms;

module.exports = function (service, opts) {
    var resource = service.resource;
    var acl = service.acl;
    var router = ms();
    //获取资源组织结构图
    var findTree=function (opts,cb) {

        cb(null,resource.nodesByCode[ '/acl'])
    };
    //获取某个资源组织结构图
    var findResourcetree=function (opts,cb) {
        var id=opts.params.id;
        cb(null,resource.nodes[id])
    };
    jm.enableEvent(resource);
    router.add('/tree','get',findTree);
    router.add('/:id/tree','get',findResourcetree);
    router.use(ms.daorouter(resource));
    resource.routes.before_remove = function(opts, cb){
        var id = opts.params.id || opts.data.id;
        var resourceIds = [id];
        async.waterfall([
            function(cb){//获取其子资源
                resource.findOne({_id:id},function(err,doc){
                    if(err) return cb(err);
                    if(!doc) return cb({err:-1,msg:'资源不存在'});
                    resource.find({parent:id},function(err,ary){
                        if(err) return cb(err);
                        ary.forEach(function (item) {
                            resourceIds.push(item._id);
                        });
                        cb();
                    });
                });
            },
            function(cb){//移除资源关系表(包含子资源)
                async.each(resourceIds,function(id,callback){
                   acl.removeResource(id,function(err,doc){
                        if(err) return callback(err);
                        callback();
                    });
                },function(err){
                    if(err) return cb(err);
                    cb();
                });
            },
            function(cb){//移除资源
                resource.remove({ _id: { $in: resourceIds }},cb);
            }
        ], function (err, results) {
            err ? cb(err) :  cb(null,{ret: "成功删除资源"});
        });
    };
    return router;
};