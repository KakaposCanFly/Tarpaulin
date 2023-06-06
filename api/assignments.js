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

//router.get('/', async function (req, res, next) {
//    try {
//        const assignmentPage = await getAssignmentsPage(req.query.page || 1)
//        assignmentPage.links = {}
//        if (assignmentPage.page < assignmentPage.totalPages) {
//            assignmentPage.links.nextPage = `/assignments?page=${assignmentPage.page + 1}`
//            assignmentPage.links.lastPage = `/assignments?page=${assignmentPage.totalPages}`
//        }
//        if (assignmentPage.page > 1) {
//            assignmentPage.links.prevPage = `/assignments?page=${assignmentPage.page - 1}`
//            assignmentPage.links.firstPage = '/assignments?page=1'
//        }
//        res.status(200).json(assignmentPage)
//    } catch (err) {
//        next(err)
//    }
//})

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