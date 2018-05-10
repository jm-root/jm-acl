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
      {resource: '/acl', permissions: ['get']},
      {resource: '/acl/isAllowed', permissions: ['get']},
      {resource: '/passport', permissions: ['get', 'post']},
      {resource: '/sso', permissions: ['get']},
      {resource: '/user', permissions: ['get']},
      {resource: '/oms', permissions: ['get']},
      {resource: '/bank', permissions: ['get']},
      {resource: '/shop', permissions: ['get']},
      {resource: '/tb', permissions: ['get']},
      {resource: '/cny', permissions: ['get']},
      {resource: '/agent', permissions: ['get']},
      {resource: '/wechat', permissions: ['get']},
      {resource: '/pay', permissions: ['get']},
      {resource: '/pay/prepay', permissions: ['post']}
    ]
  },
  {
    code: 'user',
    title: '用户',
    description: '已登陆用户',
    parents: ['guest'],
    allows: [
      {resource: '/user/users/:id', permissions: ['put', 'post', 'delete']},
      {resource: '/oms/nav', permissions: ['get']}
    ]
  },
  {
    code: 'admin',
    title: '系统管理员',
    description: '系统管理员',
    parents: ['user']
  }
]
