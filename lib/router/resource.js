/**
 * Created by sahara on 2016/12/23.
 */
var jmcore = require('jm-ms-core');
var jm = require('jm-ms-daorouter');
var async=require('async');
var ms = jm.ms;

module.exports = function (service, opts) {
    var resource = service.resource;
    var acl = service.acl;
    var router = ms();
    //获取资源组织结构图
    var findResourcetree=function (opts,cb) {
        opts.conditions={
            _id:opts.params.id
        };
        acl.findTree(opts,resource,cb);
    };
    jmcore.enableEvent(resource);
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
                    resourceIds.push(doc.code);
                    resource.distinct('_id',{parent:doc._id},function(err,ary){
                        if(err) return cb(err);
                        resourceIds = resourceIds.concat(ary);
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