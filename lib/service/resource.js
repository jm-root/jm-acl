var jm = require('jm-dao');
module.exports = function (service, opts) {
    opts || (opts={});
    opts.modelName || (opts.modelName = 'resource');
    opts.schema || (opts.schema = require('../schema/resource')());
    var model = jm.dao(opts);
    jm.enableEvent(model);
    require('./common')(model);

    model.init = function(opts, cb){
        var self = this;
        self.create(
            {
                code: '/acl',
                title: 'acl',
                permissions: [
                    service.permission.idByCode('*'),
                    service.permission.idByCode('get'),
                    service.permission.idByCode('post'),
                    service.permission.idByCode('delete')
                ]
            },
            function(err, doc){
                var id = doc.id;
                self.create(
                    {
                        parent: id,
                        code: '/acl/orgs',
                        title: '组织',
                        permissions: [
                            service.permission.idByCode('*'),
                            service.permission.idByCode('get'),
                            service.permission.idByCode('post'),
                            service.permission.idByCode('delete')
                        ]
                    }
                );
                self.create(
                    {
                        parent: id,
                        code: '/acl/roles',
                        title: '角色',
                        permissions: [
                            service.permission.idByCode('*'),
                            service.permission.idByCode('get'),
                            service.permission.idByCode('post'),
                            service.permission.idByCode('delete')
                        ]
                    }
                );
                self.create(
                    {
                        parent: id,
                        code: '/acl/resources',
                        title: '资源',
                        permissions: [
                            service.permission.idByCode('*'),
                            service.permission.idByCode('get'),
                            service.permission.idByCode('post'),
                            service.permission.idByCode('delete')
                        ]
                    }
                );
                self.create(
                    {
                        parent: id,
                        code: '/acl/users',
                        title: '用户',
                        permissions: [
                            service.permission.idByCode('*'),
                            service.permission.idByCode('get'),
                            service.permission.idByCode('post'),
                            service.permission.idByCode('delete')
                        ]
                    }
                );
            }
        );

        self.emit('load');
    };

    return model;
};
