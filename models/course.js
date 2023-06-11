const { ObjectId } = require('mongodb')

const { getDb } = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')

const courseSchema = {
    subject: {required: true},
    number: {required: true},
    title: {required: true},
    term: {required: true},
    instructorId: {required: true},
    students: {required: true},
    assignments: {required: true}
}

exports.courseSchema = courseSchema

async function getAssignmentsByCourseId(id) {
    const course = await Course.findById(id);
    if (!course) {
        return null
    }
    const result = await UserSchema.find({ _id: {$in: course.assignments}})
    return result
}
exports.getAssignmentsByCourseId = getAssignmentsByCourseId

async function getCoursesByStudentId(id) {
    id = new ObjectId(id);
    try {
        const courses = await Course.find({ students: id })
        console.log("== courses:", courses)
        return courses
    } catch (err) {
        console.log(`Error getting courses from student id: ${err}`)
        return null;
    }
}
exports.getCoursesByStudentId = getCoursesByStudentId

async function getCoursesByInstructorId(id) {
    id = new ObjectId(id);
    try {
        const courses = await Course.find({ instructorId: id})
        console.log("== courses:", courses);
        return courses;
    } catch (err) {
        console.log(`Error getting courses from instructor id: ${err}`)
        return null;
    }
}
exports.getCoursesByInstructorId = getCoursesByInstructorId

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