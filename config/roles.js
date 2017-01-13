module.exports = [
    {
        code: 'root',
        title: '超级管理员',
        description: '超级管理员'
    },
    {
        code: 'guest',
        title: '访客',
        description: '访客',
        allows: [
            {resource: '/acl', permissions: ['get']}
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
    }
];
