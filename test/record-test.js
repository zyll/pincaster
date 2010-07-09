var vows = require('vows'),
    assert = require('assert')
require('../lib/pincaster/pincaster')

var layer_name = "test_records "+(new Date())
var pincaster = new Pincaster('localhost', 4269)
var layer2 = new Layer(layer_name+2, pincaster)
var layers = new Layers(pincaster)

vows.describe('Records').addBatch({
    'create layer to handle records': {
        topic: function() {
            layer2.create(this.callback)
        },
        'ack': function (err, topic) {
            assert.isNull(err)
            assert.equal(topic.status, 'created')
        }
    }
}).addBatch({
    'when creating a record': {
        topic: function() {
            var record = new Record("first record", layer2)
            record.create({plop: "plip"}, this.callback)
        },
        'ack': function (err, content) {
            assert.isNull(err)
            assert.equal(content.status, 'stored')
        }
    }
}).addBatch({
    'when retreiving a record': {
        topic: function() {
            var r = new Record("first record", layer2)
            r.get(this.callback)
        },
        'ack': function (err, content) {
            assert.isNull(err)
            assert.equal(content.key, 'first record')
            assert.equal(content.type, 'hash')
            assert.deepEqual(content.properties, {plop: "plip"})
        }
    }
    // todo test destroy layer.
}).export(module)
