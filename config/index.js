var config = {
    development: {
        prefix: "/acl",
        debug: true,
        port: 20110,
        db: 'mongodb://localhost/acl',
        mq: 'redis://localhost',
        ms: [
            {type: 'ws'},
            {type: 'http'}
        ]
    },
    production: {
        prefix: "/acl",
        debug: false,
        port: 20110,
        db: 'mongodb://mongo.db/acl',
        mq: 'redis://redis.db',
        ms: [
            {type: 'ws'},
            {type: 'http'}
        ]
    }
};

var env = process.env.NODE_ENV||'development';
config = config[env]||config['development'];
config.env = env;

['debug', 'port', 'prefix', 'trustProxy', 'db', 'mq', 'superRole', 'guestRole', 'userRole', 'disableAutoInit'].forEach(function(key) {
    process.env[key] && (config[key]=process.env[key]);
});

module.exports = config;

