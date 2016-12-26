var jm = require('jm-dao');
module.exports = function (service, opts) {
    opts || (opts={});
    opts.modelName || (opts.modelName = 'permission');
    opts.schema || (opts.schema = require('../schema/permission')());
    var model = jm.dao(opts);
    jm.enableEvent(model);
    require('./common')(model);

    model.init = function(opts, cb){
        var self = this;
        self.create(
            {
                code: '*',
                title: '全部'
            }
        );
        self.create(
            {
                code: 'get',
                title: '查询'
            }
        );
        self.create(
            {
                code: 'post',
                title: '修改'
            }
        );
        self.create(
            {
                code: 'delete',
                title: '删除'
            }
        );

        self.emit('load');
    };
    return model;
};
