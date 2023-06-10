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
    assignment.courseId = new ObjectId(assignment.courseId)
    const result = await collection.insertOne(assignment)
    return result.insertedId
}

exports.getAssignmentById = async function (id) {
    const db = getDb()
    const collection = db.collection("assignments")
    const result = await collection.find({ _id: new ObjectId(id) }).toArray()
    return result[0]
}

exports.updateAssignmentById = async function (id, assignment) {
    assignment = extractValidFields(assignment, AssignmentSchema)
    const db = getDb()
    const collection = db.collection("assignments")
    assignment.courseId = new ObjectId(assignment.courseId)
    const result = await collection.replaceOne(
        { _id: new ObjectId(id) },
        assignment
    )
    return result.matchedCount > 0
}

exports.deleteAssignmentById = async function (id) {
    const db = getDb()
    const collection = db.collection("assignments")
    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    return result.deletedCount > 0
}

async function bulkInsertNewAssignments(assignments, courseId) {
    const assignmentsToInsert = assignments.map(function (assignments) {
        return extractValidFields(assignments, AssignmentSchema)
    })
    for (var i = 0; i < assignmentsToInsert.length; i++) {
        assignmentsToInsert[i].courseId = new ObjectId(courseId)
    }
    const db = getDb()
    const collection = db.collection('assignments')
    const result = await collection.insertMany(assignmentsToInsert)
    return result.insertedIds
}
exports.bulkInsertNewAssignments = bulkInsertNewAssignments

//exports.getAssignmentsPage = async function (pageNum) {
//    const db = getDb()
//    const collection = db.collection("assignments")
//    const count = await collection.countDocuments()


//    const pageSize = 10
//    const lastPage = Math.ceil(count / pageSize)
//    pageNum = pageNum < 1 ? 1 : pageNum
//    pageNum = pageNum > lastPage ? lastPage : pageNum
//    const offset = (pageNum - 1) * pageSize

//    const results = await collection.find({})
//        .sort({ _id: 1 })
//        .skip(offset)
//        .limit(pageSize)
//        .toArray()

//    return {
//        assignments: results,
//        page: pageNum,
//        totalPages: lastPage,
//        pageSize: pageSize,
//        count: count
//    }
//}
