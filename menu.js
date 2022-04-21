module.exports.Menu = i18n => {
    return {
        reply_markup: {
            keyboard: [
                [{
                    text: i18n.__('widget_money_transfer'),
                    callback_data: 'callback_transferring',
                }, ],
                [{
                        text: i18n.__('about'),
                        callback_data: 'about',
                    },
                    {
                        text: i18n.__('reviews'),
                        url: 'https://tg.me/vaaxooo',
                    },
                ],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
            force_reply: true,
        },
    }
}