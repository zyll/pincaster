sys = require('sys')
require('./../lib/pincaster/pincaster')

var pincaster = new Pincaster('localhost', 4269)
var gironde = new Layer("rmll", pincaster)

var castles = [
    { name: "chateau sentous", latitude: 44.729342, longitude: -0.421965},
    { name: "chateau la caussade", latitude: 44.726476, longitude: -0.423317},
    { name: "chateau constantin", latitude: 44.730744, longitude: -0.425763},
    { name: "chateau melin", latitude: 44.729937, longitude: -0.430248},
    { name: "chateau puygeraud", latitude: 44.72643, longitude: -0.431492}
]

var init = function(callback) {
    pincaster.ping(function(err, ack) {
        // if !err
        gironde.create(function(err, ack) {
            var castles_remaining = castles.length
            for(i in castles) {
                var exit = false
                var r = new Record(castles[i].name, gironde)
                r.latitude = castles[i].latitude
                r.longitude = castles[i].longitude
                r.properties = {castle:"yes"}
                r.create(function(err, ack) {
                    castles_remaining--
                    if(err && !exit) {
                        exit = true
                        callback(true)
                    }
                    if(castles_remaining == 0 && !exit) {
                        callback(null)
                    }
                })
            }
        })
    })
}

var castleAsObj = function (content) {
    castle = new Record(content.key, gironde)
    castle.key = content.key
    castle.latitude = content.latitude
    castle.longitude = content.longitude
    castle.properties = content.properties
    return castle
}

var choose_next_castle = function(err, content) {
    if(!err) {
        if(content.matches.length > 0) {
            var i = Math.round(Math.random() * (content.matches.length -1))
            var c = content.matches[i]
            var c_o = castleAsObj(c)
            sys.log("to " +c.key+"("+c_o.latitude+", "+c_o.longitude+")")
            sys.log("distance = "+content.matches[i].distance)
            next_castle(null, c)
        }
    }
}

var next_castle = function(err, from_castle) {
    if(!err){
        from_castle = castleAsObj(from_castle)
        sys.log("from "+from_castle.key+"("+ from_castle.latitude +", "+from_castle.longitude+")")
        from_castle.nearby(6744440000, choose_next_castle)
    } else {
        sys.log("[err]" + sys.inspect(err))
    }
}

init(function(err, content) {
    if(err) {
        sys.log("wrong init")
    } else {
    new Record("chateau sentous", gironde)
        .get(next_castle)
    }
})
