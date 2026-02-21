# Sistema de Contas - TODO

## Fase 1: Banco de Dados e Autenticação
- [x] Estender schema de usuários com campos de email/senha, apelido e foto de perfil
- [x] Criar helpers de hash de senha e validação
- [x] Implementar queries de banco de dados para usuários

## Fase 2: Autenticação por Email/Senha
- [x] Criar procedimento tRPC de registro (signup)
- [x] Criar procedimento tRPC de login
- [x] Implementar validação de formulários
- [x] Criar página de registro com formulário
- [x] Criar página de login com formulário

## Fase 3: Upload de Fotos de Perfil
- [x] Implementar upload de imagens para S3
- [x] Criar procedimento tRPC para upload de foto
- [x] Adicionar preview de imagem antes do upload
- [x] Validar tipo e tamanho de arquivo

## Fase 4: Interface Elegante
- [x] Criar header/navegação global com foto e apelido do usuário
- [x] Criar página de perfil do usuário
- [x] Criar componente de proteção de rotas
- [x] Implementar redirecionamento para login
- [x] Estilizar com design elegante e perfeito

## Fase 5: Testes
- [x] Testar fluxo de registro
- [x] Testar fluxo de login
- [x] Testar upload de foto
- [x] Testar proteção de rotas
- [x] Testar persistência de sessão

## Fase 6: Entrega
- [ ] Revisar todo o sistema
- [ ] Criar checkpoint final
- [ ] Entregar ao usuário
