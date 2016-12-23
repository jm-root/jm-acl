var config = {
    development: {
        prefix: "/acl",
        debug: true,
        port: 20110,
        db: 'mongodb://localhost:27017/acl',
        sdk: 'http://192.168.0.32:20200',
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
        sdk: 'http://sdk:20200',
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
    config.sdk = env.sdk || config.sdk;
}


module.exports = config;

