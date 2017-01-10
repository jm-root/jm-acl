module.exports = function (model, opts) {

    var default_opts = opts || {};

    model.load = function(opts, cb) {
        var self = this;
        self.loaded = false;
        var roots = [];
        var nodes = {};
        var nodesByCode = {};
        opts || (opts = default_opts);
        opts.lean = true;
        opts.options || (opts.options = {});
        opts.options.sort || (opts.options.sort = [{sort: 1}]);
        self.find2(opts, function(err, doc){
            if(err) return cb(err, doc);
            for(var i in doc){
                var node = doc[i];
                node.id = node._id;
                if(nodes[node.id]){
                    node.children = nodes[node.id].children;
                }
                nodes[node.id] = node;
                nodesByCode[node.code] = node;
                if(node.parent){
                    nodes[node.parent] || (nodes[node.parent]={});
                    nodes[node.parent].children || (nodes[node.parent].children = []);
                    nodes[node.parent].children.push(node);
                } else {
                    roots.push(node);
                }
            }
            self.roots = roots;
            self.nodes = nodes;
            self.nodesByCode = nodesByCode;
            self.loaded = true;
            cb(null, true);
        });
    };

    model.on('load', function(opts){
        model.load(opts);
    });
    model.parentByCode = function(code) {
        var node = this.nodesByCode[code];
        if(node&&node.parent) return node.parent;
        return null;
    };
    model.titleByCode = function(code) {
        var node = this.nodesByCode[code];
        if(node&&node.title) return node.title;
        return null;
    };
    model.idByCode = function(code) {
        var node = this.nodesByCode[code];
        if(node) return node.id;
        return null;
    };

    model.codeById = function(id) {
        var node = this.nodes[id];
        if(node) return node.code;
        return null;
    };

    model.getTree = function(id) {
        if(id) return [this.nodes[id]];
        return this.roots;
    };

    model.load();

};

