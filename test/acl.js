var jm = jm || {};
if((typeof exports !== 'undefined' && typeof module !== 'undefined')){
    jm = require('jm-ms');
}

(function(){
    var ms = jm.ms;
    var logger = jm.logger;
    var utils = ms.utils;

    var log = function(err, doc){
        if (err) {
            logger.error(err.stack);
        }
        logger.debug('%s', utils.formatJSON(doc));
    };

    var opts = {
        defaultAllow: true,
        db: require('jm-dao').DB.connect('mongodb://localhost/acl')
    };
    var service = require('../lib')(opts);

    // opts.db.on('open', function(){
    //     service.acl.allow('guest', '/acl', 'get');
    //     service.acl.allow('guest', '/acl/resources', 'put');
    //     service.acl.allow('guest', '/acl/resources/:id', 'delete');
    //     service.acl.addUserRoles('guest', 'guest');
    // });

    service.on('loaded', (name) => {
        if (name !== 'resource') return;
        log(null, 'isAllowed /acl get,post');
        //service.isAllowed(null, '/acl', ['get', 'post'], log);
        //service.isAllowed(null, '/acl/resources', 'put', log);
        service.isAllowed(null, '/acl/resources/123', 'post', log);
        // service.isAllowed(null, '/acl/resources/abc', 'delete', log);
    });

})();

process.on('uncaughtException', function (err) {
    console.error('Caught exception: ' + err.stack);
});

