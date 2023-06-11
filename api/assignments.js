const router = require('express').Router();
const { getDb } = require("../lib/mongo")
const { ObjectId } = require("mongodb");
const { validateAgainstSchema } = require('../lib/validation');
const {
    insertNewAssignment,
    getAssignmentById,
    AssignmentSchema,
    getAssignmentsPage,
    updateAssignmentById,
    deleteAssignmentById
} = require('../models/assignment');
const { 
    insertNewSubmission,
    SubmissionSchema,
    saveFile
} = require('../models/submission');
const multer = require("multer")
const crypto = require("node:crypto")

exports.router = router;

// auth
router.post('/', async function (req, res, next) {
    // console.log("body: ", req.body)
    // console.log("schema: ", AssignmentSchema)
    if (validateAgainstSchema(req.body, AssignmentSchema)) {
        try {
            const resultId = await insertNewAssignment(req.body)
            res.status(201).json({
                id: resultId,
            });
        } catch (err) {
            next(err)
        }
    }
    else {
        res.status(400).json({
            error: "Request body is not a valid assignment"
        })
    }
})

router.get('/', async function (req, res, next) {
   try {
       const assignmentPage = await getAssignmentsPage(req.query.page || 1)
       assignmentPage.links = {}
       if (assignmentPage.page < assignmentPage.totalPages) {
           assignmentPage.links.nextPage = `/assignments?page=${assignmentPage.page + 1}`
           assignmentPage.links.lastPage = `/assignments?page=${assignmentPage.totalPages}`
       }
       if (assignmentPage.page > 1) {
           assignmentPage.links.prevPage = `/assignments?page=${assignmentPage.page - 1}`
           assignmentPage.links.firstPage = '/assignments?page=1'
       }
       res.status(200).json(assignmentPage)
   } catch (err) {
       next(err)
   }
})

router.get('/:id', async function (req, res, next) {
    try {
        const assignment = await getAssignmentById(req.params.id)
        if (assignment) {
            res.status(200).json(assignment)
        }
        else {
            next()
        }
    } catch (err) {
        next(err)
    }
})

// auth
router.patch('/:id', async function (req, res, next) {
    if (validateAgainstSchema(req.body, AssignmentSchema)) {
        try {
            const assignment = await getAssignmentById(req.params.id)
            if (assignment) {
                await updateAssignmentById(req.params.id, req.body)
                res.status(200).end()
            }
            else {
                next()
            }
        } catch (err) {
            next(err)
        }
    }
    else {
        res.status(400).json({
            error: "Request body is not a valid assignment object"
        })
    }
})

// auth
router.delete('/:id', async function (req, res, next) {
    try {
        const assignment = await getAssignmentById(req.params.id)
        if (assignment) {
            await deleteAssignmentById(req.params.id)
            res.status(204).end()
        }
        else {
            next()
        }
    }catch (err) {
        next(err)
    }
})


/*
**  Submissions  
*/

//Temporary file types for testing
const fileTypes = {
    "image/png": "png",
    "image/jpeg": "jpeg",
}

const upload = multer({ 
    storage: multer.diskStorage({
        destination: `${__dirname}/../uploads`,
        filename: (req, file, callback) => {    // called whenever a file is uploaded
            const filename = crypto.pseudoRandomBytes(16).toString("hex")
            const extension = fileTypes[file.mimetype]
            callback(null, `${filename}.${extension}`)
            //TODO: Handling a wider variety of file extensions without VScode exploding (or just ignore it lmao)
        }
    }),
 })

// Post submission to specified assignment --> student auth enrolled in the course
router.post('/:id/submissions', upload.single("file"), async function (req, res, next) {
    // console.log("body: ", req.body)
    // console.log("id: ", req.params.id)
    // console.log("schema: ", SubmissionSchema)
    if (req.file && validateAgainstSchema(req.body, SubmissionSchema)) {
        if (req.body.grade){
            res.status(400).send({
                msg: "Cannot add grade in initial submission post"
            })
        }
        const reqBody = {
            assignmentId: new ObjectId(req.body.assignmentId),
            studentId: new ObjectId(req.body.studentId)
        }
        try {
            const submissionId = await insertNewSubmission(reqBody)
            const file = {
                contentType: req.file.mimetype,
                filename: req.file.filename,
                path: req.file.path,
                submissionId: new ObjectId(req.body.submissionId)
            }
            //Dev Note: May want to nest a try/catch block for this
            const fileId = await saveFile(file)

            //Insert submissionId into submission list in assignment object
            const db = getDb()
            const collection = db.collection("assignments")

            const updateStatus = await collection.updateOne({ _id: new ObjectId(req.params.id)}, {$push: {submissions: submissionId}})
            
            res.status(201).json({
                id: submissionId,
            });
        } catch (err) {
            next(err)
        }
    }
    else {
        res.status(400).json({
            error: "Request body is not a valid submission"
        })
    }
})

// Get all submissions for specified assignment auth 
router.get('/:id/submissions', async function (req, res, next) {
    const db = getDb()
    const collection = db.collection("submissions")
    try {
        const submissions = await collection.find({ assignmentId: new ObjectId(req.params.id) }).toArray()        
        if (submissions) {
            res.status(200).json(submissions)
        }
        else {
            next()
        }
    } catch (err) {
        next(err)
    }
})