var jm = require('jm-dao');
module.exports = function (service, opts) {
    opts || (opts={});
    opts.modelName || (opts.modelName = 'role');
    opts.schema || (opts.schema = require('../schema/role')());
    var model = jm.dao(opts);
    jm.enableEvent(model);
    require('./common')(model);

    model.init = function(opts, cb){
        var self = this;
        self.create(
            {
                code: 'guest',
                title: '访客'
            },
            function(err, doc){
                var id = doc.id;
                self.create(
                    {
                        parent: id,
                        code: 'user',
                        title: '用户'
                    }
                );
            }
        );

        self.emit('load');
    };

    return model;
};
