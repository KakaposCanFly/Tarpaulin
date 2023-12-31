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
const { generateAuthToken, requireAuthentication, getEmail } = require("../lib/auth")

const { getCoursesByInstructorId, getCoursesByStudentId } = require('../models/course')

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
router.get('/', async function (req, res) {
    const db = getDb()
    const collection = db.collection("users")
    const usersPage = await collection.find({}).toArray()
    res.status(200).json({usersPage})
})

/**
 * Create a new user
 */
router.post('/', getEmail, async function (req, res) {
    if (req.body.role == 'instructor' || req.body.role == 'admin') {
        if (req.user && req.user.role != 'admin' || req.user == null) {
            return res.status(403).send({
                error: 'Unauthorized to create new user that is an instructor or admin'
            })
        }
    }
    try {
        const id = await insertNewUser(req.body);
        // console.log("id:", id);
        if (id) {
            res.status(201).send({_id: id})
        } else {
            res.status(400).send({
                error: "Not a valid user."
            })
        }
    } catch (err) {
        console.log("Cannot POST: ", err)
        res.status(500).send({error: 'Internal Server Error.'})
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
                const token = generateAuthToken(user._id, req.body.email, user.role)
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

            // console.log("user: ", user)
            res.status(200).json(
                user
            )
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
    const userid = req.params.userid
    const db = getDb()
    const collection = db.collection("courses")
    const userCollection = db.collection("users")
    const admin = await checkAdmin(req.user)

    if (req.user === req.params.userid || admin === true) {
        try {
            const user = await userCollection.find({ _id: new ObjectId(userid)}).toArray()
            const userCourses = await collection.find({ownerId: user[0].id}).toArray()

            if (userCourses.length !== 0) {
                res.status(200).json({
                    courses: userCourses
                })
            } else {
                next()
            }
        } catch (e) {
            next(e)
        }
    }
})

router.get('/:id/assignments', requireAuthentication, async function(req, res, next) {
    const admin = await checkAdmin(req.user.userid)
    
    if (req.user === req.params.userid || admin) {
        const userid = req.params.userid
        const db = getDb()
        const collection = db.collection("photos")
        const userCollection = db.collection("users")

        const user = await userCollection.find({_id: new ObjectId(userid)}).toArray()
        const userPhotos = await collection.find({userId: user[0].id}).toArray()

        if(userPhotos.length !== 0){
            res.status(200).json({
                photos: userPhotos
            })
        } else {
           next()
        }
    } else {
        res.status(403).send({ error: "Cannot access specified resource."})
    }
})

router.delete('/:id', async function (req, res, next) {
    const db = getDb()
    const collection = db.collection("users")
    const userid = req.params.userid

    const deleteStatus = await collection.deleteOne({_id: new ObjectId(userid)})
    if (deleteStatus) {
        res.status(204).end()
    } else {
        next()
    }
})