const { Client, GatewayIntentBits } = require('discord.js');
const puppeteer = require('puppeteer');

// Configuração do Bot
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const TOKEN = 'SEU_TOKEN_DO_DISCORD_AQUI'; // Substitua pelo token do bot
const CANAL_ID = 'ID_DO_CANAL_AQUI'; // Substitua pelo ID do canal de avisos
const URL = 'https://golive.nemtudo.me/watch/FlopTv';

let isLive = false;

client.once('ready', () => {
    console.log(`✅ FlopBot online como ${client.user.tag}! Monitorando a FlopTv...`);
    
    // Verifica o site a cada 2 minutos (120000 milissegundos) para não sobrecarregar
    setInterval(verificarLive, 120000);
    verificarLive(); // Faz a primeira verificação na hora que liga
});

async function verificarLive() {
    try {
        // Abre um navegador invisível
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto(URL, { waitUntil: 'networkidle2' });

        // Lê a página para ver se o player de vídeo da live está lá
        const hostEstaAoVivo = await page.evaluate(() => {
            // Procura pela tag de vídeo na tela. 
            // Se o site usar uma classe específica quando está ao vivo, mude aqui (ex: '.player-live')
            const video = document.querySelector('video'); 
            return video !== null; 
        });

        await browser.close();

        const canal = client.channels.cache.get(CANAL_ID);
        if (!canal) {
            console.log("Erro: Canal não encontrado. Verifique o CANAL_ID.");
            return;
        }

        // Lógica de envio das mensagens
        if (hostEstaAoVivo && !isLive) {
            isLive = true;
            canal.send("FlopTv está ao vivo! Assista em: https://golive.nemtudo.me/watch/FlopTv");
            console.log("Status: Ao vivo (Mensagem enviada)");
            
        } else if (!hostEstaAoVivo && isLive) {
            isLive = false;
            canal.send("FlopTv saiu do ar. Voltaremos em breve!");
            console.log("Status: Offline (Mensagem enviada)");
        }

    } catch (error) {
        console.error("Erro ao verificar o site:", error.message);
    }
}

client.login(TOKEN);
