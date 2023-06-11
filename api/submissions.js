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
 * Route to return a list of all submissions. --> instructor id matching assignment course id instructor id auth
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

// --> instructor id matching assignment course id instructor id auth
router.patch('/:id', async function (req, res, next) {
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