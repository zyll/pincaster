var vows = require('vows'),
//    sys = require('sys'),
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
    'when adding an integer to the "remove all prop" record': {
        topic: function() {
            new Record("remove all prop record", layer2)
                .add({count_me: 1, buffer_me: 34.057657}, this.callback)
        },
        'ack': function (err, content) {
            assert.isNull(err)
            assert.equal(content.status, 'stored')
        }
    }
}).addBatch({
    'when reteiving record with integer added': {
        topic: function() {
            new Record("remove all prop record", layer2)
                .get(this.callback)
        },
        'properties "count_me" is udpated': function (err, content) {
            assert.isNull(err)
            assert.equal(content.properties.count_me, 1)
            assert.equal(content.properties.buffer_me, 34)
        }
    }
}).addBatch({
    'when adding again an integer to the "remove all prop" record': {
        topic: function() {
            new Record("remove all prop record", layer2)
                .add({count_me: -2, buffer_me: 56}, this.callback)
        },
        'ack': function (err, content) {
            assert.isNull(err)
            assert.equal(content.status, 'stored')
        }
    }

}).addBatch({
    'when reteiving record with integer added again': {
        topic: function() {
            new Record("remove all prop record", layer2)
                .get(this.callback)
        },
        'properties "count_me" is udpated': function (err, content) {
            assert.isNull(err)
            assert.equal(content.properties.count_me, -1)
            assert.equal(content.properties.buffer_me, 90)
        }
    }
}).addBatch({
    'when creating a record and marked as expirable': {
        topic: function() {
            var self = this
            new Record("expirable record", layer2)
                .create(function(err, content) {
                    new Record("expirable record", layer2)
                        .expire(43645645, self.callback)
                })
        },
        'properties _expirable is updated': function (err, content) {
            assert.isNull(err)
            assert.equal(content.status, 'stored')
        }
    }
}).addBatch({
    'when reteiving an expirable record': {
        topic: function() {
            new Record("expirable record", layer2)
                .get(this.callback)
        },
        'special properties "expires_at" is present': function (err, content) {
            assert.isNull(err)
            assert.equal(content.expires_at, 43645645)
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
