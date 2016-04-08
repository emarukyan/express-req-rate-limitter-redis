# Express Request Rate Limitter

Node.js ExpressJs configurable requests rate limitter middlewear on Redis.
This is very handy for API's. This middlewear calculates requests per minue and gives Rate-Limit headers for each type of request method: GET, POST, PUT, DELETE
If limit is reached, it will send HTTP 429 Too May requests response (http://httpstatusdogs.com/429-too-many-requests)
Rate limit applies to req.user if any, or to IP as a fallback.

  - X-Rate-Limit-Limit: Maximum limit for given method
  - X-Rate-Limit-Remaining: Remaining requests count
  - X-Rate-Limit-Reset: When this limit will be reset, timestamp unix epoch

## Installation
```sh
cd node_modules/
git clone https://github.com/emarukyan/express-req-rate-limitter-redis
```

Create Redis client somehow
```javascript
var redis_client = redis.createClient({
    host: REDIS_HOST,
    port: REDIS_PORT
  })
```

In app.js file of express application, write require module
```javascript
var requestLimitter = require('express-req-rate-limitter-redis')(redis_client)
```

Then after app.set functions write this line
```javascript
app.use(requestLimitter)
```
That's it!





# Options
You can configure default limits, by profiding second parameter in this part
```sh
.. require('express-req-rate-limitter-redis')(redis_client, options)
```
options object should contain these fields.
* calcRpsEachNseconds: 300,
* TimeFrameInMinutes: 1,
*  maxUserRequestLimitPerTimeFrame: {
    *  POST: 50,
    *  GET: 300,
    *  PUT: 50,
    *  DELETE: 50
    *  }

### calcRpsEachNseconds
> this parameter controls how often should RPS be calculated and printed to console log. By Default after each 300 requests will print current RPS load of server.

### TimeFrameInMinutes
> This parameter controls limit time-frame. By default limits apply to 1 minute. If you want to extend limit window to 15 minues, just set this to 15.

### maxUserRequestLimitPerTimeFrame
> This object contains limits for each type of http request. Adjust it upon your needs.

License
----

MIT

**Free Software, Hell Yeah!**
