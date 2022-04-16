const { Sequelize, DataTypes } = require('sequelize')
const { MySQL } = require('../modules/MySQL')

module.exports.Users = MySQL.define('users', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: DataTypes.STRING,
    first_name: { type: DataTypes.STRING, allowNull: true },
    last_name: { type: DataTypes.STRING, allowNull: true },
    username: { type: DataTypes.STRING, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    is_bot: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    language_code: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'ru',
    },
})