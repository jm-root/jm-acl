var jm = require('jm-dao');
module.exports = function (service, opts) {
    opts || (opts={});
    opts.modelName || (opts.modelName = 'org');
    opts.schema || (opts.schema = require('../schema/org')());
    var model = jm.dao(opts);
    jm.enableEvent(model);
    require('./common')(model);

    model.init = function(opts, cb){
        var self = this;
        self.create(
            {
                code: 'root',
                title: '根'
            },
            function(err, doc){
                var id = doc.id;
                self.create(
                    {
                        parent: id,
                        code: 'bank',
                        title: '银行'
                    }
                );
            }
        );

        self.emit('load');
    };

    return model;
};
