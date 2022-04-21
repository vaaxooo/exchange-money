require('dotenv-flow').config()
const path = require('path')
const { MySQL } = require('./modules/MySQL')

const { Users } = require('./models/Users')

const { Menu } = require('./menu')
const { Bot } = require('./bot')

const { Telegraf } = require('telegraf')
const bot = new Telegraf(process.env.TELEGRAM_BOT)
const { I18n } = require('i18n')
const i18n = new I18n({
    locales: ['en', 'ru'],
    directory: path.join(__dirname, 'locales'),
})

;
(async() => {
    await MySQL.sync()
    const date = new Date(Date.now()).toUTCString()
    console.info(`[${date}] Leader Exchange Money bot was successfully launched`)
})()

bot.start(async ctx => {
    bot.context.db = { method: null, transaction: null, step: 0 }
    i18n.setLocale(ctx.from.language_code)
    await ctx.replyWithHTML(i18n.__('start'), Menu(i18n))

    let user = await Users.findOne({ where: { user_id: ctx.from.id } })
    if (!user) {
        Users.create({
            user_id: ctx.from.id,
            first_name: ctx.from.first_name,
            last_name: ctx.from.last_name,
            username: ctx.from.username,
            is_bot: ctx.from.is_bot,
            language_code: ctx.from.language_code,
            phone: ctx.from.phone,
        })
    }

    bot.hears(i18n.__('widget_money_transfer'), (ctx, next) => {
        ctx.db.step = 0
        Bot(ctx, bot, i18n)
    })

    bot.hears(i18n.__('about'), (ctx, next) => {
        ctx.db.step = 0
        ctx.replyWithHTML(i18n.__('about_text'), Menu(i18n))
    })
})

bot.launch()