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

const { requireAuthentication } = require("../lib/auth")
const multer = require("multer")
const crypto = require("node:crypto");
const { getCoursesByStudentId } = require('../models/course');

exports.router = router;

// auth --> admin or instructor id needs to match course id
router.post('/', async function (req, res, next) {
    if (req.user.role === "admin" || (req.user.role === "instructor" && req.user.id.toString() === course.instructorId.toString() && req.body.courseId.toString() === course.instructorId.toString())) {
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
    } else {
        res.status(403).json({ error: "Only instructor teaching the course or admin can post an assignment"})
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
    if (req.user.role === "admin" || (req.user.role === "instructor" && req.user.id.toString() === course.instructorId.toString() && req.body.courseId.toString() === course.instructorId.toString())) {
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
    } else {
        res.status(403).json({ error: "Only instructor teaching the course or admin can update the assignment"})
    }
})

// auth
router.delete('/:id', async function (req, res, next) {
    if (req.user.role === "admin" || (req.user.role === "instructor" && req.user.id.toString() === course.instructorId.toString() && req.body.courseId.toString() === course.instructorId.toString())) {
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
    } else {
        res.status(403).json({ error: "Only instructor teaching the course or admin can delete the assignment"})
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
router.post('/:id/submissions', requireAuthentication, upload.single("file"), async function (req, res, next) {
    // console.log("body: ", req.body)
    // console.log("id: ", req.params.id)
    // console.log("schema: ", SubmissionSchema)
    if (req.user.role !== "student") {
        return res.status(403).json({ error: "Only students can submit assignments."})
    }
    if (req.body && req.body.studentId && req.params.id) {
        const courseId = req.body.courseId
        const coursesEnrolled = await getCoursesByStudentId(req.body.studentId)
        // check user is in course
        console.log("Courses enrolled array: ", coursesEnrolled)
        const check = coursesEnrolled.some(course => course._id === courseId)
        // need to check if assignment is in the course?
        if (check) {
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
        } else {
            return res.status(403).json({error: "Student is not enrolled in the course."})
        }
    } else {
        res.status(400).json({error: "Request body is not a valid submission"})
    }
})

// Get all submissions for specified assignment auth 
router.get('/:id/submissions', requireAuthentication, async function (req, res, next) {
    const db = getDb()
    const submissionCollection = db.collection("submissions")
    const coursesCollection = db.collection("courses")
    const assignment = await getAssignmentById(req.params.id)
    console.log("Assignment: ", assignment)
    const course = await coursesCollection.find({ _id: new ObjectId(assignment.courseId) })
    const instructorId = course.instructorId

    if (req.user.role === "admin" || (req.user.role === "instructor" && instructorId === req.user.id)) {
        
        try {
            const submissions = await submissionCollection.find({ assignmentId: new ObjectId(req.params.id) }).toArray()        
            if (submissions) {
                res.status(200).json(submissions)
            }
            else {
                next()
            }
        } catch (err) {
            next(err)
        }
    } else {
        res.status(403).json({ error: "Unauthorized access to assignment submissions."})
    }
    
})