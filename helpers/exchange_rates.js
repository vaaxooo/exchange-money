const axios = require('axios')
const { Redis } = require('../modules/Redis')

module.exports.ExchangeRates = async() => {
    if (!(await Redis.get('exchange_rates'))) {
        let rates = (
            await axios.get(
                `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGERATES_API_KEY}/latest/USD`
            )
        ).data
        if (rates.status === 'success') {
            await Redis.set(
                'exchange_rates',
                JSON.stringify(rates.conversion_rates), {
                    EX: 48200,
                    NX: true,
                }
            )
        }
    }
    return JSON.parse(await Redis.get('exchange_rates'))
}