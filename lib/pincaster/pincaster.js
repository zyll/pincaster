var http = require('http')
var sys = require('sys')

/**
 * A pincaster server.
 * @param host
 * @param port
 */
Pincaster = function(host, port) {
    this.host = host
    this.port = port
    this.client = http.createClient(this.port, this.host)
    this.Layers = new Layers(this)
}

/**
 * Ensure that the server is up and running.
 * @param {Function} callback(err, ack) on operation done. 
 */
Pincaster.prototype.ping  = function (callback) {
    new Query(this)
        .callback(callback)
        .get('/api/1.0/system/ping.json')
}

/**
 * Shuting down the pincaster server.
 * @param {Function} callback(err, ack) on operation done. 
 */
Pincaster.prototype.shutdown = function (callback) {
    new Query(this)
        .callback(callback)
        .post('/api/1.0/system/shutdown.json')
}

/**
 * Prepare a query on pincaster.
 * @param pincaster {Pincaster} the server on witch to perform the request.
 * @protected
 */
Query = function(pincaster) {
    this.client = pincaster.client
    this.callback_f = function(){sys.log("no callback")}
}

/**
 * Defining the callback to perform on server response.
 * @param {Function} callback wont be used, it's for later operation.
 * @return self in order to chaine.
 * @protected
 */
Query.prototype.callback = function (callback) {
    this.callback_f = callback
    return this
}

/**
 * Defining properties on the object (use only on records).
 * @param {Hash} every props that you need to store.
 * @return self in order to chaine.
 * @protected
 */
Query.prototype.properties = function (properties) {
    this._properties = properties
    return this
}

/**
 * Defining locations properties on the object (use only on records).
 * @param {float} latitude.
 * @param {float} longitude.
 * @return self in order to chaine.
 * @protected
 */
Query.prototype.location = function (latitude, longitude) {
    this.latitude = latitude
    this.longitude = longitude
    return this
}

/**
 * Perform the query. if a callback is defined, it will be use to handle the response.
 * @param {String} HTTP verb.
 * @param {String} url.
 * @param {Hash} options add some options to http.client.request.
 * @protected
 */
Query.prototype.send = function (method, url, options) {
    var _callback = this.callback_f
    var buffer = ""
    var request = this.client.request(method, url, options) 
        .addListener('response', function(response) {
            if(response.statusCode != 200) {
                _callback(true, null)
            } else {
                response.setEncoding('utf8')
                response.addListener('data', function(chunk) {
                    buffer += chunk
                }).addListener('end', function() {
                    _callback(null, JSON.parse(buffer))
                })
            }
        })
    // write the request body if needed
    var first = true
    // record data
    if(typeof(this._properties)!= 'undefined') {
        for(var p in this._properties) {
            if(!first) {
                request.write("&")
            }
            request.write(p + "=" + this._properties[p])
            first = false
        }
    }
    // record as location
    if(typeof(this.latitude)!= 'undefined' && typeof(this.longitude)!= 'undefined') {
        if(!first) {
            request.write("&")
        }
        request.write("_loc=" + this.latitude + "," + this.longitude)
    }
    request.end()
}

/**
 * Perform the query as a POST
 * @see Query.send
 */
Query.prototype.post = function (url, options) { this.send('POST', url, options) }

/**
 * Perform the query as a GET
 * @see Query.send
 */
Query.prototype.get = function (url, options) { this.send('GET', url, options) }

/**
 * Perform the query as a PUT
 * @see Query.send
 */
Query.prototype.put = function (url, options) { this.send('PUT', url, options) }

/**
 * Perform the query as a DELETE
 * @see Query.send
 */
Query.prototype.destroy = function (url, options) { this.send('DELETE', url, options) }

/**
 * pincaster layer object.
 * @param {String} name used as a key
 * @param {Pincaster} pincaster pincaster server to use.
 */
Layer = function(name, pincaster) {
    this.name = name
    this.pincaster = pincaster
}

/**
 * Create the layer on pincaster.
 * @param {Function} callback (err, ack) on operation complete.
 */
Layer.prototype.create = function(callback) {
    new Query(this.pincaster)
        .callback(callback)
        .post('/api/1.0/layers/' + encodeURI(this.name) + '.json', {'content-type': 'application/x-www-form-urlencoded'})
}

/**
 * Delete the layer.
 * @param {Function} callback (err, ack) on operation complete.
 */
Layer.prototype.destroy = function(callback) {
    new Query(this.pincaster)
        .callback(callback)
        .destroy('/api/1.0/layers/' + encodeURI(this.name) + '.json')
}

/**
 * Layers list. Allow querys on layers info.
 * @param {Pincaster} pincaster the server to use.
 */
Layers = function(pincaster) {
    this.pincaster = pincaster
}

/**
 * Create a new layer on your pincaster.
 * @param {String} name the layer name to create, use as the key.
 * @param {Function} callback (err, ack)
 * @return {Layer} new layer as defined, must check callback to be sur that the object is really saved on your pincaster.
 */
Layers.prototype.create = function(name, callback) {
    new Query(this.pincaster)
        .callback(callback)
        .post('/api/1.0/layers/'+encodeURI(name)+'.json', {'content-type': 'application/x-www-form-urlencoded'})
    return new Layer(name, this.pincaster) 
}

/**
 * retreiving the layers list on this pincaster.
 * @param {Function} callback (err, Hash)
 */
Layers.prototype.all = function(callback) {
    new Query(this.pincaster)
        .callback(callback)
        .get('/api/1.0/layers/index.json')
}

/**
 * Defining a record.
 * @param {String} key the id of this record.
 * @param {Layer} the layer to use.
 */
Record = function(key, layer) {
    this.key = key
    this.layer = layer
}

/**
 * Retreiving data from server for this record.
 * @param {Function} callback (err, hash)
 */
Record.prototype.get = function(callback) {
    new Query(this.layer.pincaster)
        .callback(callback)
        .get('/api/1.0/records/' + encodeURI(this.layer.name) + '/'+encodeURI(this.key)+'.json')
}

/**
 * Retreiving records nearby the record.
 * @param {float} radius how far can be the point.
 * @param {Function} callback (err, hash) to process the response.
 */
Record.prototype.nearby = function(radius, callback) {
    var url = '/api/1.0/search/' + encodeURI(this.layer.name) + '/nearby/'+this.longitude+','+this.latitude+'.json?radius='+radius
    new Query(this.layer.pincaster)
        .callback(callback)
        .get(url)
}

/**
 * Add the record to the pincaster server.
 * @param {Hash} prop (optional) the data to save on record.
 * @param {Function} callback (err, ack)
 */
Record.prototype.create = function(prop, callback) {
    if(arguments.length == 1) {
        callback = prop
    }
    if(arguments.length == 2) {
        this.properties = prop
    }
    new Query(this.layer.pincaster)
        .callback(callback)
        .properties(this.properties||{})
        .location(this.latitude, this.longitude)
        .put('/api/1.0/records/' + encodeURI(this.layer.name) + '/' + encodeURI(this.key) + '.json', {'content-type': 'application/x-www-form-urlencoded'})
}

/**
 * Updating a record (in fact, using create is the same).
 * @param {Hash} prop (optional) the data to add or update on the record.
 * @param {Function} callback (err, ack)
 */
Record.prototype.update = Record.prototype.create

/**
 * removing a properties from the record
 * @param {String||Array} (optional) props name of the properties to delete or a list, may be omited to delete the properties field.
 * @param {Function} callback (err, ack)
 */
Record.prototype.remove = function (prop, callback) {
    var del_prop = {}
    if(arguments.length == 1) {
        callback = prop
        del_prop = {_delete_all: 1}
    } else {
        if(prop instanceof Array) {
            for(var i in prop) {
                del_prop ["_delete:"+prop[i]]= 1
            }
        } else {
            del_prop ["_delete:"+prop]= 1
        }
    }

    new Query(this.layer.pincaster)
        .callback(callback)
        .properties(del_prop)
        .put('/api/1.0/records/' + encodeURI(this.layer.name) + '/' + encodeURI(this.key) + '.json', {'content-type': 'application/x-www-form-urlencoded'})
}

/**
 * adding value to properties.
 * @param {Hash} props name of the properties to increment.
 * @param {Function} callback (err, ack)
 */
Record.prototype.add = function (props, callback) {
    var add_props = {}
    for(var i in props) {
        add_props ["_add_int:" + i]= props[i]
    }
    new Query(this.layer.pincaster)
        .callback(callback)
        .properties(add_props)
        .put('/api/1.0/records/' + encodeURI(this.layer.name) + '/' + encodeURI(this.key) + '.json', {'content-type': 'application/x-www-form-urlencoded'})
}

exports.Query
exports.Pincaster
exports.Layer
exports.Layers
exports.Record
exports.Records
