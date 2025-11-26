 <script type="module">  
import { createClient } from 'https://esm.sh/@supabase/supabase-js';  
const supabase = createClient(  
  'https://vchvvvvzulrkovjmiokg.supabase.co',  
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjaHZ2dnZ6dWxya292am1pb2tnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0NzYwMDIsImV4cCI6MjA3NDA1MjAwMn0.vHgI_JDNKDECR8H1wVC3LwGeMux8gAKkoeCmPSPuSA4'  
);  


   
let captchaLocked = false;
let captchaAberto = false;

// ===== CONFIG =====  
const VOTOS_POR_CAPTCHA = 10;  
function getVotosRestantes() {  
  const raw = localStorage.getItem("votosRestantes");  
  const token = localStorage.getItem("token");  
    
  if (!raw || !token) return 0;  
  
  const valid = hashTag(raw) == token;  
  return valid ? parseInt(raw) : 0;  
}  
  
function setVotosRestantes(n) {  
  localStorage.setItem("votosRestantes", String(n));  
  localStorage.setItem("token", String(hashTag(String(n))));  
}  
  
// ===== ELEMENTOS =====  
const votoTela = document.getElementById("votoTela");  
const confirmTela = document.getElementById("confirmTela");  
const nomeConfirm = document.getElementById("nomeConfirm");  
const fotoConfirm = document.getElementById("fotoConfirm");  
const botaoCaptcha = document.getElementById("botaoCaptcha");  
const botaoVotar = document.getElementById("botaoVotar");  
const popupCaptcha = document.getElementById("popupCaptcha");  
const captchaGrid = document.getElementById("captchaGrid");  
const captchaInstruction = document.getElementById("captcha-instrucao");  
const verifyBtn = document.getElementById("captchaConfirm");  
const refreshBtn = document.getElementById("captchaRefresh");  
const statusEl = document.getElementById("captchaStatus");  
  
  
// CAPTCHA ===  
const prompts = [  
  {  
    label: "Clique nas imagens contendo algo que pode se locomover",  
    correctTag: "202",  
    images: [  
      { src: "https://i.ibb.co/cSMQWgx4/car1.png", tag: "202" },  
      { src: "https://i.ibb.co/d0CCf03S/moto1.png", tag: "202" },  
      { src: "https://i.ibb.co/tp8Mxrd9/car3.png", tag: "202" },  
      { src: "https://i.ibb.co/vtwFRhB/moto2.png", tag: "202" },  
      { src: "https://i.ibb.co/kVQVS7yD/car4.png", tag: "202" },  
      { src: "https://i.ibb.co/1f3FBvb9/montanha2.png", tag: "404" },  
      { src: "https://i.ibb.co/8LztFZt4/montanha.png", tag: "404" },  
      { src: "https://i.ibb.co/XZwwyFZq/arvore.png", tag: "404" },  
      { src: "https://i.ibb.co/ZDG821x/arvore2.png", tag: "404" },  
      { src: "https://thumbs.dreamstime.com/b/rocha-ou-pedra-grande-na-montanha-118007979.jpg", tag: "404" }  
    ]  
  },  
  {  
    label: "Clique nas imagens contendo um animal",  
    correctTag: "706",  
    images: [  
      { src: "https://i.ibb.co/PZPW0gzR/elefante.jpg", tag: "706" },  
      { src: "https://i.ibb.co/zHZ6BhsR/cavalo.jpg", tag: "706" },  
      { src: "https://i.ibb.co/Nw9HKGp/leao.jpg", tag: "706" },  
      { src: "https://i.ibb.co/VcBzNJsw/rino.jpg", tag: "706" },  
      { src: "https://i.ibb.co/0jr3fwBd/girafa.jpg", tag: "706" },  
      { src: "https://i.ibb.co/WNh2CsLC/torta.png", tag: "1412" },  
      { src: "https://i.ibb.co/BHvGC4Cr/cookie.png", tag: "1412" },  
      { src: "https://i.ibb.co/35sfVQvY/donuts.png", tag: "1412" },  
      { src: "https://i.ibb.co/rRT6hz08/bolo.png", tag: "1412" }  
    ]  
  }  
];  
  
// ===== UTIL =====  
function shuffle(array) {  
  for (let i = array.length - 1; i > 0; i--) {  
    const j = Math.floor(Math.random() * (i + 1));  
    [array[i], array[j]] = [array[j], array[i]];  
  }  
  return array;  
}  
  
let pendingVote = null;  
  
function generateCaptcha() {
  captchaGrid.innerHTML = "";
  statusEl.textContent = "";
  verifyBtn.disabled = true;

  const prompt = prompts[Math.floor(Math.random() * prompts.length)];
  captchaCurrentPrompt = prompt;
  captchaInstruction.textContent = prompt.label;

  const imagensCorretas = prompt.images.filter(img => img.tag === prompt.correctTag);
  const referencia = shuffle([...imagensCorretas])[0];
  document.getElementById("captcha-ref-img").src = referencia.src;

  const correctImages = prompt.images.filter(img => img.tag === prompt.correctTag);
  const wrongImages = prompt.images.filter(img => img.tag !== prompt.correctTag);
  const correctCount = Math.floor(Math.random() * 3) + 2;
  const selectedCorrect = shuffle([...correctImages]).slice(0, correctCount);
  const selectedWrong = shuffle([...wrongImages]).slice(0, 9 - correctCount);
  const allImages = shuffle([...selectedCorrect, ...selectedWrong]);

  allImages.forEach(img => {
    const imgEl = document.createElement("img");
    imgEl.src = img.src;
    imgEl.className = "captcha-img";
    imgEl.dataset.hash = hashTag(img.tag);

    imgEl.addEventListener("click", () => {
      imgEl.classList.toggle("selected");
      verifyBtn.disabled = !document.querySelector(".captcha-img.selected");
      statusEl.textContent = "";
    });

    captchaGrid.appendChild(imgEl);
  });
}

  
function hashTag(tag) {  
  const secret = "CPTX_2025_FSHOW_🔥";  
  let h = 0;  
  const str = tag + secret;  
  
  for (let i = 0; i < str.length; i++) {  
    h = (h << 5) - h + str.charCodeAt(i);  
    h |= 0;  
  }  
  
  return h;  
}  
  
let captchaCurrentPrompt = null;  
  
function abrirCaptcha() {
  if (captchaLocked || captchaAberto) return; 

  captchaLocked = true;
  captchaAberto = true;

etapaCaptcha = 1;  
  atualizarDots(); 
  
  generateCaptcha();
  popupCaptcha.classList.add("active");

  botaoCaptcha.setAttribute("aria-pressed", "false");
  botaoVotar.disabled = true;
  statusEl.textContent = "";

  setTimeout(() => {
    captchaLocked = false;
  }, 300);
  
  etapaCaptcha = 1;

function atualizarDots() {
  dot1.className = "dot";
  dot2.className = "dot";

  if (etapaCaptcha === 1) {
    dot1.classList.add("white");
  }

  else if (etapaCaptcha === 2) {
    dot1.classList.add("green");
    dot2.classList.add("white");
  }
}

}
  
function fecharCaptcha() {
  popupCaptcha.classList.remove("active");
  botaoVotar.disabled = false;
  captchaAberto = false; 
}
  
refreshBtn.addEventListener("click", () => {  
  statusEl.textContent = "";  
  statusEl.style.color = "";  
  document.querySelectorAll(".captcha-img").forEach(img => {  
    img.classList.remove("selected");  
  });  
  verifyBtn.disabled = true;  
  generateCaptcha();  
  refreshBtn.style.opacity = "0.7";  
  setTimeout(() => refreshBtn.style.opacity = "1", 200);  
});  
  
let etapaCaptcha = 1; 

const dot1 = document.getElementById("dot1");
const dot2 = document.getElementById("dot2");

function atualizarDots() {
  if (!dot1 || !dot2) return;

  dot1.classList.remove("white", "green", "active");
  dot2.classList.remove("white", "green", "active");

  if (etapaCaptcha === 1) {
    dot1.classList.add("green");
  } else if (etapaCaptcha === 2) {
    dot1.classList.add("green");
    dot2.classList.add("white");
  } else {
  }
}


verifyBtn.addEventListener("click", () => {
  let sucesso = true;
  const imgs = document.querySelectorAll(".captcha-img");
  const corretoHash = hashTag(captchaCurrentPrompt.correctTag);

  imgs.forEach(img => {
    const isCorrect = img.dataset.hash == corretoHash;
    const selecionado = img.classList.contains("selected");
    if (isCorrect !== selecionado) sucesso = false;
  });

  if (!sucesso) {
    etapaCaptcha = 1;
    setTimeout(() => generateCaptcha(), 1200);
    return;
  }

 if (sucesso && etapaCaptcha === 1) {
  etapaCaptcha = 2;
  atualizarDots();   
    setTimeout(() => {
      statusEl.textContent = "";
      generateCaptcha();
    }, 900);

    return;
  }

if (sucesso && etapaCaptcha === 2) {
  etapaCaptcha = 1;
  atualizarDots();  

    setVotosRestantes(VOTOS_POR_CAPTCHA);
    botaoCaptcha.setAttribute("aria-pressed", "true");
    botaoVotar.disabled = false;
    botaoVotar.classList.add("active");
    suspeita = 0;
    tentativasVoto = 0;
    scrollsRecentes = 0;
    setTimeout(() => {
      fecharCaptcha();

      if (pendingVote) {
        const voto = pendingVote;
        pendingVote = null;
        setTimeout(() => submitVote(voto), 200);
      }
    }, 900);
  }
});

  
async function submitVote(participante) {  
  try {  
    botaoVotar.disabled = true;  
    const prevText = botaoVotar.textContent;  
    botaoVotar.textContent = "Enviando voto...";  
  
    await new Promise(resolve => setTimeout(resolve, 600));  
  
    const votosParaEnviar = [  
      { participante },
      { participante }
    ];  
  
    //TABLE  
    const { data, error } = await supabase  
      .from("agc9")  
      .insert(votosParaEnviar);  
  
    if (error) {  
  console.error("Supabase error:", error);  
  window.location.href = "erro.html";  
  return;  
}  
  
    let restantes = getVotosRestantes() - 1;  
    if (restantes <= 0) {  
      setVotosRestantes(0);  
      botaoCaptcha.setAttribute("aria-pressed", "false");  
      botaoVotar.classList.remove("active");  
    } else {  
      setVotosRestantes(restantes);  
    }  
  
votoTela.style.display = "none";
confirmTela.style.display = "flex";
nomeConfirm.textContent = participante;

const fotos = {
  "Alysson": "https://i.ibb.co/MyshVLrG/Alysson.jpg",
  "Cícero": "https://i.ibb.co/6xLnxRL/C-cero.jpg",
  "Davi": "https://i.ibb.co/BHstzy4t/Davi.jpg",
  "Davi José": "https://i.ibb.co/N2XkzhZc/Davi-Jos-2.jpg",
  "Emanuel": "https://i.ibb.co/6cQN4Wm5/Emanuel-2.jpg",
  "Eueu": "https://i.ibb.co/svNCVQZK/Eueu.jpg",
  "Flávia": "https://i.ibb.co/39W3Ld2t/Fl-via.jpg",
  "Gean": "https://i.ibb.co/mr6sTbPM/Gean.jpg",
  "Koyuh": "https://i.ibb.co/dwk3psBx/Koyuh.jpg",
  "Luddy": "https://i.ibb.co/TxTpFBJC/Luddi.jpg",
  "Ludmila": "https://i.ibb.co/wrWB49Nd/Ludmila.jpg",
  "Mariana": "https://i.ibb.co/YFsn03Jc/Mariana.jpg",
  "Mikael": "https://i.ibb.co/Pskfn3Sm/Mikkael.jpg",
  "Rodrigo": "https://i.ibb.co/VphZh0pX/Rodrigo.jpg",
  "Rose": "https://i.ibb.co/GvFbbHkf/Rose-1-2.jpg",
  "Tekitos": "https://i.ibb.co/F4NLs8TT/Tekitos.jpg"
};

fotoConfirm.src = fotos[participante] || "";

botaoVotar.textContent = prevText;
botaoVotar.disabled = false;
console.log("Seu voto foi enviado para:", participante);
  
  
  } catch (err) {  
    console.error("Erro submitVote:", err);  
    alert("Erro inesperado. Tente novamente.");  
    botaoVotar.disabled = false;  
    botaoVotar.textContent = "Votar";  
  }  
}  
  
botaoVotar.addEventListener("click", (e) => {  
  e.preventDefault();  
  const escolhidoEl = document.querySelector('input[name="vote"]:checked');  
  if (!escolhidoEl) {  
    alert("Selecione um participante antes de votar!");  
    return;  
  }  
  const participante = escolhidoEl.value;  
  
  if (getVotosRestantes() <= 0) {  
    pendingVote = participante;  
    abrirCaptcha();
    return;  
  }  
  
  submitVote(participante);  
});  
  
botaoCaptcha.addEventListener("click", () => {  
  if (botaoCaptcha.getAttribute("aria-pressed") === "true") return;  
  
  if (getVotosRestantes() > 0) {  
      
    botaoCaptcha.setAttribute("aria-pressed", "true");  
    botaoVotar.disabled = false;  
    botaoVotar.classList.add("active");  
  } else {  
  
    abrirCaptcha();  
  }  
});  

// ============================
// Captcha Security
// ============================

let suspeita = 0;
const LIMITE_SUSPEITA = 6;
let ultimoClique = 0;
let ultimoMouseX = 0, ultimoMouseY = 0;
let ultimaTrocaAba = Date.now();
let scrollsRecentes = 0;
let tentativasVoto = 0;

function exigirCaptchaPorSuspeita() {
  if (captchaAberto) return; 
  console.warn("⚠ Atividade suspeita detectada — novo CAPTCHA exigido!");

  setVotosRestantes(0); 
  botaoCaptcha.setAttribute("aria-pressed", "false");
  botaoVotar.disabled = true;
  botaoVotar.classList.remove("active");

  abrirCaptcha();
}

// ============================
// 1) DETECTA CLIQUES MUITO RÁPIDOS
// ============================
document.addEventListener("click", () => {
  const agora = Date.now();
  if (agora - ultimoClique < 50) {
    suspeita++;
  }
  ultimoClique = agora;

  if (suspeita >= LIMITE_SUSPEITA) exigirCaptchaPorSuspeita();
});

// ============================
// 2) DETECTA MOVIMENTAÇÃO DO MOUSE 
// ============================
document.addEventListener("mousemove", (e) => {
  const dx = Math.abs(e.clientX - ultimoMouseX);
  const dy = Math.abs(e.clientY - ultimoMouseY);
  if (dx > 350 || dy > 350) {
    suspeita++;
  }

  ultimoMouseX = e.clientX;
  ultimoMouseY = e.clientY;

  if (suspeita >= LIMITE_SUSPEITA) exigirCaptchaPorSuspeita();
});

// ============================
// 3) DETECTA SCROLL FRENÉTICO (SCRIPT OU BOT)
// ============================
document.addEventListener("wheel", () => {
  scrollsRecentes++;
  if (scrollsRecentes > 14) {
    suspeita++;
    scrollsRecentes = 0;
  }

  if (suspeita >= LIMITE_SUSPEITA) exigirCaptchaPorSuspeita();
});

// ============================
// 4) DETECTA TROCA DE ABA 
// ============================
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    const agora = Date.now();
    if (agora - ultimaTrocaAba < 450) {
      suspeita++;
    }
    ultimaTrocaAba = agora;
  }

  if (suspeita >= LIMITE_SUSPEITA) exigirCaptchaPorSuspeita();
});

// ============================
// 5) SPAM 
// ============================
botaoVotar.addEventListener("click", () => {
  tentativasVoto++;
  if (tentativasVoto > 3) {
    suspeita++;
    tentativasVoto = 0;
  }

  if (suspeita >= LIMITE_SUSPEITA) exigirCaptchaPorSuspeita();
});

// ============================
// 6) ZERA SUSPEITA
// ============================
verifyBtn.addEventListener("click", () => {
  if (statusEl.textContent.includes("passou")) {
    suspeita = 0;
    tentativasVoto = 0;
    scrollsRecentes = 0;
  }
});

// ===== INIT =====  
(function initState() {  
  const restantes = getVotosRestantes();  
  
  botaoCaptcha.setAttribute("aria-pressed", "false");  
  botaoCaptcha.disabled = false;  
  
  botaoVotar.disabled = true;  
  botaoVotar.classList.remove("active");  
  
  if (restantes > 0) {  
    setVotosRestantes(restantes);  
  } else {  
    setVotosRestantes(0);  
  }  
})();  
  
</script> 
