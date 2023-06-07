const { MongoClient } = require("mongodb")

const mongoHost = process.env.MONGO_HOST || "localhost"
const mongoPort = process.env.MONGO_PORT || 27017
const mongoUser = process.env.MONGO_USER
const mongoPassword = process.env.MONGO_PASSWORD
const mongoAuthDbName = process.env.MONGO_AUTH_DB_NAME

const mongoUrl = `mongodb://${mongoUser}:${mongoPassword}@${mongoHost}:${mongoPort}/${mongoAuthDbName}`

let db = null
exports.connectToDb = function (callback) {
    MongoClient.connect(mongoUrl).then(function (client) {
        db = client.db()
        callback()
    })
}

exports.getDb = function () {
    return db
}