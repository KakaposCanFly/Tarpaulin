const { connectToDb, getDb } = require("./mongo.js")
const coursesData = require('../data/courses')


connectToDb(async function (){
    const db = getDb()
    var collection = db.collection('courses')
    await collection.insertMany(coursesData)
})
