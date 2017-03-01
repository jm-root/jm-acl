const cluster = require('cluster');
if (cluster.isMaster) {
    var numCPUs = require('os').cpus().length;
    for (var i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
} else if (cluster.isWorker) {
    require('./app');
}
