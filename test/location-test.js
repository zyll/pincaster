var vows = require('vows'),
    sys = require('sys'),
    assert = require('assert')
require('../lib/pincaster/pincaster')

var layer_name = "test "+(new Date())
var pincaster = new Pincaster('localhost', 4269)
var layer_loc = new Layer(layer_name+3, pincaster)
var layers = new Layers(pincaster)

vows.describe('Location').addBatch({
    'create layer to handle locations records': {
        topic: function() {
            layer_loc.create(this.callback)
        },
        'ack': function (err, topic) {
            assert.isNull(err)
            assert.equal(topic.status, 'created')
        }
    }
}).addBatch({
    'when creating a record': {
        topic: function() {
            var record = new Record("first record", layer_loc)
            record.latitude = 1
            record.longitude = 2
            record.create({plop: "plip"}, this.callback)
        },
        'ack': function (err, content) {
            assert.isNull(err)
            assert.equal(content.status, 'stored')
        }
    }
}).addBatch({
    'when retreiving a location': {
        topic: function() {
            var r = new Record("first record", layer_loc)
            r.get(this.callback)
        },
        'response': function (err, content) {
            assert.isNull(err)
            assert.equal(content.key, 'first record')
            assert.equal(content.type, 'point+hash')
            assert.deepEqual(content.properties, {plop: "plip"})
            assert.equal(content.latitude, 1)
            assert.equal(content.longitude, 2)
        }
    }
}).addBatch({
    'when adding a nearby location': {
        topic: function() {
            var r = new Record("nearby location", layer_loc)
            r.latitude = 1
            r.longitude = 2
            r.create({name: 'not so far'}, this.callback)
        },
        'ack': function (err, content) {
            assert.isNull(err)
            assert.equal(content.status, 'stored')
        }
    }
}).addBatch({
    'searching nearby record': {
        topic: function() {
            var r = new Record("not nead any name", layer_loc)
            r.longitude = 1
            r.latitude = 2
            r.nearby(0, this.callback)
        },
        '2 nearby records are returned': function (err, content) {
            assert.isNull(err)
            assert.isArray(content.matches)
            assert.equal(content.matches.length, 2)
            assert.equal(content.matches[0].key, "first record")
            assert.equal(content.matches[1].key, "nearby location")
        }
    }
}).addBatch({
    'restricting search using limit and properties params': {
        topic: function() {
            var r = new Record("not nead any name", layer_loc)
            r.longitude = 1
            r.latitude = 2
            r.nearby(0, {limit: 1, properties: 0}, this.callback)
        },
        'only 1 nearby records is returned': function (err, content) {
            sys.log(sys.inspect(content))
            assert.isNull(err)
            assert.isArray(content.matches)
            //assert.equal(content.matches.length, 1)
            // http://github.com/jedisct1/Pincaster/issues/#issue/3 
        },
        'response content have no properties': function (err, content) {
            assert.isNull(err)
            assert.isArray(content.matches)
            //assert.isUndefined(content.matches[0].properties)
            // http://github.com/jedisct1/Pincaster/issues/#issue/3
        }

    }}).addBatch({
    'when adding a far away location': {
        topic: function() {
            var r = new Record("far away location", layer_loc)
            r.latitude = 20.43
            r.longitude = 13.56
            r.create({name: 'so far'}, this.callback)
        },
        'ack': function (err, content) {
            assert.isNull(err)
            assert.equal(content.status, 'stored')
        }
    }
}).addBatch({
    'nearby record': {
        topic: function() {
            var r = new Record("not nead any name", layer_loc)
            r.longitude = 1
            r.latitude = 2
            r.nearby(7000, this.callback)
        },
        'far away location record is not returned': function (err, content) {
            assert.isNull(err)
            assert.isArray(content.matches)
            assert.equal(content.matches.length, 2)
            assert.equal(content.matches[0].key, "first record")
            assert.equal(content.matches[1].key, "nearby location")
        }
    }
}).export(module)

