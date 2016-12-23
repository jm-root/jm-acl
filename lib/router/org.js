/**
 * Created by sahara on 2016/12/23.
 */
var jmcore = require('jm-ms-core');
var jm = require('jm-ms-daorouter');
var async=require('async');
var ms = jm.ms;

module.exports = function (service, opts) {
    var org = service.org;
    var role = service.role;
    var router = ms();
    jmcore.enableEvent(org);
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
            err ? cb(err) :  cb(null, {ret: "成功移除组织"});
        });
    };
    return router;
};