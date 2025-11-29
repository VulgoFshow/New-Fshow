// =================== reCAPTCHA ======================
window.recaptchaCarregado = false;
window.recaptchaWidgets = {};

window.onloadCallback = function () {
  window.recaptchaCarregado = true;
};

// =================== FIREBASE ========================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const app = initializeApp({
  apiKey: "AIzaSyD6NAWtJ1bOD-vdVVbVQuf5440XaBkg6uaU",
  authDomain: "enquete-fa527.firebaseapp.com",
  projectId: "enquete-fa527",
  storageBucket: "enquete-fa527.firebasestorage.app",
  messagingSenderId: "544422121318",
  appId: "1:544422121318:web:e3d0412f7bf9740e7142a7"
});

const db = getFirestore(app);

// =================== VARIÁVEIS ========================
let escolha = null;
let escolhaImg = null;
let captchaToken = null;

// =================== POPUP ============================
const popup = document.getElementById("popupVoto");
const popupNome = document.getElementById("popupNome");
const popupImg = document.getElementById("popupImg");

// =================== FUNÇÕES EXTRAS ====================
window.recarregarEnquete = function () {
  const caixa = document.querySelector(".caixa-enquete");

  popup.classList.remove("ativo");
  caixa.style.opacity = "0";

  fetch(window.location.href)
    .then(res => res.text())
    .then(html => {
      const temp = document.createElement("div");
      temp.innerHTML = html;

      const nova = temp.querySelector(".caixa-enquete");
      if (nova) caixa.innerHTML = nova.innerHTML;

      caixa.style.opacity = "1";
    });
};

window.abrirResultadoNaCaixa = function (url) {
  const caixa = document.querySelector(".caixa-enquete");

  fetch(url)
    .then(res => res.text())
    .then(html => {
      caixa.innerHTML = html;
    });

  popup.classList.remove("ativo");
};

// =================== SISTEMA ===========================
document.addEventListener("DOMContentLoaded", () => {

  const wrappers = document.querySelectorAll(".opcao-wrapper");
  const headerNome = document.getElementById("selecionadoNome");

  wrappers.forEach(wrapper => {
    const radio = wrapper.querySelector("input[type=radio]");
    const votarBtn = wrapper.querySelector(".botao");
    const processando = wrapper.querySelector(".processando");
    const captchaContainer = wrapper.querySelector(".captcha-widget");

    votarBtn.disabled = true;
    votarBtn.classList.add("desativado");

    // ================= CLICK NA OPÇÃO ====================
    wrapper.querySelector(".opcao").addEventListener("click", () => {

      // limpar todas as opções
      wrappers.forEach(w => {
        w.classList.remove("ativo");
        w.querySelector(".botao").disabled = true;
        w.querySelector(".botao").classList.add("desativado");
        w.querySelector(".captcha-widget").innerHTML = "";
      });

      wrapper.classList.add("ativo");
      radio.checked = true;

      escolha = wrapper.dataset.nome;
      escolhaImg = wrapper.dataset.img;

      headerNome.innerText = escolha;

      captchaToken = null;
      votarBtn.disabled = true;
      votarBtn.classList.add("desativado");

      // cria o container do captcha
      captchaContainer.innerHTML = `<div id="recaptcha-${escolha}"></div>`;

      // aguarda o reCAPTCHA carregar
      const esperar = setInterval(() => {
        if (window.grecaptcha && window.recaptchaCarregado) {
          clearInterval(esperar);

          // se já existe → resetar
          if (window.recaptchaWidgets[escolha] !== undefined) {
            grecaptcha.reset(window.recaptchaWidgets[escolha]);
          } else {
            window.recaptchaWidgets[escolha] = grecaptcha.render(`recaptcha-${escolha}`, {
              sitekey: "6LceYRgsAAAAAER3wwtNOWHTDl0n86O-wV8fnaDg",
              callback: token => {
                captchaToken = token;
                votarBtn.disabled = false;
                votarBtn.classList.remove("desativado");
              }
            });
          }

        }
      }, 150);

    });

    // ================= BOTÃO VOTAR =======================
    votarBtn.addEventListener("click", async () => {
      if (!captchaToken) return;

      votarBtn.disabled = true;
      votarBtn.classList.add("desativado");
      processando.style.display = "block";

      const quantidade = Math.floor(Math.random() * 3) + 3;

      for (let i = 0; i < quantidade; i++) {
        await addDoc(collection(db, "finalagc4"), {
          participante: escolha,
          horario: serverTimestamp()
        });
      }

      popupNome.innerText = escolha;
      popupImg.src = escolhaImg;
      popup.classList.add("ativo");
    });

  });

});
