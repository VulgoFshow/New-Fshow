const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações do Express
app.use(cors());
app.use(express.json());
// Se o seu frontend estiver na mesma pasta "public", descomente a linha abaixo:
// app.use(express.static('public')); 

// ==========================================
// BANCOS DE DADOS EM MEMÓRIA (MOCKS)
// Substitua por um banco de dados real (SQL/NoSQL)
// ==========================================
const db = {
  votos: {
    "João": 0,
    "Lívia": 0,
    "Ludmila": 0
  },
  ipsVotaram: new Set(),
  devicesVotaram: new Set(),
  captchasAtivos: new Map() // Guarda os tokens de captcha gerados temporariamente
};

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

// Função para checar VPN/Proxy (Exemplo usando uma API pública gratuita)
async function isVpnOrProxy(ip) {
  // IPs locais ou de teste não são VPN
  if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.")) return false;
  
  try {
    // IMPORTANTE: Em produção, use serviços robustos como ipinfo.io, proxycheck.io, etc.
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=proxy,hosting`);
    const data = await response.json();
    return data.proxy === true || data.hosting === true;
  } catch (error) {
    console.error("Erro ao verificar IP:", error);
    return false; // Em caso de erro na API, liberamos por padrão para não travar o usuário
  }
}

// Extrai o IP real do usuário (considerando proxies reversos como NGINX/Cloudflare)
function getClientIp(req) {
  return req.headers['x-forwarded-for'] || req.socket.remoteAddress;
}

// ==========================================
// ROTAS DA API
// ==========================================

// 1. Controle de Votação (Aberta, Fechada, Automática)
app.get("/api/controle-votacao", (req, res) => {
  // Você pode buscar isso do banco de dados para abrir/fechar via painel de admin
  res.json({ success: true, modo: "automatico" });
});

// 2. Geração do CAPTCHA
app.get("/api/captcha", (req, res) => {
  const token = crypto.randomUUID();
  
  // Imagens fictícias para o seu Captcha customizado
  // Em um sistema real, você deve ter um banco de imagens categorizadas
  const imagens = [
    { id: 1, src: "https://via.placeholder.com/150/000000/FFFFFF/?text=Img+1", category: "certo" },
    { id: 2, src: "https://via.placeholder.com/150/000000/FFFFFF/?text=Img+2", category: "errado" },
    { id: 3, src: "https://via.placeholder.com/150/000000/FFFFFF/?text=Img+3", category: "errado" },
    { id: 4, src: "https://via.placeholder.com/150/000000/FFFFFF/?text=Img+4", category: "certo" },
    { id: 5, src: "https://via.placeholder.com/150/000000/FFFFFF/?text=Img+5", category: "errado" },
    { id: 6, src: "https://via.placeholder.com/150/000000/FFFFFF/?text=Img+6", category: "certo" },
  ];

  // Embaralhar as imagens
  const imagensEmbaralhadas = imagens.sort(() => Math.random() - 0.5);
  
  // Quais IDs são as respostas corretas?
  const respostasCorretas = imagensEmbaralhadas.filter(img => img.category === "certo").map(img => img.id);

  // Guarda as respostas certas no servidor por 5 minutos
  db.captchasAtivos.set(token, { respostasCorretas, expires: Date.now() + 5 * 60000 });

  res.json({
    success: true,
    token: token,
    instruction: "Selecione as imagens com o texto 'certo' (teste lógico)",
    images: imagensEmbaralhadas.map(img => ({ id: img.id, src: img.src })) // Não envia a categoria para o front!
  });
});

// 3. Rota principal de processamento (Acesso, Validação e Voto)
app.post("/api/votar", async (req, res) => {
  const { action, table, deviceId, captchaToken, selectedIds, participante } = req.body;
  const ip = getClientIp(req);

  try {
    // ----------------------------------------------------
    // AÇÃO: VERIFICAR ACESSO (IP e VPN)
    // ----------------------------------------------------
    if (action === "verificar-acesso") {
      if (db.ipsVotaram.has(ip) || db.devicesVotaram.has(deviceId)) {
        return res.json({ success: true, jaVotou: true });
      }
      
      const isVpn = await isVpnOrProxy(ip);
      if (isVpn) {
        return res.json({ success: true, vpn: true });
      }

      return res.json({ success: true, permitido: true });
    }

    // ----------------------------------------------------
    // AÇÃO: VALIDAR CAPTCHA
    // ----------------------------------------------------
    if (action === "validar-captcha") {
      const captchaData = db.captchasAtivos.get(captchaToken);
      
      if (!captchaData || Date.now() > captchaData.expires) {
        return res.status(400).json({ success: false, error: "Captcha expirado ou inválido." });
      }

      // Verifica se as respostas enviadas batem com as corretas
      const acertos = selectedIds.every(id => captchaData.respostasCorretas.includes(id));
      const quantidadeCorreta = selectedIds.length === captchaData.respostasCorretas.length;

      if (acertos && quantidadeCorreta) {
        // Validação passou, apaga o token para evitar reuso
        db.captchasAtivos.delete(captchaToken);
        return res.json({ success: true, votosLiberados: 1 });
      } else {
        return res.status(400).json({ success: false, error: "Seleção incorreta. Tente novamente." });
      }
    }

    // ----------------------------------------------------
    // AÇÃO: REGISTRAR VOTO
    // ----------------------------------------------------
    if (action === "votar") {
      // 1. Double check de IP e Device
      if (db.ipsVotaram.has(ip) || db.devicesVotaram.has(deviceId)) {
        return res.status(403).json({ success: false, jaVotou: true, error: "Voto já registrado neste dispositivo/IP." });
      }

      // 2. Double check de VPN
      const isVpn = await isVpnOrProxy(ip);
      if (isVpn) {
        return res.status(403).json({ success: false, vpn: true, error: "Uso de VPN detectado." });
      }

      // 3. Registrar o Voto
      if (db.votos[participante] !== undefined) {
        db.votos[participante] += 1;
        db.ipsVotaram.add(ip);
        db.devicesVotaram.add(deviceId);
        
        console.log(`Voto registrado para ${participante}. Total: ${db.votos[participante]}`);
        
        return res.json({ success: true, message: "Voto computado com sucesso!" });
      } else {
        return res.status(400).json({ success: false, error: "Participante inválido." });
      }
    }

    // Se a ação não existir
    return res.status(400).json({ success: false, error: "Ação inválida." });

  } catch (error) {
    console.error("Erro interno:", error);
    res.status(500).json({ success: false, error: "Erro interno do servidor." });
  }
});

// Inicialização do servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Ponto de entrada: http://localhost:${PORT}`);
});
