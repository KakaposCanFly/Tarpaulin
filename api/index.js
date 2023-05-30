const router = module.exports = require('express').Router();

router.use('/submissions', require('./submissions').router);