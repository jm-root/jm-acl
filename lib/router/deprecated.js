//兼容旧版本，以后会删掉
var jm = require('jm-ms-core');
var async=require('async');
var ms = jm.ms;
module.exports = function (service, opts) {
    var router = ms();
    router.add('/user/roles', 'get', function(opts, cb){
        cb(null, {roles:['superadmin']});
    });
    var findOrgsroles=function (opts,cb) {
        var id=opts.params.id;
        async.waterfall([
            function (cb) {
                var orgs=[id];
                service.org.find({parent:id},function (err,docs) {
                    if(err){
                        logger.log(err);
                        return cb(err);
                    }
                    docs.forEach(function (item) {
                        if(orgs.indexOf(item._id)<0){

                            orgs.push(item._id)
                        }
                    });
                    cb(null,orgs);
                });
            },
            function (orgs,cb) {
            var roles=[];
                async.each(orgs,function (org, callback) {
                    service.role.find({org:org},function (err,docs) {
                        if(err){
                            logger.log(err);
                            return cb(err);
                        }
                        docs.forEach(function (item) {
                            if(roles.indexOf(item)<0){
                                roles.push(item)
                            }
                        });
                        callback();
                    });
                },function (err,doc) {
                    if(err){
                        logger.log(err);
                        return cb(err);
                    }
                    cb(null,roles)
                });
            }
        ],function (err, doc) {
            if(err){
                logger.log(err);
                return cb(err);
            }
            cb(null,doc)
        });
    };
    router.add('/orgs/:id/roles','get',findOrgsroles);
    // router.add('/:id/role','post',_setUserRoles);
    // router.add('/:id/role','delete',_delUserRoles);
    // router.add('/:id/resource','get',_userResourcesPermission);
    // router.add('/:id/orgs','get',_userOrg);
    return router;
};