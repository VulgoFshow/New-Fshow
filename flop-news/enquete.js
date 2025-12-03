<script type="module">

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

/* ========== FIREBASE CONFIG ========== */
const firebaseConfig = {
  apiKey: "AIzaSyD6NAWtJ1bOD-vdVVbVQuf5440XaBkg6uaU",
  authDomain: "enquete-fa527.firebaseapp.com",
  projectId: "enquete-fa527",
  storageBucket: "enquete-fa527.firebasestorage.app",
  messagingSenderId: "544422121318",
  appId: "1:544422121318:web:e3d0412f7bf9740e7142a7"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ========== ELEMENTOS ========== */
const participantes = Array.from(document.querySelectorAll(".participante"));
const popupConfirmacao = document.getElementById("popupConfirmacao");
const popupResultados = document.getElementById("popupResultados");
const resultadoLista = document.getElementById("resultadoLista");

/* Inicializa data-votos se não tiver */
participantes.forEach(p => {
  if (!p.dataset.votos) p.dataset.votos = 0;
});

/* ========== UI: ripple + abrir/fechar ========== */
let participanteSelecionado = null;
function criarRipple(event) {
  const info = event.currentTarget;
  info.classList.add("ripple");
  setTimeout(() => info.classList.remove("ripple"), 600);
}

function abrir(p) {
  p.classList.add("selecionado");
  p.querySelector(".captcha-wrapper").classList.add("aberto");
  const btn = p.querySelector(".btn-votar");
  btn.classList.add("habilitado");
  btn.disabled = false;
}

function fechar(p) {
  p.classList.remove("selecionado");
  p.querySelector(".captcha-wrapper").classList.remove("aberto");
  const btn = p.querySelector(".btn-votar");
  btn.classList.remove("habilitado");
  btn.disabled = true;
}

participantes.forEach(participante => {
  const info = participante.querySelector(".info");
  info.addEventListener("click", criarRipple);
  info.addEventListener("click", () => {
    if (participante === participanteSelecionado) {
      fechar(participante);
      participanteSelecionado = null;
    } else {
      if (participanteSelecionado) fechar(participanteSelecionado);
      abrir(participante);
      participanteSelecionado = participante;
    }
  });
});

participantes.forEach(p => {
  const btn = p.querySelector(".btn-votar");
  btn.disabled = true;
});

/* ========== FIRESTORE: coleção única ========== */
const COLECAO_VOTOS = "fazendeiroenquete";

function conectarSnapshotVotos() {
  const ref = collection(db, COLECAO_VOTOS);
  onSnapshot(ref, snapshot => {

    // zera todos os votos antes de recalcular
    participantes.forEach(p => p.dataset.votos = 0);

    // soma os votos existentes no Firestore
    snapshot.forEach(doc => {
      const data = doc.data();
      const nome = data && data.nome;
      if (!nome) return;

      const p = document.querySelector(`.participante[data-nome="${nome}"]`);
      if (p) {
        p.dataset.votos = Number(p.dataset.votos) + 1;
      }
    });

    console.log("[onSnapshot] votos atualizados:", participantes.map(p => `${p.dataset.nome}: ${p.dataset.votos}`));
  }, err => {
    console.error("Erro onSnapshot votos:", err);
  });
}


conectarSnapshotVotos();

/* ========== Registrar voto (addDoc na mesma coleção) ========== */
async function registrarVoto(nome) {
  try {
    const p = document.querySelector(`.participante[data-nome="${nome}"]`);
    const btn = p.querySelector(".btn-votar");
    btn.disabled = true;
    btn.textContent = "Enviando...";

    await addDoc(collection(db, COLECAO_VOTOS), {
      nome: nome,
      timestamp: new Date()
    });

    console.log("Voto registrado no Firestore para:", nome);

    setTimeout(() => {
      if (btn) {
        btn.textContent = "Votar";
      }
    }, 700);

    return true;
  } catch (e) {
    console.error("Erro ao registrar voto:", e);
    alert("Erro ao registrar voto. Verifique regras do Firestore e console.");
    const p = document.querySelector(`.participante[data-nome="${nome}"]`);
    if (p) {
      const btn = p.querySelector(".btn-votar");
      btn.disabled = false;
      btn.textContent = "Votar";
    }
    return false;
  }
}


/* ========== integrar botão de votar ========== */
participantes.forEach(p => {
  const btn = p.querySelector(".btn-votar");

  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (btn.disabled) return;

    const nome = p.dataset.nome;
    const foto = p.querySelector(".foto").src;

    const ok = await registrarVoto(nome);
    if (!ok) return;

    // mostra popup confirmação
    document.getElementById("popupNome").textContent = nome;
    document.getElementById("popupFoto").src = foto;
    popupConfirmacao.classList.add("mostrar");

    participantes.forEach(pp => pp.querySelector(".info").style.pointerEvents = "none");
  });
});

/* ========== POPUP RESULTADOS ========== */
function abrirResultados() {
  resultadoLista.innerHTML = "";

  let total = 0;
  participantes.forEach(p => total += Number(p.dataset.votos || 0));

  if (total === 0) {
    resultadoLista.innerHTML = `<div style="text-align:center; color:#666; padding:20px;">Ainda não há votos.</div>`;
    popupResultados.classList.add("mostrar");
    return;
  }

  const arr = participantes.map(p => ({
    nome: p.dataset.nome,
    votos: Number(p.dataset.votos || 0),
    foto: p.querySelector(".foto").src
  }));
  arr.sort((a,b) => b.votos - a.votos);

  arr.forEach(item => {
    const pct = ((item.votos / total) * 100).toFixed(2);
    resultadoLista.innerHTML += `
      <div style="display:flex; align-items:center; margin-bottom:16px; gap:14px;">
        <img src="${item.foto}" style="width:62px; height:62px; border-radius:10px; object-fit:cover;">
        <div style="flex:1;">
          <div style="font-size:19px; font-weight:700;">${item.nome}</div>
          <div style="font-size:15px; color:#666;">
            ${item.votos} votos • ${pct}%
          </div>
        </div>
      </div>
    `;
  });

  popupResultados.classList.add("mostrar");
}
function fecharResultados() { popupResultados.classList.remove("mostrar"); }

window.abrirResultados = abrirResultados;
window.fecharResultados = fecharResultados;

/* ========== DEBUG helpers ========== */
window._ENQUETE_debug = {
  colecao: COLECAO_VOTOS,
  logParticipants: () => participantes.map(p => ({nome: p.dataset.nome, votos: p.dataset.votos}))
};

console.log("Script enquete iniciado. Coleção usada:", COLECAO_VOTOS);
console.log("Run _ENQUETE_debug.logParticipants() no console para ver contadores.");
</script>
