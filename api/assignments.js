const router = require('express').Router();
const { getDb } = require("../lib/mongo")
const { ObjectId } = require("mongodb");
const { validateAgainstSchema } = require('../lib/validation');
const { insertNewAssignment, getAssignmentById } = require('../models/assignment');

exports.router = router;

router.post('/', async function (req, res, next) {
    if (validateAgainstSchema(req.body, AssignmentSchema)) {
        try {
            const id = await insertNewAssignment(req.body)
            res.status(201).json({
                id: result.insertedId,
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