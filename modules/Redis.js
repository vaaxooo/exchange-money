const redis = require('redis')

module.exports.Redis = async() => {
    const client = redis.createClient(
        process.env.REDIS_PORT,
        process.env.REDIS_HOST
    )
    await client.connect()
    await client.on('connect', () => {})
}