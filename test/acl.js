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
        if(doc){
            logger.debug('%s', utils.formatJSON(doc));
        }
    };

    var opts = {
        db: require('jm-dao').DB.connect()
    };

    opts.db.on('open', function(){
        var service = require('../lib')(opts);
        service.acl.allow('guest', '/acl', 'get', log);
        service.acl.addUserRoles('guest', 'guest', log);
    });
})();