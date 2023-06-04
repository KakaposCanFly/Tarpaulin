const router = require('express').Router();
const { getDb } = require("../lib/mongo")
const { ObjectId } = require("mongodb")
const { courseSchema } = require("../models/course");
const { validateAgainstSchema } = require('../lib/validation');

exports.router = router;

async function getCoursesPage(page, url, query){
    const db = getDb()
    const collection = db.collection('courses')

    const init_count = await collection.find(query)

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

    //fix null in the last page 
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
        course: course
    }

    return results; 
}

/*
 * Route to return list of courses 
 */
router.get('/', async function (req, res) {
    //questions: are all parameters (except for page required?)
    // parameters: page || 1, subject, number, term 
    var query = {}

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
    console.log(courses.courses)
    res.status(200).json({courses})

})

/*
 * Route to create a new course, needs authentication. 
 */
router.post('/', async function (req, res, next){
    
    if(validateAgainstSchema(req.body, courseSchema)){
        const db = getDb()
        const collection = db.collection("courses")

        const newCourse = await collection.insertOne(req.body)

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
})


/*
 * Route to fetch info about a specific course. 
 */
router.get('/:courseid', async function (req, res, next){

    if (ObjectId.isValid(req.params.courseid)) {
        const courseInfo = await getCourseById(req.params.courseid)

        if(courseInfo.length !== 0) {
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
router.put('/:courseid', async function (req, res, next){
    if(ObjectId.isValid(courseid)){
        
    }
})




