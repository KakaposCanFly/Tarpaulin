const { ObjectId } = require('mongodb')

const { getDb } = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')

const assignmentSchema = {
    courseId: {required: true}, 
    title: {required: true},
    points: {required: true},
    due: {required: true}
}

exports.assignmentSchema = assignmentSchema


async function bulkInsertNewAssignments(assignments) {
    const assignmentsToInsert = assignments.map(function (assignments) {
        return extractValidFields(assignments, assignmentSchema)
    })
    const db = getDb()
    const collection = db.collection('assignments')
    const result = await collection.insertMany(assignmentsToInsert)
    return result.insertedIds
}
exports.bulkInsertNewAssignments = bulkInsertNewAssignments