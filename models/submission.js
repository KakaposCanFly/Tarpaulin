const { ObjectId, GridFSBucket } = require('mongodb')
const fs = require("fs")

const { getDb } = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')

const SubmissionSchema = {
    assignmentId: {required: true}, 
    studentId: {required: true}, 
    timestamp: {required: false},
    grade: {required: false}
    //Dev note: Might need to be more specific with the requirements for the grade field
}
const SubmissionUpdateSchema = {
    assignmentId: {required: true}, 
    studentId: {required: true}, 
    timestamp: {required: true},
    grade: {required: true}
}

exports.SubmissionSchema = SubmissionSchema
exports.SubmissionUpdateSchema = SubmissionUpdateSchema

exports.saveFile = async function (file) {
    return new Promise(function (resolve, reject) {
        const db = getDb()
        const bucket = new GridFSBucket(db, { bucketName: "files" })
        const metadata = {
            contentType: file.contentType,
            submissionId: new ObjectId(file.submissionId)
        }
        const uploadStream = bucket.openUploadStream(   //sending bytes into mongodb
            file.filename,
            { metadata: metadata }
        )
        fs.createReadStream(file.path).pipe(uploadStream) //reading bytes from disc
            .on("error", function (err) {
                reject(err)
            })
            .on("finish", function (result) {
                console.log("== write file success, result: ", result)
                resolve(result._id)
            })
    })
}

// exports.getDownloadStreamByFilename = function (filename) {
//     const db = getDb()
//     const bucket = new GridFSBucket(db, { bucketName: "files" })
//     return bucket.openDownloadStreamByName(filename)
// }

exports.insertNewSubmission = async function (submission) {
    const timestamp = new Date().toISOString()
    const submissionData = {
        ...submission,
        timestamp: timestamp
    }
    console.log("submissionData:", submissionData)
    submission = extractValidFields(submissionData, SubmissionSchema)
    const db = getDb()
    const collection = db.collection("submissions")
    const result = await collection.insertOne(submission)
    return result.insertedId
}

exports.getSubmissionById = async function (id) {
    const db = getDb()
    const collection = db.collection("submissions")
    const result = await collection.find({ _id: new ObjectId(id) }).toArray()
    return result[0]
}

exports.updateSubmissionById = async function (id, submission) {
    submission = extractValidFields(submission, SubmissionSchema)
    const db = getDb()
    const collection = db.collection("submissions")
    const result = await collection.replaceOne(
        { _id: new ObjectId(id) },
        submission
    )
    return result.matchedCount > 0
}

exports.deleteSubmissionById = async function (id) {
    const db = getDb()
    const collection = db.collection("submissions")
    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    return result.deletedCount > 0
}
