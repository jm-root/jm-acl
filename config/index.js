var config = {
    development: {
        debug: true,
        port: 20110,
        db: 'mongodb://localhost/acl',
        mq: 'redis://localhost',
        tableNamePrefix: 'acl_',
        modules: {
            acl: {
                module: process.cwd() + '/lib'
            }
        }
    },
    production: {
        debug: false,
        port: 20110,
        db: 'mongodb://mongo.db/acl',
        mq: 'redis://redis.db',
        modules: {
            acl: {
                module: process.cwd() + '/lib'
            }
        }
    }
};

var env = process.env.NODE_ENV||'development';
config = config[env]||config['development'];
config.env = env;

module.exports = config;

