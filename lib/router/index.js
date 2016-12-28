var async = require('async');
var _ = require('lodash');
var path = require('path');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var jm = require('jm-ms-core');
var ms = jm.ms;
var consts = require('../../consts');
var logger = jm.getLogger('jm-acl:router');

/**
 * @apiDefine Error
 *
 * @apiSuccess (Error 200) {Number} err 错误代码
 * @apiSuccess (Error 200) {String} msg 错误信息
 *
 * @apiSuccessExample {json} 错误:
 * {
 *   err: 错误代码
 *   msg: 错误信息
 * }
 */

module.exports = function (service, opts) {
    var router = ms();
    router.use(function(opts, cb, next){
        logger.debug(opts);
        next();
    });
    service.routes || ( service.routes = {} );
    var routes = service.routes;
    var org = service.org;
    var role = service.role;
    router.use('/orgs',require('./org')(service));
    router.use('/roles',require('./role')(service));
    router.use('/users',require('./user')(service));
    router.use('/resources',require('./resource')(service));
    router.use('/permissions',require('./permission')(service));

    var package = require('../../package.json');
    routes.help = function(opts, cb){
        cb(null, {
            name: package.name,
            version: package.version
        });
    };

    var _help = function(opts, cb, next){routes.help(opts, cb, next);};
    router.add( '/','get',_help );
    router.use( '/init', require('./init')(service) );
    router.use( require('./deprecated')(service) );
    return router;
};