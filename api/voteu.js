import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();

const ABERTURA = new Date("2026-01-18T19:00:00-03:00");
const ENCERRAMENTO = new Date("2026-01-19T19:00:00-03:00");

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { participante, collection } = req.body;

    if (!participante || !collection) {
      return res.status(400).end();
    }

    const agora = new Date();
    if (agora < ABERTURA || agora > ENCERRAMENTO) {
      return res.sendStatus(410);
    }

    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress;

    const votoRef = db
      .collection("votacoes")
      .doc(collection)
      .collection("votos")
      .doc(ip);

    const jaVotou = await votoRef.get();
    if (jaVotou.exists) {
      return res.status(403).end();
    }

    await votoRef.set({
      participante,
      ip,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const contadorRef = db
      .collection("votacoes")
      .doc(collection)
      .collection("contador")
      .doc(participante);

    await contadorRef.set(
      { total: admin.firestore.FieldValue.increment(1) },
      { merge: true }
    );

    return res.status(200).end();
  } catch (err) {
    console.error("Erro no voto:", err);
    return res.status(500).end();
  }
}
