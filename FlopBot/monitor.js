const { chromium } = require("playwright");

const URL = "https://golive.nemtudo.me/watch/FlopTv";

// Intervalo entre verificações.
// 10 segundos é um bom equilíbrio.
const INTERVALO = 10000;

let navegador = null;
let pagina = null;

let estadoAtual = false;
let primeiraVerificacao = true;

async function criarNavegador() {
    navegador = await chromium.launch({
        headless: true
    });

    pagina = await navegador.newPage({
        viewport: {
            width: 1280,
            height: 720
        }
    });

    pagina.on("console", msg => {
        console.log("[GoLive]", msg.text());
    });

    pagina.on("pageerror", erro => {
        console.log("⚠️ Erro da página:", erro.message);
    });

    await pagina.goto(URL, {
        waitUntil: "domcontentloaded",
        timeout: 60000
    });

    console.log("🌐 GoLive aberto.");
}

async function verificarTransmissao() {
    try {
        if (!pagina) {
            await criarNavegador();
        }

        /*
         * Pegamos informações da página.
         *
         * Como o GoLive é uma aplicação dinâmica, não confiamos
         * somente no HTML inicial.
         */
        const resultado = await pagina.evaluate(() => {

            const texto = document.body?.innerText || "";

            const videos = Array.from(
                document.querySelectorAll("video")
            );

            const videoAtivo = videos.some(video => {
                return (
                    video.readyState >= 2 &&
                    video.videoWidth > 0 &&
                    video.videoHeight > 0
                );
            });

            const elementos = Array.from(
                document.querySelectorAll("*")
            );

            const textoLower = texto.toLowerCase();

            const indicadores = [
                "ao vivo",
                "live",
                "transmitindo",
                "compartilhando tela",
                "compartilhando a tela"
            ];

            const encontrouIndicador =
                indicadores.some(indicador =>
                    textoLower.includes(indicador)
                );

            return {
                videoAtivo,
                encontrouIndicador,
                texto: texto.slice(0, 5000),
                quantidadeVideos: videos.length,
                url: location.href
            };
        });

        /*
         * A condição principal é a existência de um vídeo reproduzindo.
         *
         * O indicador textual serve como complemento.
         */
        const aoVivo =
            resultado.videoAtivo ||
            resultado.encontrouIndicador;

        console.log(
            `[${new Date().toLocaleTimeString("pt-BR")}] ` +
            `Transmissão: ${aoVivo ? "🟢 AO VIVO" : "🔴 OFFLINE"}`
        );

        return aoVivo;

    } catch (erro) {

        console.log(
            "⚠️ Erro verificando GoLive:",
            erro.message
        );

        /*
         * Se a página der erro temporariamente,
         * NÃO consideramos que a transmissão acabou.
         *
         * Isso evita o bot mandar:
         *
         * "FlopTv saiu do ar"
         *
         * por causa de uma simples falha de internet.
         */
        return null;
    }
}

async function enviarMensagem(client, mensagem) {

    const canalId = process.env.DISCORD_CHANNEL_ID;

    if (!canalId) {
        console.log(
            "❌ DISCORD_CHANNEL_ID não configurado."
        );
        return;
    }

    try {

        const canal =
            await client.channels.fetch(canalId);

        if (!canal) {
            console.log(
                "❌ Canal do Discord não encontrado."
            );
            return;
        }

        await canal.send(mensagem);

        console.log(
            "📨 Mensagem enviada ao Discord."
        );

    } catch (erro) {

        console.log(
            "❌ Erro enviando mensagem:",
            erro.message
        );
    }
}

async function iniciarMonitoramento(client) {

    await criarNavegador();

    /*
     * Primeira verificação.
     *
     * Se o bot começar enquanto a FlopTv já estiver ao vivo,
     * não envia "começou" imediatamente.
     *
     * Ele apenas registra o estado.
     */
    const estadoInicial = await verificarTransmissao();

    if (estadoInicial !== null) {
        estadoAtual = estadoInicial;
        primeiraVerificacao = false;
    }

    setInterval(async () => {

        const novoEstado =
            await verificarTransmissao();

        /*
         * null = erro temporário.
         * Não fazemos absolutamente nada.
         */
        if (novoEstado === null) {
            return;
        }

        /*
         * Primeira leitura válida.
         */
        if (primeiraVerificacao) {

            estadoAtual = novoEstado;
            primeiraVerificacao = false;

            return;
        }

        /*
         * OFFLINE → AO VIVO
         */
        if (!estadoAtual && novoEstado) {

            console.log(
                "🟢 A FlopTv começou!"
            );

            await enviarMensagem(
                client,
                "FlopTv está ao vivo! Assista em: https://golive.nemtudo.me/watch/FlopTv"
            );
        }

        /*
         * AO VIVO → OFFLINE
         */
        if (estadoAtual && !novoEstado) {

            console.log(
                "🔴 A FlopTv saiu do ar."
            );

            await enviarMensagem(
                client,
                "FlopTv saiu do ar. Voltaremos em breve!"
            );
        }

        estadoAtual = novoEstado;

    }, INTERVALO);
}

module.exports = {
    iniciarMonitoramento
};
