const router = require('express').Router();
const { getDb } = require("../lib/mongo")
const { ObjectId } = require("mongodb")

exports.router = router;

async function getCoursesPage(page, url, params){
    const db = getDb()
    const collection = db.collection('courses')

    //count num of courses 
    const count = await collection.countDocuments()
    const pageSize = 10
    const lastPage = Math.ceil(count / pageSize)
    page = page < 1 ? 1 : page 
    const offset = (page - 1) * pageSize

    //how to do a conditional query ?
    const results = await collection.find({subject: params.subject, number: params.number, term: params.term}).sort({_id: 1}).skip(offset).limit(pageSize).toArray()

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

/*
 * Route to return list of courses 
 */
router.get('/', async function (req, res) {
    //questions: are all parameters (except for page required?)
    // parameters: page || 1, subject, number, term 
    const url = req.url.split("&")
    console.log("url", url[1])
    const courses = await getCoursesPage(parseInt(req.query.page) || 1, "", params)

    res.status(200).json({courses})

})



