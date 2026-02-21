const firebaseConfig = {
  apiKey: "AIzaSyAeTHCWC7reX16rEwyWfbV7Qh8fcrCG3bw",
  authDomain: "fchat-60461.firebaseapp.com",
  databaseURL: "https://fchat-60461-default-rtdb.firebaseio.com",
  projectId: "fchat-60461",
  storageBucket: "fchat-60461.firebasestorage.app",
  messagingSenderId: "919618815528",
  appId: "1:919618815528:web:bcbbccb703e17cf5f4971d",
  measurementId: "G-15HYVM1QXV"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();
