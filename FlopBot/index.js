require("dotenv").config();

const {
    Client,
    GatewayIntentBits
} = require("discord.js");

const {
    iniciarMonitoramento
} = require("./monitor");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});

client.once("ready", async () => {
    console.log(`✅ FlopBot conectado como ${client.user.tag}`);

    console.log("📺 Iniciando monitoramento da FlopTv...");

    await iniciarMonitoramento(client);
});

client.login(process.env.DISCORD_TOKEN);
