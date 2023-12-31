const router = require('express').Router()
const { getDb } = require("../lib/mongo")
const { ObjectId } = require("mongodb")
const { courseSchema } = require("../models/course")
const { validateAgainstSchema } = require('../lib/validation')
const fs = require("fs")
const { requireAuthentication } = require("../lib/auth")

exports.router = router;

async function getCoursesPage(page, url, query){
    const db = getDb()
    const collection = db.collection('courses')

    const init_count = await collection.find(query).toArray()

    //count num of courses 
    const count = init_count.length
    const pageSize = 10
    const lastPage = Math.ceil(count / pageSize)
    page = page < 1 ? 1 : page 
    const offset = (page - 1) * pageSize

    const results = await collection.find(query).sort({_id: 1}).skip(offset).limit(pageSize).toArray()

   
    const links = {}
    //hateaos links for next pages 
    if (page < lastPage) {
        links.nextPage = `/courses?page=${page + 1}&${url}`
        links.lastPage = `/courses?page=${lastPage}&${url}`
    }
    if (page > 1) {
        links.prevPage = `/courses?page=${page - 1}&${url}`
        links.firstPage = `/courses?page=1&${url}`
    }

    return {
        courses: results, 
        page: page, 
        totalPages: lastPage, 
        pageSize: pageSize, 
        count: count, 
        links: links
    }

}

async function getCourseById(courseid) {
    const db = getDb()
    const collection = db.collection('courses')

    const course = await collection.find({_id: new ObjectId(courseid)}).toArray()

    const results = {
        course: course[0]
    }

    return results; 
}

async function getCourseRoster(courseid) {
    const db = getDb()
    const collection = db.collection('courses')

    const course = await collection.find({_id: new ObjectId(courseid)}).toArray()
    const studentIds = course[0].students 
    const studentCollection = db.collection('users')
    let roster = ""
   
    for(let i = 0; i < studentIds.length; i++){
        let student = await studentCollection.find({_id: new ObjectId(studentIds[i])}).toArray()
        roster = roster + `${studentIds[i]},${student[0].name},${student[0].email}\n`
    }

    return roster;
}

/*
 * Route to return list of courses 
 */
router.get('/', async function (req, res) {
    //questions: are all parameters (except for page required?)
    // parameters: page || 1, subject, number, term 
    let query = {}

    //build query 
    if(req.query.subject){
       query.subject = req.query.subject
    }
    if(req.query.number){
        query.number = req.query.number
    }
    if(req.query.term){
        query.term = req.query.term
    }

    const courses = await getCoursesPage(parseInt(req.query.page) || 1, "", query)
    res.status(200).json({courses})

})

/*
 * Route to create a new course, needs authentication. 
 */
router.post('/', requireAuthentication, async function (req, res, next){
    if (req.user.role === "admin") {
        if(validateAgainstSchema(req.body, courseSchema)){
            const db = getDb()
            const collection = db.collection("courses")
    
            //Dev note: Clean this up
            const courseBody = req.body
            courseBody.instructorId = new ObjectId(req.body.instructorId)

            const newCourse = await collection.insertOne(courseBody)

            res.status(201).json({
                id: newCourse.insertedId,
                links: {
                    course: `/courses/${newCourse.insertedId}`
                }
            })
        }
        else{
            res.status(400).json({error: "Request body is not a valid course object!"})
        }
    } else {
        res.status(403).json({ error: "Unauthorized to access specified resource"})
    }
})


/*
 * Route to fetch info about a specific course. 
 */
router.get('/:courseid', async function (req, res, next){

    if (ObjectId.isValid(req.params.courseid)) {
        const courseInfo = await getCourseById(req.params.courseid)
        if(!!courseInfo.course) {
            res.status(200).json(courseInfo)
        }
        else{
            next()
        }
    }
    else{
        next()
    }
})

/*
 * Route to update data for specific course, needs authentication.
 */
router.put('/:courseid', requireAuthentication, async function (req, res, next){
    const courseId = req.params.courseid
    if (ObjectId.isValid(courseId)) {
        const course = await getCourseById(courseId)
        if (req.user.role === "admin" || (req.user.role === "instructor" && req.user.id.toString() === course.course.instructorId.toString())) {
            if(validateAgainstSchema(req.body, courseSchema)){
                const db = getDb()
                const collection = db.collection("courses")

                const updateStatus = await collection.replaceOne(
                    { _id: new ObjectId(req.params.courseid) },
                    req.body
                )

                if(updateStatus){
                    res.status(200).json({
                        links: {
                            course: `/courses/${req.params.courseid}`
                        }
                    })
                }
                else{
                    next()
                }
            }
            else{
                res.status(400).json({error: "Request body is not a valid course object!"})
            }
        } else {
            res.status(403).json({ error: "Unauthorized to access the specified resource"})
        }
    }
    else{
        next()
    }
    
})

/*
 * Route to delete course from database, needs authentication. 
 */
router.delete("/:courseid", requireAuthentication, async function (req, res, next){
    const courseId = req.params.courseid
    if (ObjectId.isValid(courseId)) {
        if (req.user.role === "admin") {
            const db = getDb()
            const collection = db.collection("courses")
    
            const deleteStatus = await collection.deleteOne({_id: new ObjectId(req.params.courseid)})
            if(deleteStatus){
                res.status(204).end()
            }
            else{
                res.status(404).send({
                    error: "Request course not found."
                })
            }
        } else {
            res.status(403).json({ error: "Unauthorized to access the specified resource"})
        }
    }
    else{
        next()
    }
    
})

/*
 * Route to get a list of students enrolled in a course, needs authentication. 
 */

router.get("/:courseid/students", requireAuthentication, async function (req, res, next){
    const courseId = req.params.courseid
    const course = await getCourseById(courseId)
    if (req.user.role === "admin" || req.user.role === "instructor" && req.user.id.toString() === course.course.instructorId.toString()) {
        if(ObjectId.isValid(req.params.courseid)) {
            let students = []

            const db = getDb()
            const collection = db.collection("users")

            const course = await getCourseById(req.params.courseid)
            const studentsIds = course.course.students

            if(studentsIds.length > 0){
                for(let i = 0; i < studentsIds.length; i++){
                    let student = await collection.find({_id: new ObjectId(studentsIds[i])}).toArray()
                    students.push(student[0])
                }
        
                res.status(200).json({students: students})
            }
            else{
                next()
            }
        } else {
            next()
        }
    } else {
        res.status(403).json({ error: "Unauthorized to access the specified resource"})
    }
})

/*
 * Route to update enrollment for a course, needs authentication.
 */
router.post("/:courseid/students", requireAuthentication, async function (req, res, next){
    const courseId = req.params.courseid
    const course = await getCourseById(courseId)
    if (req.user.role === "admin" || req.user.role === "instructor" && req.user.id.toString() === course.course.instructorId.toString()) {
        if(ObjectId.isValid(req.params.courseid)){
            const db = getDb()
            const collection = db.collection("courses")
            const studentsCollection = db.collection("users")
            let updateAddStatus = 0
            let updateRemoveStatus = 0
    
            if((req.body.add && req.body.add.length > 0) || (req.body.remove && req.body.remove.length > 0)){
    
                //if student needs to be added
                if(req.body.add){
                    updateAddStatus = await collection.updateOne({_id: new ObjectId(req.params.courseid)}, {$push: {students: {$each: req.body.add}}})
                    for (let i = 0; i < req.body.add.length; i++){
                        const status = await studentsCollection.updateOne({_id: new ObjectId(req.body.add[i])}, {$push: {courses: new ObjectId(req.params.courseid)}})
                    }
                }
    
                //if student needs to removed
                if(req.body.remove){
                    updateRemoveStatus = await collection.updateOne({_id: new ObjectId(req.params.courseid)}, {$pull: {students: {$in: req.body.remove}}})
                    for (let i = 0; i < req.body.remove.length; i++){
                        await studentsCollection.updateOne({_id: new ObjectId(req.body.remove[i])}, {$pull: {courses: new ObjectId(req.params.courseid)}})
                    }
                }
                
                res.status(200).end()
            }
            else{
                res.status(400).json({error: "Request body is not valid!"})
            }
            
        }
        else{
            next()
        }
    } else {
        res.status(403).json({ error: "Unauthorized to access the specified resource"})
    }
})

/*
 * Route to fetch a CSV file containing list of students enrolled in the course, needs authentication. 
 */
//idk what im doing here, how to send the csv line by line to user? 
router.get("/:courseid/roster", requireAuthentication, async function (req, res, next){
    const courseId = req.params.courseid
    if (ObjectId.isValid(req.params.courseid)) {
        const course = await getCourseById(courseId)
        if (req.user.role === "admin" || req.user.role === "instructor" && req.user.id.toString() == course.course.instructorId.toString()) {
            try {
                let roster = await getCourseRoster(req.params.courseid)
                if (roster) {
                    res.status(200).type("csv").send(roster)
                } else {
                    res.status(404).send({
                        error: "Request course not found"
                    })
                }
            } catch (err) {
                next(err)
            }
        } else {
            res.status(403).json({error: "Unauthorized to access the specified resource"})
        }
    }
    else{
        next()
    }
   
})

/*
 * Route to fetch list of Assignments for the course.  
 */
router.get("/:courseid/assignments", async function (req, res, next){
    const courseId = req.params.courseid;
    if (ObjectId.isValid(courseId)) {
        try {
            const db = getDb()
            const collection = db.collection("assignments")
    
            const assignments = await collection.find({courseId: new ObjectId(req.params.courseid)}).toArray()
            if(assignments.length > 0){
                res.status(200).json({
                    assignments: assignments
                })
            }
            else{
                res.status(400).send({
                    error: "Request course not found."
                })
            }
        } catch (err) {
            next(err)
        }
    }
    else{
        next()
    }
    
    
})



