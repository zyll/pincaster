var vows = require('vows'),
    assert = require('assert')
require('../lib/pincaster/pincaster')

var layer_name = "test "+(new Date())
var pincaster = new Pincaster('localhost', 4269)
var layer = new Layer(layer_name, pincaster)
var layers = new Layers(pincaster)

vows.describe('Layer').addBatch({
    'when listing': {
        topic: function() {
            layers.all(this.callback)
        } ,
        'return a list': function (err, topic) {
            assert.isNull(err)
            assert.isObject(topic)
            assert.isNotNull(topic.layers)
            assert.isArray(topic.layers)
        }
    }
}).addBatch({
    'when creating': {
        topic: function() {
            layer.create(this.callback)
        },
        'is created': function (err, topic) {
            assert.isNull(err)
            assert.equal(topic.status, 'created')
        },
        'request layers list': {
            topic: function() {
                layers.all(this.callback)
            },
            'is in list': function (err, topic) {
                assert.isNull(err)
                assert.isObject(topic)
                assert.isNotNull(topic.layers)
                assert.isArray(topic.layers)
                var find = false
                for(var i=0, l = topic.layers.length; i<l; i++ ) {
                    if(topic.layers[i].name == layer_name) find = true
                }
                assert.isTrue(find)
            }
        }
    }
}).addBatch({
    'when destroying': {
        topic: function() {
            layers.destroy(layer, this.callback)
        },
        'is deleted': function (err, topic) {
            assert.isNull(err)
            assert.equal(topic.status, 'deleted')
        },
        'is not in layers list': {
            topic: function(err, content) {
                layers.all(this.callback)
            },
            'is not in the list': function (err, topic) {
                assert.isNull(err)
                assert.isObject(topic)
                assert.isNotNull(topic.layers)
                assert.isArray(topic.layers)
                    var find = false
                    for(var i=0, l = topic.layers.length; i<l; i++ ) {
                        if(topic.layers[i].name == layer_name) find = true
                    }
                    assert.isFalse(find)
                }
            }
        } 
    }
).addBatch({
    'when creating using empty label': {
        topic: function() {
            layers.create('', this.callback)
        },
        'is created': function (err, topic) {
            assert.isTrue(err)
        }
    }
}).export(module)
