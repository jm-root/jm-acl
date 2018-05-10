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

    ms.client({
        uri: 'http://localhost:20110/acl'
    }, function(err, doc){
        var client = doc;
        client.get({uri:'/'}, function(err, doc){
            log(err, doc);
        });
    });


    ms.client({
        type: 'ws',
        uri: 'ws://localhost:20111/acl'
    }, function(err, doc){
        var ws = doc;
        ws.on('open', function(event) {
            ws.get({
                uri: '/'
            }, function(err, doc){
                log(err, doc);
            });
        });
    });


})();