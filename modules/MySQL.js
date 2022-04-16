const { Sequelize } = require('sequelize')

const config = process.env

module.exports.MySQL = new Sequelize(
    config.MYSQL_NAME,
    config.MYSQL_USER,
    config.MYSQL_PASSWORD, {
        host: config.MYSQL_HOST,
        dialect: config.MYSQL_DIALECT,
        logging: false,
        define: {
            charset: 'utf8',
            dialectOptions: {
                collate: 'utf8_general_ci',
            },
            timestamps: true,
        },
    }
)