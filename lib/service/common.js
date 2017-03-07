module.exports = function (model, opts) {

    var default_opts = opts || {};

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

    model.flatTree = function(code){
        var node = this.nodesByCode[code];
        if(!node) return [];
        var children = node.children || [];
        var rows = [node];
        children.forEach(function(item){
            rows=rows.concat(model.flatTree(item.code));
        });
        return rows;
    };

    model.load = function(opts, cb) {
        var self = this;
        opts || (opts = default_opts);
        opts.lean = true;
        opts.options || (opts.options = {});
        opts.options.sort || (opts.options.sort = [{sort: 1, _id: 1}]);
        self.find2(opts, function(err, doc){
            if(err) return cb(err, doc);
            self.loaded = false;
            self.emit('loading');
            var roots = [];
            var nodes = {};
            var nodesByCode = {};
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
            self.emit('loaded');
            cb(null, true);
        });
    };

    model.on('load', function(opts){
        model.load(opts);
    });

    model.load();

};

