# Sistema de Contas com Firebase

Um sistema elegante e simplificado de autenticação e perfil de usuário usando **Firebase** como backend. Totalmente baseado em **HTML, CSS e JavaScript puro** - sem dependências externas!

## 🚀 Funcionalidades

- ✅ **Autenticação por Email/Senha** - Registro e login seguros com Firebase Authentication
- ✅ **Perfil de Usuário** - Edição de apelido, visualização de informações da conta
- ✅ **Upload de Fotos de Perfil** - Armazenamento seguro em Firebase Storage
- ✅ **Navegação Global** - Header elegante com informações do usuário em todas as páginas
- ✅ **Proteção de Rotas** - Redirecionamento automático para login se não autenticado
- ✅ **Design Responsivo** - Interface elegante que funciona em desktop, tablet e mobile
- ✅ **Validações em Tempo Real** - Feedback imediato de erros de formulário

## 📁 Estrutura de Arquivos

```
sistema_contas_firebase/
├── index.html              # Página inicial/home
├── signup.html             # Página de registro
├── login.html              # Página de login
├── profile.html            # Página de perfil do usuário
├── firebase-config.js      # Configuração e funções compartilhadas do Firebase
└── README.md               # Este arquivo
```

## ⚙️ Configuração do Firebase

### 1. Criar um Projeto Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Criar projeto"
3. Digite o nome do seu projeto (ex: "sistema-contas")
4. Clique em "Continuar"

### 2. Habilitar Autenticação

1. No painel do Firebase, vá para **Authentication**
2. Clique em "Get started"
3. Selecione "Email/Password" como método de autenticação
4. Habilite a opção "Email/Password"
5. Clique em "Save"

### 3. Criar Banco de Dados Firestore

1. No painel do Firebase, vá para **Firestore Database**
2. Clique em "Create database"
3. Selecione "Start in test mode" (para desenvolvimento)
4. Escolha a localização (ex: "South America - São Paulo")
5. Clique em "Create"

### 4. Habilitar Storage

1. No painel do Firebase, vá para **Storage**
2. Clique em "Get started"
3. Aceite as regras padrão
4. Clique em "Done"

### 5. Obter Credenciais

1. No painel do Firebase, clique em **Project Settings** (ícone de engrenagem)
2. Vá para a aba **Your apps**
3. Clique em **Web** (ícone `</>`), ou crie um novo app web
4. Copie o objeto `firebaseConfig`
5. Cole em `firebase-config.js` substituindo o objeto `firebaseConfig` existente

**Exemplo de firebaseConfig:**
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDemoKeyForTesting123456789",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

## 🔐 Regras de Segurança (Importante!)

### Firestore Rules

Vá para **Firestore Database > Rules** e substitua pelas regras abaixo:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

### Storage Rules

Vá para **Storage > Rules** e substitua pelas regras abaixo:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profile-pictures/{userId} {
      allow read: if true;
      allow write: if request.auth.uid == userId;
    }
  }
}
```

## 🎯 Como Usar

### Desenvolvimento Local

1. Clone ou baixe os arquivos
2. Configure o Firebase (veja seção acima)
3. Abra `index.html` em um navegador web
4. Pronto! O sistema está funcionando

### Deploy

Você pode fazer deploy de várias formas:

#### Opção 1: Firebase Hosting (Recomendado)

```bash
# Instale Firebase CLI
npm install -g firebase-tools

# Faça login
firebase login

# Inicialize o projeto
firebase init hosting

# Deploy
firebase deploy
```

#### Opção 2: GitHub Pages

1. Crie um repositório no GitHub
2. Faça upload dos arquivos
3. Vá para **Settings > Pages**
4. Selecione a branch principal
5. Clique em Save

#### Opção 3: Qualquer servidor web

Basta fazer upload dos arquivos para qualquer servidor web (Apache, Nginx, etc.)

## 📋 Estrutura de Dados Firestore

### Coleção: `users`

```json
{
  "email": "usuario@email.com",
  "nickname": "seu_apelido",
  "photoURL": "https://...",
  "createdAt": "2024-02-20T...",
  "updatedAt": "2024-02-20T..."
}
```

## 🎨 Personalização

### Cores

Edite as cores no CSS de cada página. As cores principais são:

- **Azul Primário**: `#2563eb`
- **Cinza Escuro**: `#1f2937`
- **Cinza Claro**: `#6b7280`

### Fontes

A fonte padrão é a pilha de fontes do sistema. Para mudar, edite:

```css
body {
  font-family: 'Sua Fonte', sans-serif;
}
```

## 🐛 Troubleshooting

### "Firebase is not defined"

- Certifique-se de que os scripts do Firebase estão carregando corretamente
- Verifique se a conexão com a internet está funcionando

### "Permission denied" ao fazer upload de foto

- Verifique as regras de Storage no Firebase Console
- Certifique-se de que o usuário está autenticado

### Perfil não carrega

- Verifique se o documento do usuário existe no Firestore
- Certifique-se de que as regras do Firestore permitem leitura

## 📱 Responsividade

O sistema é totalmente responsivo e funciona em:

- ✅ Desktop (1920px+)
- ✅ Tablet (768px - 1024px)
- ✅ Mobile (320px - 767px)

## 🔒 Segurança

- Senhas são criptografadas automaticamente pelo Firebase
- Tokens de sessão são gerenciados pelo Firebase
- Fotos são armazenadas com controle de acesso
- Dados sensíveis nunca são expostos no frontend

## 📞 Suporte

Para problemas com Firebase, consulte:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Console](https://console.firebase.google.com/)

## 📄 Licença

Este projeto é de código aberto e pode ser usado livremente.

---

**Desenvolvido com ❤️ usando Firebase e HTML/CSS/JS puro**
