var jm = require('jm-core');
var ERR = require('../../consts').ERR;
var Acl = require('acl');

module.exports =  function(opts){
    opts || (opts={});
    var db = opts.db;
    var o = {};
    jm.enableEvent(o);

    o.acl = new Acl(new Acl.mongodbBackend(opts.db.db, 'acl_'));
    o.org = require('./org')(o, {db: db});
    o.role = require('./role')(o, {db: db});
    o.resource = require('./resource')(o, {db: db});
    o.user = require('./user')(o, {db: db});
    o.permission = require('./permission')(o, {db: db});
    o.utils = require('./utils');
    o.filter = require('./filter')(o);

    //读取树形结构
    o.createTreeData=function(dao, data, attrs, cb) {
        cb = cb || function(){};
        function createData(data, pid, attrs, cb) {
            var obj = {};
            for(var i in attrs){
                var name = attrs[i];
                if(data[name]!=undefined||data[name]!=null){
                    obj[name] = data[name];
                }
            }
            if (pid) {
                obj.pid = pid;
            }
            if(!obj.code) return cb();

            async.waterfall([
                function(cb){
                    dao.findOneAndUpdate({code:obj.code},obj,cb);
                },
                function(doc,cb){
                    if(doc) return cb(null,doc);
                    dao.create(obj,cb);
                }
            ],function(err,doc){
                if(err) return cb();
                if(!doc) return cb();
                if (data.children && data.children.length) {
                    async.each(data.children, function (child, callback) {
                        createData(child, doc._id, attrs, function () {
                            callback();
                        });
                    }, function (err) {
                        cb();
                    });
                } else {
                    cb();
                }
            });
        }

        async.each(data, function (item, callback) {
            createData(item, null, attrs, function () {
                callback();
            });
        }, function (err) {
            cb();
        });
    }
    return o;
};

