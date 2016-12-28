module.exports = [
    {
        code: 'superadmin',
        title: '超级管理员',
        description: '超级管理员'
    },
    {
        code: 'guest',
        title: '访客',
        description: '访客',
        allows: [
            {resource: '/config', permissions: ['get']},
            {resource: '/acl', permissions: ['get']},
            {resource: '/sso', permissions: ['get']}
        ]
    },
    {
        code: 'user',
        title: '用户',
        description: '已登陆用户',
        parents: ['guest']
    },
    {
        code: 'admin',
        title: '系统管理员',
        description: '系统管理员',
        parents: ['user']
    },
    {
        code: 'cp',
        title: '货币发行商',
        description: '货币发行商, 可以发行货币',
        parents: ['user']
    },
    {
        code: 'merchant',
        title: '商户',
        description: '商户',
        parents: ['user']
    },
    {
        code: 'agent',
        title: '一级代理商',
        description: '一级代理商',
        parents: ['user']
    },
    {
        code: 'agent2',
        title: '二级代理商',
        description: '二级代理商',
        parents: ['user']
    }
];
