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
            new Record("first record", layer2)
                .get(this.callback)
        },
        'ack': function (err, content) {
            assert.isNull(err)
            assert.equal(content.key, 'first record')
            assert.equal(content.type, 'hash')
            assert.deepEqual(content.properties, {plop: "plip"})
        }
    }
    // todo test destroy layer.
}).addBatch({
    'when updating a record': {
        topic: function() {
            var self = this;
            new Record("update record", layer2)
                .create({"update_field": 'original value'}, function(err, content) {
                    new Record("update record", layer2)
                        .update({"update_field": 'new value'}, function(err, content){
                            new Record("update record", layer2)
                                .get(self.callback)
                        })
                })
        },
        'ack': function (err, content) {
            assert.isNull(err)
            assert.equal(content.key, 'update record')
            assert.equal(content.type, 'hash')
            assert.deepEqual(content.properties, {update_field: "new value"})
        }
    }
}).addBatch({
    'when removing some properties': {
        topic: function() {
            var self = this
            new Record("remove prop record", layer2)
                .create({apropertie: "propertie", anotherone: "other prop"}, function(err, content){
                    new Record("remove prop record", layer2)
                        .remove(["apropertie", "anotherone"], self.callback)
                })
        },
        'ack': function (err, content) {
            assert.isNull(err)
            assert.equal(content.status, 'stored')
        }
    }
}).addBatch({
    'when reteiving record with a removed properties': {
        topic: function() {
            new Record("remove prop record", layer2)
                .get(this.callback)
        },
        'are no more in records properties': function (err, content) {
            assert.isNull(err)
            assert.isUndefined(content.properties.apropertie)
            assert.isUndefined(content.properties.anotherone)
        }
    }
}).addBatch({
    'when removing properties field from the record': {
        topic: function() {
            var self = this
            new Record("remove all prop record", layer2)
                .create({apropertie: "propertie", anotherone: "other prop"}, function(err, content){
                    new Record("remove all prop record", layer2)
                        .remove(self.callback)
                })
        },
        'ack': function (err, content) {
            assert.isNull(err)
            assert.equal(content.status, 'stored')
        }
    }
}).addBatch({
    'when reteiving record with all removed properties': {
        topic: function() {
            new Record("remove all prop record", layer2)
                .get(this.callback)
        },
        'are no more in records properties': function (err, content) {
            assert.isNull(err)
            assert.isUndefined(content.properties)
        }
    }
}).addBatch({
    'when deleting a layer': {
        topic: function() {
            layer2.destroy(this.callback)
        },
        'ack': function (err, content) {
            assert.isNull(err)
            assert.equal(content.status, 'deleted')
        }
    }
}).export(module)
