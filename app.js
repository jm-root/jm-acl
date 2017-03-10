require('log4js').configure('./config/log4js.json');
require('jm-server')(require('./config'));

process.on('uncaughtException', function (err) {
    console.error('Caught exception: ' + err.stack);
});
