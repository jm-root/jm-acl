var jm = require('jm-dao');
module.exports = function (service, opts) {
    opts || (opts={});
    opts.modelName || (opts.modelName = 'resource');
    opts.schema || (opts.schema = require('../schema/resource')());
    var model = jm.dao(opts);
    jm.enableEvent(model);
    return model;
};
