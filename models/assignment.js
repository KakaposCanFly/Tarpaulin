const { ObjectId } = require('mongodb')

const { getDb } = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')

const AssignmentSchema = {
    courseId: { required: true },
    title: { required: true },
    points: { required: true },
    due: { required: true }
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
const db = getDb()
    const collection = db.collection("assignments")
    const result = await collection.find({ _id: new ObjectId(id) }).toArray()
    return result[0]
}