module.exports = [
    {
        code: '/acl', org: 'acl', title: '权限', permissions: ['get'],
        children: [
            {
                code: '/acl/orgs', org: 'acl', title: '组织', permissions: ['get', 'post', 'delete'],
                children: [
                    {code: '/acl/orgs/tree', org: 'acl', title: '组织树', permissions: ['get']},
                    {code: '/acl/orgs/:id', org: 'acl', title: '指定组织', permissions: ['get', 'post', 'delete']},
                    {code: '/acl/orgs/:id/tree', org: 'acl', title: '指定组织树', permissions: ['get']},

                    {code: '/acl/orgs/:id/users', org: 'acl', title: '指定组织的系统用户', permissions: ['get']},
                    {code: '/acl/orgs/:id/roles', org: 'acl', title: '指定组织的角色', permissions: ['get', 'post', 'delete']},
                    {code: '/acl/orgs/:id/resources', org: 'acl', title: '指定组织的资源', permissions: ['get', 'post', 'delete']}

                ]
            },
            {
                code: '/acl/resources', org: 'acl', title: '资源', permissions: ['get', 'post', 'delete'],
                children: [
                    {code: '/acl/resources/:id', org: 'acl', title: '指定资源', permissions: ['get', 'post', 'delete']}
                ]
            },
            {
                code: '/acl/roles', org: 'acl', title: '角色', permissions: ['get', 'post', 'delete'],
                children: [
                    {code: '/acl/roles/:id', org: 'acl', title: '指定角色', permissions: ['get', 'post', 'delete']},
                    {code: '/acl/roles/:id/users', org: 'acl', title: '指定角色的用户', permissions: ['get']},
                    {code: '/acl/roles/:id/resources', org: 'acl', title: '指定角色的资源', permissions: ['get', 'delete']},
                    {code: '/acl/roles/:id/permissions', org: 'acl', title: '指定角色的权限', permissions: ['post', 'delete']}
                ]
            },
            {
                code: '/acl/users', org: 'acl', title: '系统用户', permissions: ['get', 'post', 'delete'],
                children: [
                    {code: '/acl/users/:id', org: 'acl', title: '指定系统用户', permissions: ['get', 'post', 'delete']},
                    {code: '/acl/users/:id/roles', org: 'acl', title: '指定用户的角色', permissions: ['get']},
                    {code: '/acl/users/:id/permissions', org: 'acl', title: '指定用户的权限', permissions: ['get']}
                ]
            }
        ]
    },
    {
        code: '/config', org: 'config', title: '配置', permissions: ['get'],
        children: []
    }
];

