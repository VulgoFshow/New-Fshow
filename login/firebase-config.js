// Firebase Configuration
// Substitua com suas credenciais do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDemoKeyForTesting123456789",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get references
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Helper functions
function getCurrentUser() {
  return new Promise((resolve) => {
    auth.onAuthStateChanged((user) => {
      resolve(user);
    });
  });
}

function isUserLoggedIn() {
  return new Promise((resolve) => {
    auth.onAuthStateChanged((user) => {
      resolve(!!user);
    });
  });
}

async function getUserProfile(uid) {
  try {
    const doc = await db.collection('users').doc(uid).get();
    if (doc.exists) {
      return doc.data();
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return null;
  }
}

async function updateUserProfile(uid, data) {
  try {
    await db.collection('users').doc(uid).set(data, { merge: true });
    return true;
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return false;
  }
}

async function uploadProfilePicture(uid, file) {
  try {
    const storageRef = storage.ref(`profile-pictures/${uid}`);
    const snapshot = await storageRef.put(file);
    const downloadUrl = await snapshot.ref.getDownloadURL();
    return downloadUrl;
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    return null;
  }
}

function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

function redirectTo(page) {
  window.location.href = page;
}
