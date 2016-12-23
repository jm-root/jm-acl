var jm = require('jm-dao');
module.exports = function (service, opts) {
    opts || (opts={});
    opts.modelName || (opts.modelName = 'org');
    opts.schema || (opts.schema = require('../schema/org')());
    var model = jm.dao(opts);
    jm.enableEvent(model);
    return model;
};
