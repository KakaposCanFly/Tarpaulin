const router = require('express').Router()
const { ObjectId } = require('mongodb')
const { getDb } = require("../lib/mongo")

const {
    UserSchema,
    insertNewUser,
    getUserByEmail,
    getUserById,
    validateUser
} = require('../models/user')
const { generateAuthToken, requireAuthentication } = require("../lib/auth")

// const {  } = require('../models/course')

exports.router = router;

async function checkAdmin(id) {
    const db = getDb()
    const users = db.collection("users")
    const possibleAdmin = await getUserById(id)
    if (possibleAdmin.admin === true) {
        return true
    } else {
        return false
    }
}

/**
 * Get all users
 */
router.get('/', async function (req.res) {
    const db = getDb()
    const collection = db.collection("users")
    const usersPage = await collection.find({}).toArray()
    res.status(200).json({usersPage})
})

/**
 * Create a new user
 */
router.post('/', async function (req, res) {
    try {
        const id = await insertNewUser(req.body);
        console.log(id);
        if (id) {
            res.status(201).send({_id: id})
        } else {
            res.status(400).send({
                error: "No."
            })
        }
    } catch (err) {
        console.log("Post Error: ", err)
    }
})

router.post('/login', async function (req, res, next) {
    if (req.body && req.body.email && req.body.password) {
        try {
            const authenticated = await validateUser(
                req.body.email,
                req.body.password
            )
            if (authenticated) {
                const user = await getUserByEmail(req.body.email, true)
                const token = generateAuthToken(req.body.email, user.role)
                res.status(200).send({
                    token: token
                })
            } else {
                res.status(401).send({
                    error: "Invalid authentication credentials"
                })
            }
        } catch (e) {
            next(e)
        }
    } else {
        res.status(400).send({
            error: "Request body requires `id` and `password`"
        })
    }
})

router.get('/:id', requireAuthentication, async function (req, res, next) {
    // admin
    // instructor: response is list of ids of courses the user teaches
    // student: response is list of id of courses the user is enrolled in

    try {
        const user = await getUserById(req.params.id)
        let courses
        if (user.email === req.user.email) {
            if (req.user.role == 'instructor!') {
                console.log("Welcome instructor!")
                console.log("== req.params.id", req.params.id)
                courses = await getCoursesByInstructorId(req.params.id)
            }
            if (req.user.role == 'student') {
                console.log("Welcome student!")
                console.log("== req.params.id", req.params.id)
                courses = await getCoursesByStudentId(req.params.id)
            }

            console.log("user: ", user)
            console.log("courses: ", courses)
            res.status(200).json({
                user: user,
                courses: courses
            })
        } else {
            res.status(403).send({
                err: "Unauthorized to access the specified resource."
            })
        }
    } catch (e) {
        next(e)
    }
})

router.get('/:id/courses', requireAuthentication, async function(req, res, next) {

})