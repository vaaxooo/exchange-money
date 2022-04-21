const {initialForm, confirm, cancel, successPayment} = require('./callbacks')

module.exports.Bot = async (ctx, bot, i18n) => {
    ctx.reply(i18n.__('text_withdrawal'), {
        reply_markup: {
            inline_keyboard: [
                [{
                    text: i18n.__('transferring_to_russia'),
                    callback_data: 'callback_transferring_one',
                },],
                [{
                    text: i18n.__('transferring_to_another_country'),
                    callback_data: 'callback_transferring_two',
                },],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
            force_reply: true,
        },
    })

    bot.on('callback_query', data => {
        switch (data.update.callback_query.data) {
            case 'callback_transferring_one':
                data.db.step = 1
                data.db.method = 'callback_transferring_one'
                initialForm(data, bot, i18n)
                break
            case 'callback_transferring_two':
                data.db.step = 1
                data.db.method = 'callback_transferring_two'
                initialForm(data, bot, i18n)
                break
            case 'confirm':
                confirm(data, bot, i18n)
                break
            case 'cancel':
                cancel(data, bot, i18n)
                break
        }
    })

    bot.on('pre_checkout_query', ctx => ctx.answerPreCheckoutQuery(true))
    bot.on('successful_payment', async (ctx, next) => {
        await successPayment(ctx, bot, i18n)
    })
}