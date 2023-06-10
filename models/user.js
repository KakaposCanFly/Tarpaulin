const { DataTypes } = require('sequelize')
const { Course } = require('./course.js')

const ObjectId = require('mongodb')
const bcrypt = require('bcryptjs')

const { getDb } = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation.js')

/**
 * Schema for a User
 */
const UserSchema = {
    id: { required: false },
    name: { required: true },
    email: { required: true },
    password: { required: true },
    role: { enum: ['admin', 'instructor', 'student'], default: 'student' },
    admin: { required: false }
}
exports.UserSchema = UserSchema

/*
 * Insert a new User into the DB
 */
exports.insertNewUser = async function (user) {
    try {
        const userInsert = extractValidFields(user, UserSchema)
        const hash = await bcrypt.hash(user.password, 8);
        console.log(hash)
        user.password = hash;
        console.log(" -- user to insert: ", userInsert)

        const db = getDb()
        const collection = db.collection('users')
        const result = await collection.insertOne(userInsert)
        return result.id
    } catch (err) {
        console.log("error in insertNewUser", err)
        return null
    }
}

/*
 * Fetch a user from the DB based on user ID.
 */
async function getUserById (id, includePassword) {
    const db = getDb()
    const collection = db.collection('users')
    if (!ObjectId.isValid(id)) {
        return null
    } else {
        //project allows you to restrict fields (in this case, the password)
        const results = await collection
            .find({ _id: new ObjectId(id) })
            .project(includePassword ? {} : { password: 0 })
            .toArray()
        console.log("found user: ", results[0])
        return results[0]
    }
}

exports.getUserById = getUserById

/*
 * Fetch a user from the DB based on user ID.
 */
async function getUserByEmail (email, includePassword) {
    const db = getDb()
    const collection = db.collection('users')
    if (!ObjectId.isValid(email)) {
        return null
    } else {
        //project allows you to restrict fields (in this case, the password)
        const results = await collection
            .find({ email: new ObjectId(email) })
            .project(includePassword ? {} : { password: 0 })
            .toArray()
        console.log("found user: ", results[0])
        return results[0]
    }
}

exports.getUserByEmail = getUserByEmail

exports.validateUser = async function (email, password) {
    const user = await getUserById(email, true)
    //once we know a user exists, compare plaintext and hashed + salted password 
    //returns true -> if passwords match 
    //returns false -> if passwords don't 
    //bcrypt will hash the password and compare it with the stored password 
    return user && await bcrypt.compare(password, user.password)  
}