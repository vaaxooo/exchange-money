const { default: axios } = require('axios')
const { ExchangeRates, CreaditCardMask } = require('./helpers/index')
const { Transactions } = require('./models/Transactions')
const { Menu } = require('./menu')

let amount, card_number, percent, processed_amount

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

const regexCards = [/^(?:4[0-9]{12}(?:[0-9]{3})?)$/, /^(?:5[1-5][0-9]{14})$/]

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
            switch (ctx.db.step) {
                case 1:
                    amount = +data.update.message.text
                    if (amount < 20 || amount > 10000 || !Number.isInteger(amount)) {
                        await ctx.replyWithHTML(i18n.__('incorrect_amount'))
                        ctx.db.step.step = 1
                        break
                    }
                    await ctx.replyWithHTML(i18n.__('text_card_number'))
                    ctx.db.step++
                        break
                case 2:
                    card_number = data.update.message.text.replace(' ', '')

                    let valid_card = false
                    for (let regex of regexCards) {
                        if (regex.test(card_number)) {
                            valid_card = true
                            break
                        }
                    }

                    if (!valid_card) {
                        await ctx.reply(i18n.__('incorrect_card_number'))
                        ctx.db.step = 2
                        break
                    }

                    await ctx.replyWithHTML(
                        i18n.__('text_confirm_transfer_amount', {
                            method: ctx.db.method === 'callback_transferring_one' ?
                                i18n.__('transferring_to_russia') :
                                i18n.__('transferring_to_another_country'),
                            amount: amount,
                            card_number: CreaditCardMask(card_number),
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
                    ctx.db.step++
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
        amount = +amount * parseInt(exchange_rates[methods.card[ctx.db.method].currency])
        percent = ((amount * 2) / 100) * 100
        processed_amount = parseInt(amount * 100 + percent)
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
                card_number: CreaditCardMask(card_number),
            }),
            currency: methods.card[ctx.db.method].currency,
            prices: [{
                label: i18n.__('widget_money_transfer'),
                amount: processed_amount,
            }, ],
            payload: {
                unique_id: `${ctx.chat.id}_${Number(new Date())}`,
                provider_token: methods.card[ctx.db.method].token,
            },
        })
        ctx.db.transaction = await Transactions.create({
            user_id: ctx.from.id,
            amount: amount,
            currency: methods.card[ctx.db.method].currency,
            card_number: card_number,
            method: ctx.db.method === 'callback_transferring_one' ?
                i18n.__('transferring_to_russia') :
                i18n.__('transferring_to_another_country'),
            paid: false,
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
        Menu(i18n)
    },

    successPayment: async function(ctx, bot, i18n) {
        let transaction = ctx.db.transaction
        await Transactions.update({ paid: true }, { where: { id: transaction.id } })
        transaction = await Transactions.findOne({ where: { id: transaction.id } })
        await ctx.replyWithHTML(i18n.__('success_payment'))

        let sender = ctx.from.username ?
            '@' + ctx.from.username :
            '[' + ctx.from.id + ']'
        const message = `Пользователь: ${sender}\nСумма: ${amount} ${
			methods.card[ctx.db.method].currency
		}\nКарта получателя: ${card_number}\n\nID: #${transaction.id} | Статус: ${
			transaction.paid ? 'Оплачено' : 'Неоплачено'
		}`
        await bot.telegram.sendMessage('1919790048', message)
    },
}