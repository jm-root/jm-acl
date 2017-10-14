module.exports = [
  {
    code: 'global', title: '全局权限', permissions: ['put', 'delete', 'post', 'get'],
    children: [
      {code: 'global/search', title: '搜索', permissions: ['get']}
    ]
  },
  {
    code: '/acl', title: '权限', permissions: ['get'],
    children: [
      {
        code: '/acl/resources', title: '资源', permissions: ['put', 'delete', 'post', 'get'],
        children: [
          {code: '/acl/resources/:id', title: '指定资源', permissions: ['put', 'delete', 'post', 'get']}
        ]
      },
      {
        code: '/acl/roles', title: '角色', permissions: ['put', 'delete', 'post', 'get'],
        children: [
          {
            code: '/acl/roles/:id', title: '指定角色', permissions: ['put', 'delete', 'post', 'get'],
            children: [
              {code: '/acl/roles/:id/users', title: '指定角色的用户', permissions: ['get']},
              {code: '/acl/roles/:id/resources', title: '指定角色的资源', permissions: ['get', 'delete']},
              {code: '/acl/roles/:id/permissions', title: '指定角色的权限', permissions: ['post', 'delete']}
            ]
          },
        ]
      },
      {
        code: '/acl/users', title: '系统用户', permissions: ['put', 'delete', 'post', 'get'],
        children: [
          {
            code: '/acl/users/:id', title: '指定系统用户', permissions: ['put', 'delete', 'post', 'get'],
            children: [
              {code: '/acl/users/:id/roles', title: '指定用户的角色', permissions: ['get']},
              {code: '/acl/users/:id/permissions', title: '指定用户的权限', permissions: ['get']}
            ]
          }
        ]
      }
    ]
  },
  {
    code: '/passport', title: 'Passport', permissions: ['get'],
    children: [
      {
        code: '/passport/register', title: '注册', permissions: ['post'],
      },
      {
        code: '/passport/login', title: '登陆', permissions: ['post'],
      },
    ]
  },
  {
    code: '/sso', title: 'SSO', permissions: ['get'],
    children: [
      {
        code: '/sso/user', title: '用户信息', permissions: ['get'],
      },
    ]
  },
  {
    code: '/users', title: '用户', permissions: ['put', 'delete', 'post', 'get'],
    children: [
      {
        code: '/users/:id', title: '指定用户', permissions: ['put', 'delete', 'post', 'get']
      },
    ]
  },
  {
    code: '/mlm', title: 'MLM', permissions: ['get'],
    children: [
      {
        code: '/mlm/teams', title: '小组', permissions: ['put', 'delete', 'post', 'get'],
        children: [
          {code: '/mlm/teams/:id', title: '指定小组', permissions: ['put', 'delete', 'post', 'get']}
        ]
      }
    ]
  },
  {
    code: '/bank', title: 'Bank', permissions: ['get'],
    children: [
      {
        code: '/bank/transfer', title: '转账', permissions: ['post'],
      },
      {
        code: '/bank/users', title: '用户', permissions: ['put', 'delete', 'post', 'get'],
        children: [
          {code: '/bank/users/:id', title: '指定用户', permissions: ['put', 'delete', 'post', 'get']}
        ]
      },
      {
        code: '/bank/accounts', title: '账户', permissions: ['put', 'delete', 'post', 'get'],
        children: [
          {code: '/bank/accounts/:id', title: '指定账户', permissions: ['put', 'delete', 'post', 'get']}
        ]
      },
      {
        code: '/bank/transfers', title: '转帐记录', permissions: ['put', 'delete', 'post', 'get'],
        children: [
          {code: '/bank/transfers/:id', title: '指定转帐记录', permissions: ['put', 'delete', 'post', 'get']}
        ]
      },
      {
        code: '/bank/balances', title: '余额', permissions: ['put', 'delete', 'post', 'get'],
        children: [
          {code: '/bank/balances/:id', title: '指定余额', permissions: ['put', 'delete', 'post', 'get']}
        ]
      },
      {
        code: '/bank/ctss', title: '货币', permissions: ['put', 'delete', 'post', 'get'],
        children: [
          {code: '/bank/ctss/:id', title: '指定货币', permissions: ['put', 'delete', 'post', 'get']}
        ]
      }
    ]
  },
  {
    code: '/shop', title: 'Shop', permissions: ['get'],
    children: [
      {
        code: '/shop/products', title: '产品', permissions: ['put', 'delete', 'post', 'get'],
        children: [
          {code: '/shop/products/:id', title: '指定产品', permissions: ['put', 'delete', 'post', 'get']}
        ]
      },
      {
        code: '/shop/orders', title: '订单', permissions: ['put', 'delete', 'post', 'get'],
        children: [
          {code: '/shop/orders/:id', title: '指定订单', permissions: ['put', 'delete', 'post', 'get']}
        ]
      }
    ]
  },
  {
    code: '/rmb', title: 'RMB', permissions: ['get'],
    children: [
      {
        code: '/tb/:id', title: '指定余额', permissions: ['post', 'get'],
        children: [
          {code: '/tb/:id/transfer', title: '转账', permissions: ['post']},
          {code: '/tb/:id/records', title: '账单', permissions: ['get']}
        ]
      }
    ]
  },
  {
    code: '/tb', title: 'TB', permissions: ['get'],
    children: [
      {
        code: '/tb/:id', title: '指定余额', permissions: ['post', 'get'],
        children: [
          {code: '/tb/:id/transfer', title: '转账', permissions: ['post']},
          {code: '/tb/:id/records', title: '账单', permissions: ['get']}
        ]
      }
    ]
  },
  {
    code: '/wechat', title: '微信公众号', permissions: ['get']
  },
  {
    code: '/pay', title: '支付', permissions: ['get'],
    children: [
      {
        code: '/pay/prepay/:channel', title: '预支付', permissions: ['post'],
      }
    ]
  }
];
