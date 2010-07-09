var vows = require('vows'),
    assert = require('assert')
require('../lib/pincaster/pincaster')

var layer_name = "test "+(new Date())
var pincaster = new Pincaster('localhost', 4269)

vows.describe('Pincaster server is up and running').addBatch({
    'pincaster': {
        topic: pincaster,
        'when pinging': {
            topic: function() {
                pincaster.ping(this.callback)
            },
            'pincaster return true': function (err, topic) {
                assert.isNull(err)
                assert.equal(topic.pong, 'pong')
            }
        }
    }
}).export(module)
