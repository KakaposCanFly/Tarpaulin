const router = require('express').Router();
const { getDb } = require("../lib/mongo")
const { ObjectId } = require("mongodb");
const { validateAgainstSchema } = require('../lib/validation');
const {
    insertNewAssignment,
    getAssignmentById,
    AssignmentSchema
} = require('../models/assignment');

exports.router = router;

router.post('/', async function (req, res, next) {
    console.log("body: ", req.body)
    console.log("schema: ", AssignmentSchema)
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