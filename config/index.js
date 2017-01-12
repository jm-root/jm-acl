var config = {
    development: {
        prefix: "/acl",
        debug: true,
        port: 20110,
        db: 'mongodb://localhost:27017/acl',
        mq: 'redis://localhost:6379',
        ms: [
            {type: 'ws'},
            {type: 'http'}
        ]
    },
    production: {
        prefix: "/acl",
        debug: false,
        port: 20110,
        db: 'mongodb://test:123@mongo:27017/acl',
        mq: 'redis://redis:6379',
        ms: [
            {type: 'ws'},
            {type: 'http'}
        ]
    }
};

var env = process.env.NODE_ENV||'development';
config = config[env]||config['development'];
config.env = env;

{
    env = process.env;
    config.port = env.port || config.port;
    config.db = env.db || config.db;
}


module.exports = config;

