const { connectToDb, getDb, closeDbConnection } = require('./lib/mongo')
const { bulkInsertNewCourses } = require("./models/course.js")
const {bulkInsertNewAssignments } = require("./models/assignment.js")
const coursesData = require('./data/courses')
const assignmentsData = require('./data/assignments')
const studentsData = require('./data/students')
const { ObjectId } = require('mongodb')

/*
 * Insert initial courses data into database.
 */
//connectToDb(async function (){

//    // const ids = await bulkInsertNewCourses(coursesData)
//    // console.log("inserted courses: ", ids)
//    const db = getDb()
//    var collection = db.collection('assignments')

//    for (var i = 0; i < assignmentsData.length; i++){
//        assignmentsData[i].courseId = new ObjectId(assignmentsData[i].courseId)
//    }

//    var ids = await collection.insertMany(assignmentsData)
//    console.log("inserted assignment ids:", ids)

//    collection = db.collection('students')
//    ids = await collection.insertMany(studentsData)
//    console.log("inserted students ids:", ids)

//})
connectToDb(async function () {
    const courseIds = await bulkInsertNewCourses(coursesData)
    console.log("inserted courses: ", courseIds)

    const firstCourseId = courseIds[0]
    console.log("firstCourseId:", firstCourseId)
    const assIds = await bulkInsertNewAssignments(assignmentsData, courseIds[0])
    console.log("inserted assignments: ", assIds)

    //const studentIds = await bulkInsertNewStudents(studentsData)
    //console.log("inserted students: ", studentIds)

    console.log("Information inserted into database, please close")
    //closeDbConnection(function () {
    //    console.log("== DB connection closed")
    //})
})
