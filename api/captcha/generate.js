import crypto from "crypto";

const CAPTCHA_SALT = process.env.CAPTCHA_SALT;

const PROMPTS = [
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
      { src: "https://i.ibb.co/ZDG821x/arvore2.png", tag: "404" }
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
      { src: "https://i.ibb.co/35sfVQvY/donuts.png", tag: "1412" }
    ]
  }
];

const CAPTCHA_STORE = new Map();

function hash(value) {
  return crypto.createHash("sha256").update(value + CAPTCHA_SALT).digest("hex");
}

export default function handler(req, res) {
  const prompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];

  const captchaId = crypto.randomUUID();
  const answerHash = hash(prompt.correctTag);

  CAPTCHA_STORE.set(captchaId, {
    answerHash,
    expires: Date.now() + 90_000,
    used: false,
    ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress
  });

  res.json({
    captchaId,
    label: prompt.label,
    images: prompt.images.map(i => ({ src: i.src }))
  });
}

export { CAPTCHA_STORE, hash };
