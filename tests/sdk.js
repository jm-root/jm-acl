var jm = jm || {};
if (typeof module !== 'undefined' && module.exports) {
    jm = require('../sdk');
}

(function(){
    var sdk = jm.sdk;
    var logger = jm.logger;
    var utils = jm.utils;

    var log = function(err, doc){
        if (err) {
            logger.error(err.stack);
        }
        if(doc){
            logger.debug('%s', utils.formatJSON(doc));
        }
    };

    sdk.on('open', function(name){
        if(name !== 'acl') return;
        sdk.acl.userRoles({}, log);
        sdk.acl.isAllowed({
            resource: 'global',
            permissions: 'get'
        }, log);
    });

    var sdkConfig = sdkConfig || {
            uri: 'ws://localhost:20110'
        };
    sdk.init(sdkConfig);
})();