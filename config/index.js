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
        ms: [
            {type: 'ws'},
            {type: 'http'}
        ]
    }
};

var env = process.env.NODE_ENV||'development';
config = config[env]||config['development'];
config.env = env;

['debug', 'port', 'prefix', 'trustProxy', 'db', 'mq', 'superRole', 'guestRole'].forEach(function(key) {
    process.env[key] && (config[key]=process.env[key]);
});

module.exports = config;

