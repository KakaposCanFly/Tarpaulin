/*
**  
**  Note: These are STILL temporary endpoints for testing. 
**        The only permanent endpoint is `update`
*/


const router = require('express').Router();
const { getDb } = require("../lib/mongo")
const { ObjectId } = require("mongodb")
const { validateAgainstSchema } = require('../lib/validation');
const { 
  getSubmissionById,
  SubmissionUpdateSchema,
  updateSubmissionById,
  deleteSubmissionById,
  getDownloadStreamByFilename
} = require('../models/submission');
const {
    getAssignmentById,
} = require('../models/assignment');

const { requireAuthentication } = require("../lib/auth")

exports.router = router;

/*
 * Temporary endpoint to retreive ("download") files
 */
// router.get('/files/:filename', function (req, res, next) {
//   getDownloadStreamByFilename(req.params.filename)
//       .on("error", function (err) {
//           if (err.code === "ENOENT") {
//               next()
//           } else {
//               next(err)
//           }
//       })
//       .on("file", function (file) {
//           res.status(200).type(file.metadata.contentType)
//       })
//       .pipe(res)
// })

/*
 * Route to return a list of all submissions.
 */
router.get('/', async function (req, res) {
    const timestamp = new Date().toISOString()
    console.log("Timestampe: ", timestamp)
    const db = getDb()
    const collection = db.collection("submissions")  
    try {
        const submissions = await collection.find({}).toArray()
        res.status(200).send({
        submissions: submissions,
        })
    } catch (err) {
        next(err)
    }
  
});

// --> admin or instructor authentication (adding grades)
router.patch('/:id', requireAuthentication, async function (req, res, next) {
    const assignment = getAssignmentById(req.body.assignmentId)
    const course = collection.find({ _id: new ObjectId(assignment.courseId) })
    const instructorId = course.instructorId

    if (req.user.role === "admin" || (req.user.role === "instructor" && instructorId === req.user.id)) {
        if (validateAgainstSchema(req.body, SubmissionUpdateSchema)) {
            try {
                const submission = await getSubmissionById(req.params.id)
                if (submission) {
                    await updateSubmissionById(req.params.id, req.body)
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
                error: "Request body is not a valid submission object"
            })
        }
    } else {
        res.status(403).status.json({ error: "Unauthorized to add grades."})
    }
})

/*
* Route to delete a submission.
*/
router.delete('/:id', async function (req, res, next) {
  try {
      const submission = await getSubmissionById(req.params.id)
      if (submission) {
          await deleteSubmissionById(req.params.id)
          res.status(204).end()
      }
      else {
          next()
      }
  }catch (err) {
      next(err)
  }
})