var fs = require('fs'),
    path = require('path'),
    inflection = require('inflection'),
    Reflect = require('harmony-reflect'),
    _ = require('lodash');

module.exports = function(compound) {

    compound.decorators = {};

    compound.on('models', function(models) {

        loadDecorators(function(decorators) {

            compound.decorators = decorators;

            for (var modelName in decorators) {
                var decorator = decorators[modelName],
                    model = models[modelName];

                global[decorator.decoratorName] = decorator;

                model.prototype.decorate = function() {

                    var _this = this,
                        d = new decorator(this);

                    return Reflect.Proxy({}, {
                        get: function(obj, prop) {
                            return typeof d[prop] !== 'undefined' ? d[prop] : _this[prop];
                        }
                    });
                };

                decorator.decorateCollection = function(collection) {
                    return _.map(collection, function(e) {
                        return e.decorate();
                    });
                };
            }

        });

    });

    function loadDecorators(callback) {

        var decorators = {},
            decoratorDir = path.join(compound.root, 'app', 'decorators');

        fs.readdir(decoratorDir, function(err, files) {

            if (files) {
                files.forEach(function(file) {
                    var decoratorName = inflection.camelize(path.basename(file, '.js')),
                        modelName = decoratorName.replace(/Decorator$/, '');

                    decorators[modelName] = require(path.join(decoratorDir, file))(compound);
                    decorators[modelName].decoratorName = decoratorName;
                });
            }

            callback(decorators);

        });

    }

};