var jm = require('jm-common');
var _ = require('lodash');
var async = require('async');
var utils = require('./utils');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var  nodeacl=require('acl');

module.exports = function (opts) {
    opts = opts || {};
    var acl = new nodeacl(new nodeacl.mongodbBackend(opts.db,this.prefix),null, {
        buckets: {
            meta: 'Meta',
            parents: 'Parents',
            permissions: 'Permissions',
            resources: 'Resources',
            roles: 'Roles',
            users: 'Users'
        }
     });
    var _findChild = function (dao, parent, conditions, fields, options,format, cb) {
        parent.children = [];
        conditions.pid = parent._id;
        dao.find(conditions, fields, options, function (err, docs) {
            if (err) return cb(err);

            var len = docs.length;
            if (!len) return cb(null, []);

            async.eachSeries(docs,function(doc,callback){
                var docjson = doc.toJSON();
                format(docjson);
                parent.children.push(docjson);
                _findChild(dao, docjson, conditions, fields, options, format, function (err, ary) {
                    if (err) return callback(err);
                    docjson.children = ary;
                    callback();
                });
            },function(err){
                if (err) return cb(err);
                cb(null, parent.children);
            });
        });
    };
    var o = {
        findTree: function(opts,parameter, cb) {//获取结构树
            var conditions = opts.conditions || {};
            var fields = opts.fields || {};
            var options = opts.options || {};
            var search = opts.search || {};
            var format = opts.format || function(){};

            parameter.findOne(conditions, fields, options, function (err, doc) {
                if (err) return cb(err);
                if(!doc) return cb();
                var docjson = doc.toJSON();
                format(docjson);
                _findChild(parameter, docjson, search, fields, options, format, function (err, ary) {
                    if (err) {
                        return cb(err);
                    }
                    docjson.children = ary;
                    cb(null, docjson);
                });
            });
        }
    };

    return o;
};

