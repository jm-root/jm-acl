# jm-acl

a general acl

## run:

npm start

## run in cluster mode:

npm run cluster

## config

基本配置 请参考 [jm-server] (https://github.com/jm-root/jm-server)

db [] 必填, mongo数据库uri

mq [] Redis数据库uri, 如果有，则更新时通过消息服务器通知重新加载

superRole ['root'] 超级角色

guestRole ['guest'] 游客角色

userRole ['user'] 登录用户角色

disableAutoInit [false] 是否禁止自动初始化

defaultAllow [false] 是否默认允许访问未登记的资源或者权限

tableNamePrefix [''] 表名前缀
