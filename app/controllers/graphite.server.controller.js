'use strict';
/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    _ = require('lodash'),
    errorHandler = require('./errors.server.controller'),
    request = require('request'),
    requestjson = require('request-json'),
    config = require('../../config/config'),
    Memcached = require('memcached'),
    GraphiteCache = mongoose.model('GraphiteCache'),
    md5 = require('MD5');
/* Memcached config */
Memcached.config.poolSize = 512;
Memcached.config.timeout = 100;
Memcached.config.retries = 3;
Memcached.config.reconnect = 1000;
Memcached.config.maxValue = 10480000;
exports.getGraphiteData = getGraphiteData;
exports.flushGraphiteCacheKey = flushGraphiteCacheKey;
exports.createGraphiteCacheKey = createGraphiteCacheKey;

/**
 * Find metrics
 */

exports.findMetrics = function (req, res) {


  // Set the headers
  var headers = {
    'Content-Type':     'application/json'
  }

// Configure the request
  var options = {
    url: config.graphiteHost + '/metrics/find',
    method: 'POST',
    headers: headers,
    form: { query: req.params.query }
  }

  request(options,
      function (error, response, body) {
        if (!error && response.statusCode == 200) {
          res.json(JSON.parse(body));
        }
      }
  );


}
/**
 * Get  Graphite data
 */
exports.getData = function (req, res) {
  /* get url params */
  var from = req.query.from;
  var until = req.query.until;
  var targets = req.query.target;
  var maxDataPoints = req.query.maxDataPoints;
  getGraphiteData(from, until, targets, maxDataPoints, function (body) {
    res.set('Content-Type', 'application/javascript');
    res.jsonp(body);
  });
};
function getGraphiteData(from, until, targets, maxDataPoints, callback) {
  /* memcached stuff*/
  var graphiteCacheKey = createGraphiteCacheKey(from, until, targets);
  var memcached = new Memcached(config.memcachedHost);
  var graphiteTargetUrl = createUrl(from, until, targets, maxDataPoints);
  var client = requestjson.createClient(config.graphiteHost);
  /* Don't cache live data! */
  if (until === 'now') {
    client.get(graphiteTargetUrl, function (err, response, body) {
      if (err) {
        //                return response.status(400).send({
        //                    message: errorHandler.getErrorMessage(err)
        //                });
        callback([]);
      } else {
        callback(body);
      }
    });
  } else {
    ///* first check memcached */
    //memcached.get(graphiteCacheKey, function (err, result) {
    //  if (err)
    //    console.error('memcached error: ' + err);
    //  if (result && !err) {
    //    console.dir('cache hit: ' + graphiteCacheKey);
    //    callback(result);
    //    memcached.end();
    //  } else {
    //    //console.log(graphiteTargetUrl);
    //    /* if no cache hit, go to graphite back end */
    //    client.get(graphiteTargetUrl, function (err, response, body) {
    //      if (err) {
    //        callback([]);
    //      } else {
    //        callback(body);
    //        /* add to memcached if it is a valid response */
    //        if (body != '[]' && body.length > 0 && response.statusCode == 200) {
    //          memcached.set(graphiteCacheKey, body, 3600 * 24 * 7, function (err, result) {
    //            if (err)
    //              console.error(err);
    //            console.dir('key set ' + graphiteCacheKey + ' : ' + result);
    //            memcached.end();
    //          });
    //        }
    //      }
    //    });
    //  }
    //});
    /* first check Graphite cache in mongo */
    GraphiteCache.findOne({key: graphiteCacheKey}).exec(function(err, result){
      if (err)
        console.error('graphite cache error: ' + err);
      if (result && !err) {
        console.dir('cache hit: ' + graphiteCacheKey);
        callback(result.value);

      } else {
        //console.log(graphiteTargetUrl);
        /* if no cache hit, go to graphite back end */
        client.get(graphiteTargetUrl, function (err, response, body) {
          if (err) {
            callback([]);
          } else {
            callback(body);
            /* add to memcached if it is a valid response */
            if (body != '[]' && body.length > 0 && response.statusCode == 200) {
              var graphiteCacheItem = new GraphiteCache({key: graphiteCacheKey, value: body });

              graphiteCacheItem.save(function(err, savedItem){

                if (err)
                  console.error(err);
                console.dir('key set: ' + graphiteCacheKey);

              })

            }
          }
        });
      }
    });
  }
}
function createUrl(from, until, targets, maxDataPoints) {
  var graphiteTargetUrl = '/render?format=json&from=' + from + '&until=' + until + '&maxDataPoints=' + maxDataPoints;
  if (_.isArray(targets)) {
    _.each(targets, function (target) {
      graphiteTargetUrl += '&target=' + target;
    });
  } else {
    graphiteTargetUrl += '&target=' + targets;
  }
  return graphiteTargetUrl;
}
function createGraphiteCacheKey(from, until, targets) {
  var graphiteCacheKey;
  var hashedGraphiteCacheKey;
  graphiteCacheKey = from.toString() + until.toString();
  if (_.isArray(targets)) {
    targets.sort();
    _.each(targets, function (target) {
      graphiteCacheKey += target;
    });
  } else {
    graphiteCacheKey += targets;
  }
  //    console.log("raw key:" + graphiteCacheKey)
  hashedGraphiteCacheKey = md5(graphiteCacheKey);
  return hashedGraphiteCacheKey;  //    return graphiteCacheKey.replace(/\s/g,'');
}
function flushGraphiteCacheKey(key, callback) {

  GraphiteCache.remove({key: graphiteCacheKey}).exec(function(err, result){
    if (err)
      console.error('graphite cache flush error: ' + err);
    else (result && !err)
    {
      console.dir('cache flushed for key: ' + graphiteCacheKey);
      callback();
    }
  });
  //
  //
  //    var memcached = new Memcached(config.memcachedHost);
  //memcached.del(key, function (err, result) {
  //  if (err)
  //    callback(err);
  //  console.info('deleted key: ' + key + ' : ' + result);
  //  callback();
  //});
  //memcached.end();  // as we are 100% certain we are not going to use the connection again, we are going to end it
}
