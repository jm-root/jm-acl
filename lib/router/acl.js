var jm = require('jm-ms-core');
var async=require('async');
var ms = jm.ms;
var logger = jm.getLogger('acl');

module.exports = function (service, opts) {
    var router = ms();

    router.use(function(opts, cb, next){
        opts || (opts = {});
        opts.data || (opts.data = {});
        var data = opts.data;
        if(data.acl_user){
            data.user || (data.user = data.acl_user);
        }
        next();
    });

    router.add('/isAllowed', 'get', function(opts, cb){
        var data = opts.data || {};
        service.isAllowed(data.user, data.resource, data.permissions, function(err, doc){
            if(!err && doc) {
                doc = {ret: 1};
            } else {
                if(!err) doc = {ret: 0};
            }
            cb(err, doc);
        });
    });

    router.add('/reload', 'get', function(opts, cb){
        cb(null, {ret:1});
        if(opts.data.name){
            service.reloadByName(opts.data.name);
        }else{
            service.reload();
        }

    });

    router.add('/userRoles', 'put', function(opts, cb){
        if(!opts.data.user) return cb(null, {ret:0});
        service.addUserRoles(opts.data.user, opts.data.roles || opts.data.role, function(err, doc){
            doc = {ret:0};
            if(!err) doc = {ret: 1};
            cb(err, doc);
        });
    });

    router.add('/userRoles', 'delete', function(opts, cb){
        if(!opts.data.user) return cb(null, {ret:0});
        service.removeUserRoles(opts.data.user, opts.data.roles || opts.data.role, function(err, doc){
            doc = {ret:0};
            if(!err) doc = {ret: 1};
            cb(err, doc);
        });
    });

    router.add('/userRoles', 'get', function(opts, cb){
        service.userRoles(opts.data.user, function(err, doc){
            if(!err && doc){
                doc = {rows: doc};
            }
            cb(err, doc || {});
        })
    });

    router.add('/userResources', 'get', function(opts, cb){
        service.userResources(opts.data.user, opts.data.resource, function(err, doc){
            cb(err, doc || {});
        })
    });

    /**
     * @api {get} /roleResources 获取角色下的资源
     * @apiVersion 0.0.1
     * @apiGroup Acl
     * @apiUse Error
     *
     * @apiParam {String} roles 角色(可选,可数组)
     * @apiParam {String} permissions 权限(可选,可数组)
     *
     * @apiParamExample {json} 请求参数例子:
     * {
     * }
     *
     * @apiSuccessExample {json} 成功:
     * 方式一:
     * {
     *  '资源':['权限']
     * }
     * 方式二:
     * {
     *  rows:['具有指定权限的资源']
     * }
     */
    router.add('/roleResources', 'get', function(opts, cb){
        var roles = opts.data.roles || '';
        roles = Array.isArray(roles) ? roles : roles.toString().split(',');
        var permissions=opts.data.permissions;
        if(permissions)
            permissions = Array.isArray(permissions) ? permissions : permissions.toString().split(',');

        service.whatResources(roles, permissions, function (err, doc) {
            if (err) {
                logger.error(err);
                return cb(err, null);
            }
            var ret = Array.isArray(doc)? {rows:doc} : doc;
            cb(null, ret)
        });
    });

    return router;
};
