var env = process.env.NODE_ENV || 'development'

// CALCULATE RPS!
var begin = new Date() // for calculating requests per second
var end = new Date()
var __current_rps = 0 // current request per second
var __req_num = 0 // Global application requests number
var __req_num_local = 0 // application requests number, after each RPS calculation
var redis // redis!

// options that can be overwtieen when calling this module
var options = {
  calcRpsEachNseconds: 300,
  maxUserRequestLimitPerMinute: {
    POST: 50,
    GET: 300,
    PUT: 50,
    DELETE: 50
  }
}

/**
 * Checks requests intensivity from single User (if any) OR IP address
 * And skips check in we are in development mode
 * @param req
 * @param res
 * @param next
 * @returns next()
 */
function checkReqsIntensivity (req, res, next) {
  // Do not check rate limits in dev environment, this is for beeing able to run tests! :)
  if (env === 'development') {
    return next()
  }

  var user_id = req.user && req.user.id ? req.user.id : 0
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress

  var minute = parseInt(Date.now() / 1000 / 60, 10)
  var requestKey = 'RateLimitter:' + (user_id || ip) + ':' + req.method + ':' + minute

  function errHandler (err) {
    console.log('RateLimitter Error')
    console.log(err)
    return next()
  }

  function processResponse (info) {
    if (info.too_often) {
      console.log('Please slow down, you post very frequently.')
      return res.sendStatus(429)
    } else {
      // save reqnum into redis
      redis.setex(requestKey, 1 * 60, ++info.reqnum, function (err) {
        if (err) {
          return errHandler(err)
        }
        return next()
      })
    }
  }

  redis.get(requestKey, function (err, reqnum) {
    if (err) {
      return errHandler(err)
    }

    var too_often = false
    if (reqnum !== null) {
      if (reqnum > options.maxUserRequestLimitPerMinute[req.method]) {
        too_often = true
      }
    }
    processResponse({too_often: too_often, reqnum: reqnum || 0})
  })
}

/**
 * Express middlewear to be called on every request!
 * @param req
 * @param res
 * @param next
 * @returns next()
 */
function checker (req, res, next) {
  // Rate limitter per USER
  checkReqsIntensivity(req, res, next)

  // calculate current rps
  if (__req_num_local === options.calcRpsEachNseconds) {
    // calculate requests per second
    end = new Date()
    __current_rps = (__req_num_local / ((end - begin) / 1000)).toFixed(0)

    // print statistics
    console.log('\n\nIncoming Connections: ' + __req_num)
    console.log('Requests per second: ' + __current_rps + '   Time: ' + ((end - begin) / 1000).toFixed(3) + ', Requests: ' + __req_num_local + '\n')

    __req_num_local = 0
    begin = new Date()
  }

  __req_num++
  __req_num_local++
}

/**
 * Overwrites obj1's values with obj2's and adds obj2's if non existent in obj1
 * @param obj1
 * @param obj2
 * @returns obj3 a new object based on obj1 and obj2
 */
function mergeOptions (obj1, obj2) {
  var obj3 = {}
  for (var attrname in obj1) { obj3[attrname] = obj1[attrname] }
  for (var attrname2 in obj2) { obj3[attrname2] = obj2[attrname2] }
  return obj3
}

module.exports = function (redisClient, op) {
  if (op) {
    options = mergeOptions(options, op)
  }

  redis = redisClient
  return checker
}
