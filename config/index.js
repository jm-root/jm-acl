require('log4js').configure(require('path').join(__dirname, 'log4js.json'))
var config = {
  development: {
    debug: true,
    defaultAllow: true,
    port: 3000,
    db: 'mongodb://localhost/acl',
    mq: 'redis://localhost',
    // tableNamePrefix: 'acl_',
    modules: {
      acl: {
        module: process.cwd() + '/lib'
      }
    }
  },
  production: {
    debug: false,
    port: 80,
    db: 'mongodb://mongo.db/acl',
    mq: 'redis://redis.db',
    modules: {
      acl: {
        module: process.cwd() + '/lib'
      }
    }
  }
}

var env = process.env.NODE_ENV || 'development'
config = config[env] || config['development']
config.env = env

module.exports = config
