const { Boom } = require('@hapi/boom')
const { default: makeWASocket, DisconnectReason, fetchLatestBaileysVersion, isJidBroadcast, makeCacheableSignalKeyStore, jidNormalizedUser, useMultiFileAuthState } = require('@adiwajshing/baileys')
const { existsSync, readFileSync } = require("fs")
const P = require("pino");
let MAIN_LOGGER = P({ timestamp: () => `,"time":"${new Date().toJSON()}"` });

const logger = MAIN_LOGGER.child({});
logger.level = 'silent'

const { postedEsanaNews, get_EsanaPosted } = require("./database/posted_news")
const { fetchauth, updateAuth } = require("./database/session")
const news_groups = [
    "120363066883836938@g.us",
    "120363053633360679@g.us"
]

console.log("ESANA NEWS BOT 📰")
const ESANA_BOT = async () => {
    await fetchauth();
    const { version, isLatest } = await fetchLatestBaileysVersion()
    console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`)
    const { state, saveCreds } = await useMultiFileAuthState('esana_bot_auth')

    const sock = makeWASocket({
        version,
        logger,
        browser: [" NEWS-BOT ", "Safari", "11"],
        printQRInTerminal: true,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        generateHighQualityLinkPreview: true,
        shouldIgnoreJid: jid => isJidBroadcast(jid)
    })

    sock.ev.process(async (events) => {
        if (events['connection.update']) {
            const update = events['connection.update']
            const { connection, lastDisconnect } = update

            if (connection === "close") {
                console.log('Disconnected ❌')
                let reason = new Boom(lastDisconnect?.error)?.output.statusCode
                if (reason === DisconnectReason.badSession) { console.log(`Bad Session File, Please Delete Session and Scan Again`); return ESANA_BOT(); }
                else if (reason === DisconnectReason.connectionClosed) { console.log("Connection closed, reconnecting...."); return ESANA_BOT(); }
                else if (reason === DisconnectReason.connectionLost) { console.log("Connection Lost from Server, reconnecting..."); return ESANA_BOT(); }
                else if (reason === DisconnectReason.connectionReplaced) { console.log("Connection Replaced, Another New Session Opened, Please Close Current Session First"); return ESANA_BOT(); }
                else if (reason === DisconnectReason.loggedOut) { console.log(`Device Logged Out, Please Scan Again And Run.`); sock.logout(); return ESANA_BOT(); }
                else if (reason === DisconnectReason.restartRequired) { console.log("Restart Required, Restarting..."); return ESANA_BOT(); }
                else if (reason === DisconnectReason.timedOut) { console.log("Connection TimedOut, Reconnecting..."); return ESANA_BOT(); }
                else { return await ESANA_BOT(); }
            }

            if (connection === 'open') {
                console.log('✅ Web WA connected!');
                const botNumberJid = jidNormalizedUser(sock.user.id);
                await sock.sendMessage(botNumberJid, { image: readFileSync("./assets/ESANA_LOGO.png"), caption: "Esana News WhatsApp bot activated!" })
            }
        }

        if (events['creds.update']) {
            await saveCreds();
            if (existsSync("./esana_bot_auth/creds.json")) {
                const session = readFileSync("./esana_bot_auth/creds.json");
                await updateAuth(JSON.stringify(JSON.parse(session)));
            };
        }

        setInterval(async () => {
            console.log('Checking new Esana news available...')

            // ===== Esana News =====
            const esana = require("./lib/esana")
            const latest_news_data = await esana.esana_latest();
            const PostedEN = await get_EsanaPosted();

            if (parseInt(PostedEN.esanaNews) === latest_news_data.news_id) {
                console.log('No new Esana news yet!')
            } else {
                try {
                    console.log(`Posting ${latest_news_data.news_id}`);
                    await postedEsanaNews(latest_news_data);
                    const dbNewsData = await get_EsanaPosted();
                    const latest_news = JSON.parse(dbNewsData.newsData);
                    for (const jid of news_groups) {
                        const image = await sock.sendMessage(jid, { image: { url: latest_news.media.header }, caption: `*${latest_news.title}*\n[${latest_news.publishedAt}]\n\n${latest_news.desc}` });
                        const reactionMessage = { react: { text: "🗞️", key: image.key } };
                        await sock.sendMessage(jid, reactionMessage);
                        if (latest_news.media.images && latest_news.media.images !== '' && !latest_news.media.images[0].hasOwnProperty('status')) {
                            for (const m of latest_news.media.images) {
                                await sock.sendMessage(jid, { image: { url: m } });
                            }
                        }
                    }
                    return;
                } catch (e) {
                    console.log(e)
                }
            }
        }, 10000)
    });
}

ESANA_BOT();