# Sistema de Contas com Firebase + Cloudinary (100% GRATUITO)

Sistema minimalista de login, registro e upload de fotos usando:
- **Firebase** (autenticação e banco de dados - GRATUITO)
- **Cloudinary** (armazenamento de fotos - GRATUITO)

## Arquivos

- `index.html` - Página inicial com perfil e upload de foto
- `login.html` - Página de login
- `signup.html` - Página de registro
- `config.js` - Configuração do Firebase e Cloudinary

## Setup Rápido

### 1. Firebase (Autenticação)

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Crie um novo projeto
3. Vá para **Authentication** > **Sign-in method** > habilite **Email/Password**
4. Vá para **Firestore Database** > **Create database** (modo teste)
5. Copie suas credenciais em **Project Settings**
6. Cole em `config.js`

### 2. Cloudinary (Upload de Fotos - GRATUITO)

1. Crie uma conta em [Cloudinary](https://cloudinary.com) (plano gratuito)
2. Vá para **Settings** > **Upload**
3. Crie um **Upload Preset** (sem autenticação)
4. Copie seu **Cloud Name** e **Upload Preset**
5. Cole em `config.js`

### 3. Firestore Rules

Vá para **Firestore Database** > **Rules** e substitua por:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Clique em **Publish** para salvar.

## Pronto!

Abra `index.html` em um navegador. O sistema está funcionando.

## Preços

- **Firebase**: Gratuito até 1GB de dados
- **Cloudinary**: Gratuito até 25GB de armazenamento

Totalmente gratuito para começar!
