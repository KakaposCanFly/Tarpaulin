const { ObjectId } = require('mongodb')

const { getDb } = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')

const courseSchema = {
    subject: {required: true},
    number: {required: true},
    title: {required: true},
    term: {required: true},
    instructorId: {required: true}
}

exports.courseSchema = courseSchema


async function bulkInsertNewCourses(courses) {
    const coursesToInsert = courses.map(function (courses) {
        return extractValidFields(courses, courseSchema)
    })
    const db = getDb()
    const collection = db.collection('courses')
    const result = await collection.insertMany(coursesToInsert)
    return result.insertedIds
}
exports.bulkInsertNewCourses = bulkInsertNewCourses