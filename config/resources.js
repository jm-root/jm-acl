module.exports = [
    {
        code: 'global', title: '全局权限', permissions: ['put', 'delete', 'post', 'get']
    },
    {
        code: '/acl', title: '权限', permissions: ['get'],
        children: [
            {
                code: '/acl/orgs', title: '组织', permissions: ['put', 'delete', 'post', 'get'],
                children: [
                    {code: '/acl/orgs/tree', title: '组织树', permissions: ['get']},
                    {code: '/acl/orgs/:id', title: '指定组织', permissions: ['put', 'delete', 'post', 'get']},
                    {code: '/acl/orgs/:id/tree', title: '指定组织树', permissions: ['get']},

                    {code: '/acl/orgs/:id/users', title: '指定组织的系统用户', permissions: ['get']},
                    {code: '/acl/orgs/:id/roles', title: '指定组织的角色', permissions: ['put', 'delete', 'post', 'get']},
                    {code: '/acl/orgs/:id/resources', title: '指定组织的资源', permissions: ['put', 'delete', 'post', 'get']}
                ]
            },
            {
                code: '/acl/resources', title: '资源', permissions: ['put', 'delete', 'post', 'get'],
                children: [
                    {code: '/acl/resources/:id', title: '指定资源', permissions: ['put', 'delete', 'post', 'get']}
                ]
            },
            {
                code: '/acl/roles', title: '角色', permissions: ['put', 'delete', 'post', 'get'],
                children: [
                    {code: '/acl/roles/:id', title: '指定角色', permissions: ['put', 'delete', 'post', 'get']},
                    {code: '/acl/roles/:id/users', title: '指定角色的用户', permissions: ['get']},
                    {code: '/acl/roles/:id/resources', title: '指定角色的资源', permissions: ['get', 'delete']},
                    {code: '/acl/roles/:id/permissions', title: '指定角色的权限', permissions: ['post', 'delete']}
                ]
            },
            {
                code: '/acl/users', title: '系统用户', permissions: ['put', 'delete', 'post', 'get'],
                children: [
                    {code: '/acl/users/:id', title: '指定系统用户', permissions: ['put', 'delete', 'post', 'get']},
                    {code: '/acl/users/:id/roles', title: '指定用户的角色', permissions: ['get']},
                    {code: '/acl/users/:id/permissions', title: '指定用户的权限', permissions: ['get']}
                ]
            }
        ]
    }
];

