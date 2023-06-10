const router = require('express').Router()

const {
    UserSchema,
    insertNewUser,
    getUserByEmail,
    validateUser
} = require('../models/user')
const { generateAuthToken, requireAuthentication } = require("../lib/auth")

// const {  } = require('../models/course')

exports.router = router;

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

router.get('/', async function (req.res) {
    const db = getDb()
    const collection = db.collection("users")
    const usersPage = await collection.find({}).toArray()
    res.status(200).json({usersPage})
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
                const token 
            }
        }
    }
})

// admin


// instructor


// student

