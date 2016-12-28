module.exports = [
    {code: '/acl/orgs', org: 'acl', title: '操作组织', permissions: ['get', 'post', 'delete']},
    {code: '/acl/orgs/:id', org: 'acl', title: '操作指定组织', permissions: ['get', 'post', 'delete']},
    {code: '/acl/orgs/tree', org: 'acl', title: '操作组织树', permissions: ['get']},
    {code: '/acl/orgs/:id/tree', org: 'acl', title: '操作指定组织树', permissions: ['get']},

    {code: '/acl/resources', org: 'acl', title: '操作资源', permissions: ['get', 'post', 'delete']},
    {code: '/acl/resources/:id', org: 'acl', title: '操作指定资源', permissions: ['get', 'post', 'delete']},

    {code: '/acl/roles', org: 'acl', title: '操作角色', permissions: ['get', 'post', 'delete']},
    {code: '/acl/roles/:id', org: 'acl', title: '更新角色信息', permissions: ['get', 'post', 'delete']},


    {code: '/acl/orgs/:id/users', org: 'acl', title: '操作组织下所有用户', permissions: ['get']},
    {code: '/acl/orgs/:id/roles', org: 'acl', title: '操作组织下所有角色', permissions: ['get', 'post', 'delete']},
    {code: '/acl/orgs/:id/resources', org: 'acl', title: '操作组织下所有资源', permissions: ['get', 'post', 'delete']},


    {code: '/acl/user/roles', org: 'acl', title: '获取用户角色', permissions: ['get']},
    {code: '/acl/user/permissions', org: 'acl', title: '获取用户权限', permissions: ['get'], 'perSignOnLimit': ['get']},

    {code: '/acl/roles/:role', org: 'acl', title: '删除角色', permissions: ['delete']},
    {code: '/acl/roles/:role/users', org: 'acl', title: '获取指定角色用户列表', permissions: ['get']},
    {code: '/acl/roles/:id/roles', org: 'acl', title: '操作用户角色', permissions: ['post', 'delete']},
    {code: '/acl/roles/:role/resources', org: 'acl', title: '操作角色资源', permissions: ['get', 'delete']},
    {code: '/acl/roles/:role/permissions', org: 'acl', title: '操作角色权限', permissions: ['post', 'delete']}
];

