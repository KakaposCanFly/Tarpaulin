const { ObjectId } = require('mongodb')

const { getDbReference } = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')

const AssignmentSchema = {
    courseId = { required: true },
    title = { required: true },
    points = { required: true },
    dueDate = { required: true }
}
exports.AssignmentSchema = AssignmentSchema

exports.insertNewAssignment = async function (assignment) {
    assignment = extractValidFields(assignment, AssignmentSchema)
    const db = getDb()
    const collection = db.collection("assignments")
    const result = await collection.insertOne(assignment)
    return result.insertedId
}

exports.getAssignmentById = async function (id) {
}