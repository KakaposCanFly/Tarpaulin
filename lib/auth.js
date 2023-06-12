const jwt = require("jsonwebtoken")

const secretKey = "SuperSecret"

exports.generateAuthToken = function (id, email, role) {
    const payload = { sub: id, email: email, role: role }
    console.log("== payload: ", payload)
    return jwt.sign(payload, secretKey, { expiresIn: "24h"})
}

exports.requireAuthentication = function (req, res, next) {
    console.log("== requireAuthentication()")
    const authHeader = req.get("Authorization") || ""
    const authHeaderParts = authHeader.split(" ")
    const token = authHeaderParts[0] === "Bearer" ?
        authHeaderParts[1] : null
    console.log(" -- token:", token)
    try {
        const payload = jwt.verify(token, secretKey)
        // console.log(" -- payload:", payload)
        req.user = {
            id: payload.sub,
            email: payload.email,
            role: payload.role
        }
        // console.log(" -- req.user:", req.user)
        next()
    } catch (err) {
        console.error("== Error verifying token: ", err)
        res.status(401).send({
            error: "Invalid authentication token"
        })
    }
}

/**
 * Rate Limiting: get email from login token
 */
exports.getEmail = function(req, res, next) {
    // console.log("== getLogin()")
    const authHeader = req.get("Authorization") || ""
    const authHeaderParts = authHeader.split(" ")
    const token = authHeaderParts[0] === "Bearer" ?
        authHeaderParts[1] : null
    // console.log(" -- token:", token)
    if (!token) {
        req.user = null
        next()
        return
    }
    try {
        const payload = jwt.verify(token, secretKey)
        // console.log(" -- payload:", payload)
        req.user = {
            email: payload.sub,
            role: payload.role
        }
        // console.log(" -- req.user:", req.user)
    } catch (err) {
        console.err('== Error verifying token:', err)
        req.user = null
    }
    next()
}