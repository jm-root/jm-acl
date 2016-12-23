var resourceSchema = require('../schema/resource')();
var permissionSchema = require('../schema/permission')();
var orgSchema = require('../schema/org')();
var contract = require('./contract');
var jm = require('jm-common');
var _ = require('lodash');
var async = require('async');
var utils = require('./utils');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var  nodeacl=require('acl');
contract.debug = true;

module.exports = function (opts) {
    opts = opts || {};
    var superRole = opts.superRole;
/*    var resource = jm.dao({db:opts.db,modelName:'resource',schema:resourceSchema});
    var org = jm.dao({db:opts.db,modelName:'org',schema:orgSchema});
    var permission = jm.dao({db:opts.db,modelName:'roleper',schema:permissionSchema});*/
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

    var o = {
        addUserRoles: function(userId, roles, cb) {
            var self = this;
            console.log("asd ");
            acl.addUserRoles(userId, roles);
        }
    };

    return o;
};

/*
/!**
 * 给用户添加角色
 * @param userId
 * @param roles
 * @param cb
 *
 *!/
prototype.addUserRoles = function(userId, roles, cb){
  /!*  contract(arguments)
        .params('string|number','string|array','function')
        .params('string|number','string|array')
        .end();

    cb = cb || function(){};
    roles = makeArray(roles);

    var self = this;
    if(!roles.length){
        return cb();
    }
    async.each(roles,function(role, callback){
        self.role.count({code:role},function(err,count){
            if(err){ return callback(err); }
            if(count) return callback();
            self.role.create({code:role}, callback);
        });
    },function(err){
        if(err){ return cb(err); }
        self.userrole.count({uid:userId},function(err,count){
            if(err){ return cb(err); }
            if(count){
                self.userrole.update({uid:userId},{$addToSet:{roles:{$each:roles}}},cb);
            }else{
                self.userrole.create({uid:userId,roles:roles},cb);
            }
        });

    });*!/
    var self = this;
    console.log("asd ");
    self.acl.addUserRoles(userId, roles);
};
/!**
 * 获取用户拥有的角色
 * @param userId
 * @param cb
 *!/
prototype.userRoles = function(userId, cb){
    var self = this;
    console.log("a");
    self.acl.userRoles(userId,cb);
    /!* self.userrole.findOne({uid:userId},{roles:1,_id:0},function(err,doc){
     if(err){
     cb(err);
     }else{
     doc ? cb(null,doc.roles) : cb(null,[]);
     }
     });*!/
};
/!**
 * 从用户上移除角色
 * @param userId
 * @param roles
 * @param cb
 *!/
prototype.removeUserRoles = function(userId, roles, cb){
 /!*   contract(arguments)
        .params('string|number','string|array','function')
        .params('string|number','string|array')
        .end();

    cb = cb || function(){};
    roles = makeArray(roles);

    var self = this;
    self.userrole.update({uid:userId},{$pullAll:{roles:roles}},cb);*!/
    var self = this;
    self.acl.addUserRoles(userId, roles, cb);
};

/!**
 * 移除用户
 * @param userId
 * @param cb
 *!/
prototype.removeUser = function(userId, cb){
    contract(arguments)
        .params('string|number', 'function')
        .params('string|number')
        .end();

    cb = cb || function(){};
    var self = this;
    self.acl.buckets.users.remove({uid:userId},cb);
};


/!**
 * 获取角色下有哪些用户
 * @param roleName
 * @param cb
 *!/
prototype.roleUsers = function(roleName, cb){
    var self = this;
    self.userrole.distinct('uid',{roles:roleName}, cb);
};

/!**
 * 该用户是否具有指定角色
 * @param userId
 * @param rolename
 * @param cb
 *!/
prototype.hasRole = function(userId, rolename, cb){
    var self = this;
    self.userRoles(userId,function(err,roles){
        if(err){
            cb(err);
        }else{
            cb(null,roles.indexOf(rolename) != -1);
        }
    });
};

/!**
 * 添加角色
 * @param roles
 * @param cb
 *!/
prototype.addRoles = function(roles, cb){
    contract(arguments)
        .params('object|array','function')
        .end();

    cb = cb || function(){};
    roles = makeArray(roles);

    var self = this;
    var len = roles.length;
    if(!len){
        return cb();
    }
    var ary = [];
    async.eachSeries(roles,function(role,callback){
        if(!_.isPlainObject(role)) return callback(new Error("addRoles#role is not object"));
        if(!role.code) return callback(new Error('addRoles#role.code undefined'));
        if(role._id) delete role._id;
        if(role.orgs) role.orgs = makeArray(role.orgs);
        if(role.status==undefined) role.status = 1;
        role.crtime = new Date();
        self.role.update({code:role.code},role,{upsert:true},function(err,doc){
            if(err) return callback(err);
            if(doc)ary.push(doc);
            callback();
        });
    },function(err){
        if(err){ return cb(err); }
        cb(null, ary);
    });
};

/!**
 * 从系统移除角色
 * @param role
 * @param cb
 *!/
prototype.removeRole = function(role, cb){
    contract(arguments)
        .params('string','function')
        .params('string').end();

    cb = cb || function(){};
    var self = this;
    async.parallel([
        function(cb){
            self.userrole.update({roles:role},{$pull:{roles:role}},{multi:true},cb);
        },
        function(cb){
            self.role.remove({code:role},cb);
        },
        function(cb){
            self.roleper.remove({role:role},cb);
        }
    ], function (err, results) {
        err ? cb(err) : cb(null,1);
    });
};

/!**
 * 从系统移除资源
 * @param resource
 * @param cb
 *!/
prototype.removeResource = function(resource, cb){
    contract(arguments)
        .params('string', 'function')
        .params('string')
        .end();

    cb = cb || function(){};
    var self = this;
    //parallel并行无关联
    // series串行无关联 发生错误直接跳回最后
    async.parallel([
        function(cb){
            self.roleper.remove({resource:resource},cb);
        },
        function(cb){
            self.resource.remove({code:resource},cb);
        }
    ], function (err, results) {
        err ? cb(err) : cb(null,1);
    });
};

/!**
 * 允许哪些角色对哪些资源拥有哪些控制权
 * @param roles
 * @param resources
 * @param permissions
 * @param cb
 *!/
prototype.allow = function(roles, resources, permissions, cb){
    contract(arguments)
        .params('string|array','string|array','string|array','function')
        .params('string|array','string|array','string|array')
        .end();

    cb = cb || function(){};
    roles = makeArray(roles);
    resources = makeArray(resources);
    permissions = makeArray(permissions);

    var self = this;
    async.parallel([
        function(cb){
            async.each(resources,function(resource,callback){
                self.resource.count({code:resource},function(err,count){
                    if(err) return callback(err);
                    if(count){
                        self.resource.update({code:resource},{$addToSet:{permissions:{$each:permissions}}},callback);
                    }else{
                        self.resource.create({code:resource,permissions:permissions},callback);
                    }
                });
            },function(err){
                if(err) return cb(err);
                cb();
            });
        },
        function(cb){
            async.eachSeries(roles,function(role,callback){
                self.addRoles({code:role},function(err){
                    if(err) return callback(err);
                    async.eachSeries(resources,function(resource,callback){
                        self.roleper.update({role:role,resource:resource},{$addToSet:{permissions:{$each:permissions}}},{upsert:true},callback);
                    },function(err){
                        callback(err);
                    });
                });
            },function(err){
                if(err) return cb(err);
                cb();
            });
        }
    ], function (err, results) {
        err ? cb(err) : cb(null,1);
    });
};

/!**
 * 移除角色对资源的控制权
 * @param role
 * @param resources
 * @param permissions
 * @param cb
 *!/
prototype.removeAllow = function(role, resources, permissions, cb){
    contract(arguments)
        .params('string','string|array','string|array','function')
        .params('string','string|array','string|array')
        .params('string','string|array','function')
        .params('string','string|array')
        .end();

    resources = makeArray(resources);
    if(cb || !_.isFunction(permissions)){
        permissions = makeArray(permissions);
    }else {
        cb = permissions;
        permissions = null;
    }
    this.removePermissions(role,resources,permissions,cb);
};

prototype.removePermissions = function(role, resources, permissions, cb){
    cb = cb || function(){};
    var self = this;
    async.each(resources,function(resource,callback){
        if(permissions){
            self.roleper.update({role:role,resource:resource},{$pullAll:{permissions:permissions}},callback);
        }else{
            self.roleper.remove({role:role,resource:resource},callback);
        }
    },function(err){
        if(err) return cb(err);
        cb(null,1);
    });
};

/!**
 * 用户资源下有哪些权限
 * @param userId
 * @param resources
 * @param cb
 *!/
prototype.allowedPermissions = function(userId, resources, cb){
    //匹配
    contract(arguments)
        .params('string|number', 'string|array', 'function')
        .params('string|number', 'string|array')
        .end();

    cb = cb || function(){};
    var self = this;
    resources = makeArray(resources);
    // waterfall 有关连 串行
    async.waterfall([
        function(cb){
            self.acl.findOne({uid:userId},function(err,doc){
                if(err) return cb(err);
                doc = doc || {};
                cb(null,{roles:doc.roles||[]});
            });
        },
        function(obj,cb){
            self.roleper.find({role:{$in:obj.roles},resource:{$in:resources}},function(err,docs){
                if(err) return cb(err);
                var result = {};
                docs.forEach(function(doc){
                    var val = result[doc.resource];
                    if(val){
                        result[doc.resource]=_.union(val,doc.permissions);
                    }else{
                        result[doc.resource] = doc.permissions||[];
                    }
                });
                cb(null,result);
            });
        }
    ],function(err,result){
        cb(err,result);
    });
};

/!**
 * 用户有没该资源的使用权
 * @param userId
 * @param resource
 * @param permissions
 * @param cb
 *!/
prototype.isAllowed = function(userId, resource, permissions, cb){
    contract(arguments)
        .params('string|number', 'string', 'string|array', 'function')
        .params('string|number', 'string', 'string|array')
        .end();

    cb = cb || function(){};
    permissions = makeArray(permissions);
    var self = this;
    self.allowedPermissions(userId,resource,function(err,result){
        var pers = result[resource];
        if(!pers||!pers.length){
            return cb(null,false);
        }
        var allowed = true;

        if(pers.indexOf('*')==-1){
            var p = _.intersection(permissions, pers);
            if(!p.length || p.length!=permissions.length){
                allowed = false;
            }
        }
        cb(null,allowed);
    });
};

/!**
 * 查询角色下有哪些资源权限
 * 或查询角色下存在指定权限的有哪些资源
 * @param roles
 * @param permissions
 * @param cb
 *!/
prototype.whatResources = function(roles, permissions, cb){
    contract(arguments)
        .params('string|array')
        .params('string|array','string|array')
        .params('string|array','function')
        .params('string|array','string|array','function')
        .end();

    cb = cb || function(){};
    roles = makeArray(roles);
    if(!_.isFunction(permissions)){
        permissions = makeArray(permissions);
    }else {
        cb = permissions;
        permissions = null;
    }
    var self = this;
    var conditions = {role:{$in:roles}};
    if(permissions){
        conditions.permissions = {$in:permissions};
    }
    self.roleper.find(conditions,function(err,docs){
        if(err) return cb(err);
        var result = {};
        docs.forEach(function(doc){
            var val = result[doc.resource];
            if(val){
                result[doc.resource]=_.union(val,doc.permissions);
            }else{
                result[doc.resource] = doc.permissions||[];
            }
        });
        cb(null,result);
    });
};

/!**
 * 查询所有角色或查询组织下的角色
 * @param orgs
 * @param cb
 *!/
prototype.whatRoles = function(orgs, cb){
    contract(arguments)
        .params('undefined|string|array','function')
        .params('function')
        .end();
    cb = cb || function(){};
    var self = this;
    var conditions = {};
    if(orgs){
        if(orgs==='none'){
            conditions.$or = [{orgs:{$exists:false}},{orgs:{$size:0}}];
        }else{
            orgs = makeArray(orgs);
            conditions.orgs = {$in:orgs};
        }
    }
    self.role.find(conditions,cb);
};

prototype.initResources = function(resources, cb){
    contract(arguments)
        .params('object|array','function')
        .params('object|array')
        .end();

    cb = cb || function(){};
    var self = this;
    resources = makeArray(resources);
    async.each(resources,function(resource,callback){
        if(!_.isPlainObject(resource)) return callback(new Error("initResources#resource is not object"));
        if(!resource.code) return callback(new Error('initResources#resource.code undefined'));
        if(resource._id) delete resource._id;
        if(resource.orgs) resource.orgs = makeArray(resource.orgs);
        if(resource.permissions) resource.permissions = makeArray(resource.permissions);
        if(resource.perNoLimit) resource.perNoLimit = makeArray(resource.perNoLimit);
        if(resource.perSignOnLimit) resource.perSignOnLimit = makeArray(resource.perSignOnLimit);
        if(!resource.perNoLimit) resource.perNoLimit = [];
        if(!resource.perSignOnLimit) resource.perSignOnLimit = [];
        if(resource.status==undefined) resource.status = 1;
        resource.crtime = new Date();
        self.resource.update({code:resource.code},resource,{upsert:true},callback);
        if(self.superRole){
            self.removeAllow(self.superRole, resource.code,function(){
                self.allow(self.superRole, resource.code, ['*']);
            });
        }
    },function(err){
        if(err){ return cb(err); }
        cb(null, 1);
    });
};

function makeArray(arr){
    return Array.isArray(arr) ? arr : [arr];
}

function createTreeData(dao, data, attrs, cb) {
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

/!**
 * 初始化组织结构
 * @param data
 * @param cb
 *!/
prototype.initOrg = function(data, cb){
    var self = this;
    createTreeData(self.org,data,['code','title','description','sort'],cb);
};

/!**
 * 移除组织(如有子组织也一并移除)
 * @param org code或ObjectId
 * @param cb
 *!/
prototype.removeOrg = function(org, cb){
    contract(arguments)
        .params('string','function')
        .params('string').end();

    cb = cb || function(){};
    var self = this;
    var orgCodes = [];
    var conditions = {code:org};
    if(ObjectId.isValid(org)) conditions = {_id:org};

    async.waterfall([
        function(cb){
            self.org.findOne(conditions,function(err,doc){
                if(err) return cb(err);
                if(!doc) return cb({err:-1,msg:'组织不存在'});
                orgCodes.push(doc.code);
                self.org.distinct('code',{pid:doc._id},function(err,ary){
                    if(err) return cb(err);
                    orgCodes = orgCodes.concat(ary);
                    cb();
                });
            });
        },
        function(cb){
            self.role.update({orgs:{$in:orgCodes}},{$pullAll:{orgs:orgCodes}},{multi:true},function(err,doc){
                cb(err);
            });
        },
        function(cb){
            self.resource.update({orgs:{$in:orgCodes}},{$pullAll:{orgs:orgCodes}},{multi:true},function(err,doc){
                cb(err);
            });
        },
        function(cb){
            self.org.remove({code:{$in:orgCodes}},function(err,doc){
                cb(err);
            });
        }
    ], function (err, results) {
        err ? cb(err) : cb(null,1);
    });
};

/!**
 * 添加组织
 * @param org
 * @param cb
 *!/
prototype.addOrg = function(org, cb){
    //核对参数类型
    contract(arguments)
        //预设的参数类型
        .params('object','function')
        .end();

    cb = cb || function(){};
    if(!_.isPlainObject(org)) return cb(new Error("addOrg#org is not object"));
    if(org._id) delete org._id;
    if(!org.code) return cb(new Error('addOrg#org.code undefined'));

    var self = this;
    self.org.findOne({code:org.code},function(err,doc){
        if(err) return cb(err);
        if(doc){
            self.org.findOneAndUpdate({code:org.code},org,function(err,doc){
                if(err) return cb(err);
                cb(null,doc);
            });
        }else{
            self.org.create(org,cb);
        }
    });
};

/!**
 * 给资源附加组织
 * @param org
 * @param resources
 * @param cb
 *!/
prototype.addOrgToResources = function(org, resources, cb){
    contract(arguments)
        .params('string', 'string|array', 'function')
        .params('string', 'string|array')
        .end();

    cb = cb || function(){};
    org = makeArray(org);
    resources = makeArray(resources);
    var self = this;
    async.each(resources,function(resource,callback){
        self.resource.count({code:resource},function(err,count){
            if(err) return callback(err);
            if(count){
                self.resource.update({code:resource},{$addToSet:{orgs:{$each:org}}},callback);
            }else{
                self.resource.create({code:resource,orgs:org},callback);
            }
        });

    },function(err){
        if(err) return cb(err);
        cb();
    });
};

/!**
 * 给角色附加组织
 * @param org
 * @param roles
 * @param cb
 *!/
prototype.addOrgToRoles= function(org, roles, cb){
    contract(arguments)
        .params('string', 'string|array', 'function')
        .params('string', 'string|array')
        .end();

    cb = cb || function(){};
    org = makeArray(org);
    roles = makeArray(roles);
    var self = this;
    async.each(roles,function(role,callback){
        self.role.count({code:role},function(err,count){
            if(err) return callback(err);
            if(count){
                self.role.update({code:role},{$addToSet:{orgs:{$each:org}}},callback);
            }else{
                self.role.create({code:role,orgs:org},callback);
            }
        });

    },function(err){
        if(err) return cb(err);
        cb();
    });
};
/!**
 * 移除资源关联的组织
 * @param org
 * @param resources
 * @param cb
 *!/
prototype.removeOrgFromResources = function(org, resources, cb){
    contract(arguments)
        .params('string', 'string|array', 'function')
        .params('string', 'string|array')
        .end();

    cb = cb || function(){};
    org = makeArray(org);
    resources = makeArray(resources);
    var self = this;
    self.resource.update({code:{$in:resources}},{$pull:{orgs:org}},{multi:true},cb);
};
/!**
 * 移除角色关联的组织
 * @param org
 * @param roles
 * @param cb
 *!/
prototype.removeOrgFromRoles= function(org, roles, cb){
    contract(arguments)
        .params('string', 'string|array', 'function')
        .params('string', 'string|array')
        .end();

    cb = cb || function(){};
    org = makeArray(org);
    roles = makeArray(roles);
    var self = this;
    self.role.update({code:{$in:roles}},{$pull:{orgs:{$each:org}}},{multi:true},cb);
};
//获取所属的所有子结构
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

/!**
 * 获取组织/资源/角色结构树
 * @param opts
 * @param cb
 *!/
prototype.findOrgTree = function(opts, cb){
    var conditions = opts.conditions || {};
    var fields = opts.fields || {};
    var options = opts.options || {};
    var search = opts.search || {};
    var format = opts.format || function(){};

    var self = this;
    self.org.findOne(conditions, fields, options, function (err, doc) {
        if (err) return cb(err);
        if(!doc) return cb();
        var docjson = doc.toJSON();
        format(docjson);
        _findChild(self.org, docjson, search, fields, options, format, function (err, ary) {
            if (err) {
                return cb(err);
            }
            docjson.children = ary;
            cb(null, docjson);
        });
    });
};
*/
