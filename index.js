var fs = require('fs'),
    path = require('path'),
    inflection = require('inflection'),
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

                (function(decorator, model) {

                    model.prototype.decorate = function() {

                        var d = new decorator(this),
                            decoratedObj = {};

                        [this, d].forEach(function(obj) {
                            var props = getAllPropertyNames(obj);

                            props.forEach(function(prop) {
                                decoratedObj[prop] = obj[prop];
                            });
                        });

                        return decoratedObj;
                    };

                    decorator.decorateCollection = function(collection) {

                        return _.map(collection, function(e) {
                            return e.decorate();
                        });
                    };
                    
                })(decorator, model);

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

    function getAllPropertyNames(obj) {
        var props = [];

        do {
            Object.getOwnPropertyNames(obj).forEach(function (prop) {
                if (props.indexOf(prop) === -1) {
                    props.push(prop);
                }
            });
        } while (obj = Object.getPrototypeOf(obj));

        return props;
    }

};