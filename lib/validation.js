exports.validateAgainstSchema = function (obj, schema) {
    return obj && Object.keys(schema).every(
        field => !schema[field].required || obj[field]
    )
}

exports.extractValidFields = function (obj, schema) {
    let validObj = {}
    Object.keys(schema).forEach((field) => {
        if (obj[field]) {
            validObj[field] = obj[field]
        }
    })
    return validObj
}