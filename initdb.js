const { connectToDb, getDb } = require("./lib/mongo.js")
const coursesData = require('./data/courses')
const { bulkInsertNewCourses } = require("./models/course.js")

/*
 * Insert initial courses data into database.
 */
connectToDb(async function (){

    const ids = await bulkInsertNewCourses(coursesData)
    console.log("inserted courses: ", ids)

})
