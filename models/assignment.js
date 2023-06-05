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