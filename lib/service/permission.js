var jm = require('jm-dao');
module.exports = function (service, opts) {
    opts || (opts={});
    opts.modelName || (opts.modelName = 'permission');
    opts.schema || (opts.schema = require('../schema/permission')());
    var model = jm.dao(opts);
    jm.enableEvent(model);
    return model;
};
