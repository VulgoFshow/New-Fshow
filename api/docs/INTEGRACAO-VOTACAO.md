# Integração segura da votação

O projeto agora coloca o servidor entre o navegador e o Supabase. O navegador conhece apenas os endpoints `/api/voting/*`; a URL do Supabase, a chave `service_role`, o nome da tabela e os detalhes de falha permanecem exclusivamente no ambiente do servidor.

## Variáveis de ambiente

| Variável | Obrigatória | Finalidade |
|---|---:|---|
| `SUPABASE_URL` | Sim | URL privada de integração com o projeto Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Chave secreta usada apenas pelo backend para gravar votos. Nunca deve ser enviada ao cliente. |
| `VOTATION_TABLE` | Sim | Tabela de destino; no HTML antigo, o valor era `cdbnc`. |
| `VOTATION_START` | Não | Início da votação em ISO 8601; padrão: `2026-01-18T19:00:00-03:00`. |
| `VOTATION_END` | Não | Encerramento em ISO 8601; padrão: `2026-08-25T19:00:00-03:00`. |
| `VOTOS_POR_CAPTCHA` | Não | Quantidade de linhas gravadas por voto; padrão: `10`, preservando o comportamento atual. |
| `CAPTCHA_CHALLENGE_TTL_MS` | Não | Validade do desafio e do token; padrão: `180000` ms. |
| `VOTING_RATE_LIMIT_WINDOW_MS` | Não | Janela do limite por origem; padrão: `60000` ms. |
| `VOTING_RATE_LIMIT_MAX` | Não | Máximo de tentativas por origem na janela; padrão: `20`. |

Não coloque essas variáveis em `VITE_*`, em arquivos públicos, no HTML ou em código executado no navegador. Em produção, configure-as no painel de secrets do servidor.

## Contrato dos endpoints

| Método e rota | Entrada | Resposta pública |
|---|---|---|
| `GET /api/voting/captcha` | Nenhuma | `challengeId`, `prompt`, imagens com IDs opacos e `expiresInMs`. A resposta não contém a solução. |
| `POST /api/voting/captcha/verify` | `{ challengeId, selectedIds }` | `verificationToken` temporário e de uso único quando a seleção estiver correta. |
| `POST /api/voting/vote` | `{ participant, verificationToken }` | `{ ok: true }` após validação do participante, janela de votação, origem, expiração e gravação. |

As rotas respondem com uma mensagem genérica em caso de falha. O frontend não recebe mensagens, códigos ou nomes de tabelas do Supabase.

## Ajustes no HTML antigo

Remova completamente a importação de `@supabase/supabase-js`, as constantes `SUPABASE_URL`, `SUPABASE_KEY`, `TABLE_VOTACAO`, a chamada `createClient(...)` e qualquer `.from(...).insert(...)`. Remova também o segredo usado pela função `hashTag`; essa proteção local não deve ser usada como autorização.

No lugar da validação local do CAPTCHA, o botão de CAPTCHA deve chamar `GET /api/voting/captcha`, renderizar `prompt` e `images`, enviar os IDs selecionados para `POST /api/voting/captcha/verify` e guardar apenas o `verificationToken` recebido. No envio, substitua a inserção direta por:

```js
await fetch("/api/voting/vote", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    participant: escolhido.value,
    verificationToken
  })
});
```

O HTML não deve exibir `error.message` do Supabase nem sugerir ajustes de RLS, tabela ou credenciais. Use uma mensagem neutra como “Não foi possível registrar o voto. Tente novamente.”

## Limitações e operação

O rate limit atual é intencionalmente simples e mantém estado em memória do processo. Ele atende à proteção básica pedida, mas, se houver múltiplas instâncias ou tráfego elevado, deve ser substituído por um limitador compartilhado, como Redis, e o token temporário deve ser persistido em armazenamento compartilhado.

A chave `service_role` concede privilégios elevados no Supabase. Ela deve ser rotacionada se já tiver sido publicada no HTML ou em um repositório. O backend grava somente o participante permitido e não aceita nome de tabela, quantidade de votos ou SQL vindos do navegador.
