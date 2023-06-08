const { connectToDb, getDb } = require("./lib/mongo.js")
const { bulkInsertNewCourses } = require("./models/course.js")
const coursesData = require('./data/courses')
const assignmentsData = require('./data/assignments')
const studentsData = require('./data/students')
const { ObjectId } = require('mongodb')

/*
 * Insert initial courses data into database.
 */
connectToDb(async function (){

    // const ids = await bulkInsertNewCourses(coursesData)
    // console.log("inserted courses: ", ids)
    const db = getDb()
    var collection = db.collection('assignments') 

    for (var i = 0; i < assignmentsData.length; i++){
        assignmentsData[i].courseId = new ObjectId(assignmentsData[i].courseId)
    }

    var ids = await collection.insertMany(assignmentsData)
    console.log("inserted assignment ids:", ids)

    collection = db.collection('students')
    ids = await collection.insertMany(studentsData)
    console.log("inserted students ids:", ids)

})
