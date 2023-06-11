const express = require('express');
const redis = require('redis');

const api = require('./api');
const { connectToDb } = require("./lib/mongo")

const app = express();
const port = process.env.PORT || 8080;

const redisHost = process.env.REDIS_HOST || 'localhost'
const redisPort = process.env.REDIS_PORT || 6379
const redisClient = redis.createClient({
    url: `redis://${redisHost}:${redisPort}`
})

const rateLimitWindowMillis = 60000
const rateLimitMaxRequests = 10
const rateLimitRefreshRate = rateLimitMaxRequests / rateLimitWindowMillis

async function rateLimit(req, res, next) {
    let tokenBucket
    try {
        tokenBucket = await redisClient.hGetAll(req.ip)
    } catch (err) {
        next()
        return
    }
    tokenBucket = {
        tokens: parseFloat(tokenBucket.tokens) || rateLimitMaxRequests,
        last: parseFloat(tokenBucket.last) || Date.now()
    }
    const timeStamp = Date.now()
    const ellapsedTime = timeStamp - tokenBucket.last
    tokenBucket.tokens += ellapsedTime * rateLimitRefreshRate
    tokenBucket.tokens = Math.min(tokenBucket.tokens, rateLimitMaxRequests)
    tokenBucket.last = timeStamp

    if (tokenBucket.tokens >= 1) {
        tokenBucket.tokens -= 1
        await redisClient.hSet(req.ip, [
            ["tokens", tokenBucket.tokens],
            ["last", tokenBucket.last]
        ])
        next()
    } else {
        await redisClient.hSet(req.ip, [
            ["tokens", tokenBucket.tokens],
            ["last", tokenBucket.last]
        ])
        res.status(429).json({
            error: "Too many requests per minute"
        })
    }

}
app.use(rateLimit)

app.use(express.json());
app.use(express.static('public'));

/*
 * All routes for the API are written in modules in the api/ directory.  The
 * top-level router lives in api/index.js.  That's what we include here, and
 * it provides all of the routes.
 */
app.use('/', api);

app.use('*', function (req, res, next) {
  res.status(404).json({
    error: "Requested resource " + req.originalUrl + " does not exist"
  });
});

/*
 * This route will catch any errors thrown from our API endpoints and return
 * a response with a 500 status to the client.
 */
app.use('*', function (err, req, res, next) {
  console.error("== Error:", err)
  res.status(500).send({
      err: "Server error.  Please try again later."
  })
})

connectToDb(function () {
    redisClient.connect().then(function (){
        app.listen(port, function() {
            console.log("== Server is running on port", port);
         });
    })
})

