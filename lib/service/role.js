var jm = require('jm-dao');
module.exports = function (service, opts) {
    opts || (opts={});
    opts.modelName || (opts.modelName = 'role');
    opts.schema || (opts.schema = require('../schema/role')());
    var model = jm.dao(opts);
    jm.enableEvent(model);
    return model;
};
