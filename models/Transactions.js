const { Sequelize, DataTypes } = require('sequelize')
const { MySQL } = require('../modules/MySQL')

module.exports.Transactions = MySQL.define('transactions', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: DataTypes.STRING,
    amount: { type: DataTypes.BIGINT, allowNull: false },
    currency: { type: DataTypes.STRING, allowNull: false, defaultValue: 'USD' },
    card_number: DataTypes.STRING,
    method: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Transferring To Russia',
    },
    paid: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 0,
    },
})