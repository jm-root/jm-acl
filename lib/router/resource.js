/**
 * Created by sahara on 2016/12/23.
 */
var jmcore = require('jm-ms-core');
var jm = require('jm-ms-daorouter');
var async=require('async');
var ms = jm.ms;

module.exports = function (service, opts) {
    var resource = service.resource;
    var router = ms();
    jmcore.enableEvent(resource);
    router.use(ms.daorouter(resource));
    resource.routes.before_remove = function(opts, cb){
        var id = opts.params.id || opts.data.id;
        var resourceIds = [id];
        async.waterfall([
            function(cb){
                resource.findOne({_id:id},function(err,doc){
                    if(err) return cb(err);
                    if(!doc) return cb({err:-1,msg:'组织不存在'});
                    resourceIds.push(doc.code);
                    resource.distinct('_id',{parent:doc._id},function(err,ary){
                        if(err) return cb(err);
                        resourceIds = resourceIds.concat(ary);
                        cb();
                    });
                });
            },
            function(cb){
                resource.remove({ _id: { $in: resourceIds }},cb);
            }
        ], function (err, results) {

            err ? cb(err) :  cb(null,{ret: "成功移除资源"});
        });
    };
    return router;
};