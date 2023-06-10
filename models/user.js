const { DataTypes } = require('sequelize')
const { Course } = require('./course.js')

const bcrypt = require('bcryptjs')

const sequelize = require('../lib/sequelize')

/**
 * Schema for a User
 */
const User = sequelize.define('user', {
    name: { type: DataTypes.STRING, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false},
    password: {
        type: DataTypes.String,
        set(value) (
            this.setDataValue('password', bcrypt.hashSync(value));
        ),
        allowNull: false
    },
    role: { type: DataTypes.STRING, allowNull: false },
    admin: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false }
})

exports.User = User

exports.UserClientFields = [
    'name',
    'email',
    'password',
    'role',
    'admin'
]