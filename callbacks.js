const { default: axios } = require('axios')
const { ExchangeRates } = require('./helpers/exchange_rates')

let amount,
    card_number,
    step = 1

const methods = {
    card: {
        callback_transferring_one: {
            token: process.env.STRIPE_TOKEN,
            currency: 'USD',
        },
        callback_transferring_two: {
            token: process.env.SBERBANK_TOKEN,
            currency: 'RUB',
        },
    },
}

module.exports = {
    /**
     * Initial form with translation method selection
     * @param ctx
     * @param bot
     * @param i18n
     * @returns {Promise<void>}
     */
    initialForm: async function(ctx, bot, i18n) {
        await ctx.replyWithHTML(i18n.__('text_transfer_amount'))
        bot.on('message', async data => {
            switch (step) {
                case 1:
                    amount = +data.update.message.text
                    if (amount < 20 || amount > 10000 || typeof amount !== 'number') {
                        await ctx.replyWithHTML(i18n.__('incorrect_amount'))
                        step = 1
                        break
                    }
                    await ctx.replyWithHTML(i18n.__('text_card_number'))
                    step++
                    break
                case 2:
                    const mask = /\b(?:\d{4}[ -]?){3}(?=\d{4}\b)/gm
                    card_number = data.update.message.text
                    if (!mask.test(card_number)) {
                        await ctx.reply(i18n.__('incorrect_card_number'))
                        step = 2
                        break
                    }
                    await ctx.replyWithHTML(
                        i18n.__('text_confirm_transfer_amount', {
                            method: ctx.db.method === 'callback_transferring_one' ?
                                i18n.__('transferring_to_russia') :
                                i18n.__('transferring_to_another_country'),
                            amount,
                            card_number,
                        }), {
                            reply_markup: {
                                inline_keyboard: [
                                    [{
                                            text: i18n.__('cancel'),
                                            callback_data: 'cancel',
                                        },
                                        {
                                            text: i18n.__('confirm'),
                                            callback_data: 'confirm',
                                        },
                                    ],
                                ],
                                resize_keyboard: true,
                                one_time_keyboard: true,
                                force_reply: true,
                            },
                        }
                    )
                    step++
                    break
            }
        })
    },

    /**
     * Confirm payment creation
     * @param ctx
     * @param bot
     * @param i18n
     * @returns {Promise<void>}
     */
    confirm: async function(ctx, bot, i18n) {
        const exchange_rates = (
            await axios.get(
                `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGERATES_API_KEY}/latest/USD`
            )
        ).data.conversion_rates
        amount = +amount *
            parseInt(exchange_rates[methods.card[ctx.db.method].currency]) *
            100
        percent = (amount * 0.2) / 100
        amount = amount + percent
        ctx.editMessageReplyMarkup({
            reply_markup: {
                inline_keyboard: [],
            },
        })
        await ctx.replyWithInvoice({
            chat_id: ctx.chat.id,
            provider_token: methods.card[ctx.db.method].token,
            start_parameter: 'get_access',
            title: i18n.__('widget_money_transfer'),
            description: i18n.__('widget_money_transfer_description', {
                card_number,
            }),
            currency: methods.card[ctx.db.method].currency,
            prices: [{
                label: i18n.__('widget_money_transfer'),
                amount: amount,
            }, ],
            payload: {
                unique_id: `${ctx.chat.id}_${Number(new Date())}`,
                provider_token: methods.card[ctx.db.method].token,
            },
        })
    },

    /**
     * Cancel payment creation
     * @param ctx
     * @param bot
     * @param i18n
     * @returns {Promise<void>}
     */
    cancel: async function(ctx, bot, i18n) {
        await ctx.editMessageReplyMarkup({
            reply_markup: {
                inline_keyboard: [],
            },
        })
        await ctx.reply(i18n.__('transfer_canceled'))
        await this.initialForm(ctx, bot, i18n)
    },
}