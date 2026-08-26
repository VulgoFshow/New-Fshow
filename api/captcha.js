import crypto from "crypto";

const CAPTCHA_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY;

const prompts = [
  {
    label: "Clique nas imagens contendo algo que pode se locomover",
    correctTag: "202",
    images: [
      { src: "https://i.postimg.cc/DwJSK9qP/car1v2.jpg", tag: "202" },
      { src: "https://i.postimg.cc/Sx2npBWV/car2v2.png", tag: "202" },
      { src: "https://i.postimg.cc/FHdYQMjD/moto1v2.png", tag: "202" },
      { src: "https://i.postimg.cc/T3LKXzrq/moto2v2.jpg", tag: "202" },
      { src: "https://i.postimg.cc/6QV5WtTH/secador.jpg", tag: "404" },
      { src: "https://github.com/VulgoFshow/New-Fshow/blob/main/fotos/captcha/cap1/banheiro/papel-higi%C3%AAnico.jpg?raw=true", tag: "404" },
      { src: "https://github.com/VulgoFshow/New-Fshow/blob/main/fotos/captcha/cap1/banheiro/toalha.jpg?raw=true", tag: "404" },
      { src: "https://github.com/VulgoFshow/New-Fshow/blob/main/fotos/captcha/cap1/banheiro/sabonete.jpg?raw=true", tag: "404" },
      { src: "https://github.com/VulgoFshow/New-Fshow/blob/main/fotos/captcha/cap1/banheiro/escova-de-dentes.jpg?raw=true", tag: "404" }
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
      { src: "https://i.postimg.cc/x8Dwcb7X/cereais.png", tag: "1412" },
      { src: "https://i.ibb.co/WNh2CsLC/torta.png", tag: "1412" },
      { src: "https://i.ibb.co/BHvGC4Cr/cookie.png", tag: "1412" },
      { src: "https://i.postimg.cc/Fs2907LD/9l1Tp.jpg", tag: "1412" },
      { src: "https://i.postimg.cc/d3PbLTX7/bolo.png", tag: "1412" }
    ]
  }
];

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}

function criarToken(payload) {
  const texto = JSON.stringify(payload);

  const iv = crypto.randomBytes(16);

  const chave = crypto
    .createHash("sha256")
    .update(CAPTCHA_SECRET)
    .digest();

  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    chave,
    iv
  );

  let encrypted = cipher.update(texto, "utf8", "hex");
  encrypted += cipher.final("hex");

  return `${iv.toString("hex")}:${encrypted}`;
}

export default async function handler(req, res) {

  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Método não permitido"
    });
  }

  try {

    const prompt = prompts[crypto.randomInt(prompts.length)];

    // Criamos os IDs ANTES de embaralhar.
    const images = prompt.images.map((img, index) => ({
      src: img.src,
      id: index
    }));

    // Descobrimos quais IDs são corretos.
    const correctIds = images
      .filter((img, index) => {
        return prompt.images[index].tag === prompt.correctTag;
      })
      .map(img => img.id);

    // Agora embaralhamos as imagens.
    shuffle(images);

    const captchaId = crypto
      .randomBytes(16)
      .toString("hex");

    const payload = {
      captchaId,
      correctIds,
      createdAt: Date.now()
    };

    const token = criarToken(payload);

    return res.status(200).json({
      success: true,
      instruction: prompt.label,
      images,
      token
    });

  } catch (error) {

    console.error("Erro ao gerar CAPTCHA:", error);

    return res.status(500).json({
      error: "Erro ao gerar CAPTCHA"
    });
  }
}
