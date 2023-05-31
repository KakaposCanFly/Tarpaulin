/*
**  
**  Note: These are temporary endpoints for testing. 
**
*/


const router = require('express').Router();
const { getDb } = require("../lib/mongo")
const { ObjectId } = require("mongodb")

exports.router = router;

/*
 * Route to return a list of all submissions.
 */
router.get('/', async function (req, res) {

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
  
/*
* Route to create a new submission.
*/
router.post('/', async function (req, res, next) {

    const submission = req.body
    const db = getDb()
    const collection = db.collection("submissions")
    try {
        const result = await collection.insertOne(submission)
        console.log(submission)
        res.status(201).json({
        id: result.insertedId,
        });
    } catch (err) {
        next(err)
    }

});

/*
* Route to delete a submission.
*/
router.delete('/:submissionid', async function (req, res, next) {  
    async function deleteSubmissionById(id) {
      const db = getDb();
      const collection = db.collection("submissions");
      const result = await collection.deleteOne({
        _id: new ObjectId(id),
      });
      return result.deletedCount > 0;
    }
  
    const successfulDelete = await deleteSubmissionById(req.params.submissionid);
    if (successfulDelete) {
      res.status(204).end();
    } else {
      next();
    }
  });