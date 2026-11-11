# Ares Aqua Invest

Aplicação de demonstração do **Ares Aquatics**, um parque aquático fictício em Marte. Reúne apresentação das atrações, comparação de cotas, consultor de IA, cadastro de interesse, reservas VIP e área do cliente.

Os valores em **coins**, rendimentos e reservas fazem parte da narrativa do projeto. O código registra interesses e reservas simuladas; não implementa pagamentos, compra efetiva de cotas ou distribuição de rendimentos.

## Conteúdo

- [Funcionalidades e rotas](#funcionalidades-e-rotas)
- [Administrador, clientes e visitantes](#administrador-clientes-e-visitantes)
- [Tecnologias e arquitetura](#tecnologias-e-arquitetura)
- [Execução local](#execução-local)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Banco de dados e migrações](#banco-de-dados-e-migrações)
- [Proteção contra abuso](#proteção-contra-abuso)
- [Comandos e validação](#comandos-e-validação)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Publicação e pendências](#publicação-e-pendências)

## Funcionalidades e rotas

| URL            | Acesso                    | Comportamento                                                                                           |
| -------------- | ------------------------- | ------------------------------------------------------------------------------------------------------- |
| `/`            | Público                   | Atrações, cotas Explorer/Terraformer/Imperador, assistente IA e formulários de interesse e reserva VIP. |
| `/auth`        | Público                   | Login com senha, criação de conta e envio de link mágico pelo Supabase Auth.                            |
| `/minha-conta` | Autenticado               | Consulta de interesses, status, reservas vinculadas à conta e até 20 análises recentes de IA.           |
| `/admin`       | Administrador autenticado | Leads, busca, indicadores, criação de clientes e atualização automática a cada 15 segundos.             |

O painel `/admin` exige autenticação e o papel de administrador verificado no servidor. Visitantes são enviados a `/auth` e clientes a `/minha-conta`. A função pública de leitura dos leads foi removida; chamadas diretas às funções administrativas também exigem autorização.

O segmento `_authenticated` organiza as rotas e não aparece na URL. O cadastro de interesse funciona sem login. Quando há um token válido, o servidor vincula o registro ao usuário verificado. A área do cliente também procura interesses pelo e-mail presente nas claims validadas; reservas e histórico usam `user_id`.

Após o cadastro de interesse ou a reserva, o atendimento continua com o atendente virtual na própria aplicação. O consultor de cotas utiliza a integração de IA para comparar as opções disponíveis.

## Administrador, clientes e visitantes

O administrador designado é **leila.puia@equipe.pixaflow.com**. O e-mail precisa estar confirmado pelo Supabase Auth. O cadastro público não permite selecionar papéis; metadados enviados pelo navegador não concedem privilégios.

| Perfil        | Como é definido                                                              | Acesso                                                                    |
| ------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Administrador | Conta confirmada do e-mail designado, vinculada pelo banco.                  | Painel `/admin`, leads e criação de contas de clientes.                   |
| Cliente       | Qualquer outra conta autenticada. O papel interno `user` representa cliente. | Seus próprios interesses, reservas e histórico em `/minha-conta`.         |
| Visitante     | Navegação sem login. Não é necessário criar uma conta de visitante.          | Conteúdo público, assistente e formulários sujeitos aos limites de envio. |

Para configurar o administrador:

1. Aplique `drizzle/migrations/0007_single_administrator.sql` com uma conexão proprietária, em uma transação. As migrações anteriores precisam estar aplicadas.
2. Habilite a confirmação de e-mail no Supabase Auth e configure as URLs de retorno para `/auth`.
3. Se a conta indicada já existe e está confirmada, a migração a reconhece. Se ainda não existe, crie-a em `/auth` e confirme o e-mail. Não tente recriar uma conta existente: use o login ou o link mágico.
4. Entre com essa conta: o login resolve o papel no servidor e abre `/admin`. Os demais usuários seguem para `/minha-conta`.

A migração preserva as contas existentes, converte administradores antigos de outros e-mails em clientes e impõe um papel por usuário e no máximo um administrador. A configuração fica em `app_private.administrator_settings`, sem acesso dos clientes. Alterar o e-mail de uma conta administradora para outro endereço revoga esse papel. O primeiro visitante cadastrado não recebe privilégios.

O formulário do painel cria somente clientes; não há opção de promover contas. A senha do administrador não é definida no código ou na migração. A criação de clientes pelo painel exige `SUPABASE_SERVICE_ROLE_KEY` no servidor; a consulta do papel usa o token do próprio usuário e a RPC `get_account_role`. Se a RPC estiver ausente ou indisponível, o acesso administrativo é negado.

## Tecnologias e arquitetura

| Camada               | Implementação                                                                    |
| -------------------- | -------------------------------------------------------------------------------- |
| Interface            | React 19, TypeScript, Tailwind CSS 4, componentes Radix/shadcn e Framer Motion.  |
| Aplicação            | TanStack Start, TanStack Router com rotas por arquivos e TanStack Query.         |
| Build                | Vite 8 e preset `@lovable.dev/vite-tanstack-config`, com Nitro no servidor.      |
| Dados e autenticação | Supabase/PostgreSQL e Supabase Auth; operações privadas via funções de servidor. |
| IA                   | Vercel AI SDK e Lovable AI Gateway, usando a API Responses.                      |
| Validação e testes   | Zod, Vitest, Testing Library e jsdom.                                            |
| Migrações            | SQL versionado em `drizzle/migrations`; configuração do Drizzle Kit na raiz.     |

```text
Formulário → esquema Zod compartilhado → função de servidor
  → verificação de limites no PostgreSQL
  → identificação opcional do usuário pelo token verificado
  → gravação com service role → confirmação na interface
```

As cotas e prioridades ficam em `src/lib/cotas.ts`, compartilhado entre interface e prompt. A integração de IA fica em módulos `*.server.ts`; as rotas chamam `analyzeCota`, sem acesso à chave privada. As interações são registradas em `historico_ia`; falhas nesse log não interrompem a resposta.

O middleware CSRF fica em `src/start.ts`. CSRF, validação de dados e bloqueio do botão durante o envio complementam o controle de abuso, mas não substituem limites no servidor.

## Execução local

### Pré-requisitos

- Node.js compatível com o Vite instalado: **20.19+ na linha 20, ou 22.12+ nas linhas posteriores**. Prefira uma versão LTS compatível.
- npm e um projeto Supabase com acesso às configurações de autenticação e às migrações.
- Credenciais do Lovable AI Gateway para utilizar o consultor de IA.

O repositório contém `package-lock.json` e `bun.lock`. Os comandos abaixo usam npm e seu lockfile; evite alternar gerenciadores na mesma alteração.

```bash
git clone https://github.com/PuiaCaraja/ares-aqua-invest.git
cd ares-aqua-invest
npm ci
```

O `.env` versionado foi incluído pelo Lovable e contém somente configurações públicas do backend. Preserve esse arquivo. Copie `.env.example` para `.env.local` e preencha as variáveis privadas e os valores públicos correspondentes ao mesmo projeto. O arquivo `.env.local` é ignorado pelo Git. Em PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Gere um segredo e coloque o resultado em `RATE_LIMIT_HASH_SECRET`:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Aplique as migrações antes de testar os formulários e a IA. Configure no Supabase Auth a URL do site e as URLs de redirecionamento para `/auth`, incluindo a origem local exibida pelo Vite. Habilite e-mail/senha e link mágico; o envio de confirmação depende da configuração de e-mail do Supabase.

```bash
node --env-file=.env --env-file=.env.local node_modules/vite/bin/vite.js dev
```

Esse comando carrega também as variáveis privadas no processo Node. Se elas já estiverem exportadas no ambiente, use `npm run dev`. A leitura de `VITE_*` pelo Vite não substitui a configuração das variáveis privadas do servidor.

Abra a URL informada pelo terminal. A configuração compartilhada do Lovable pode ajustar host e porta; não presuma uma porta fixa.

## Variáveis de ambiente

O arquivo [.env.example](.env.example) contém apenas exemplos para `.env.local`. Use credenciais do mesmo projeto Supabase no navegador e no servidor. Nunca adicione segredos ao `.env` versionado; esse arquivo deve continuar limitado à configuração pública.

| Variável                        | Onde é usada     | Finalidade                                                                                                                  |
| ------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`             | Navegador        | URL pública do Supabase.                                                                                                    |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Navegador        | Chave publicável; o código não lê `VITE_SUPABASE_ANON_KEY`.                                                                 |
| `SUPABASE_URL`                  | Servidor         | URL do Supabase acessível pelo runtime.                                                                                     |
| `SUPABASE_PUBLISHABLE_KEY`      | Servidor         | Verificação dos tokens de sessão.                                                                                           |
| `SUPABASE_SERVICE_ROLE_KEY`     | Somente servidor | Operações privadas e RPC de limitação. Contorna RLS.                                                                        |
| `LOVABLE_API_KEY`               | Somente servidor | Acesso ao Lovable AI Gateway. Necessária para a IA.                                                                         |
| `RATE_LIMIT_HASH_SECRET`        | Somente servidor | Segredo aleatório com pelo menos 32 caracteres, igual em todas as instâncias. Obrigatório para IA e formulários protegidos. |
| `RATE_LIMIT_TRUSTED_IP_HEADER`  | Somente servidor | Opcional: `cf-connecting-ip` ou `x-real-ip`, apenas atrás de proxy confiável. Vazio usa uma origem compartilhada.           |
| `LOVABLE_DB_MIGRATION_URL`      | Migrações        | Conexão PostgreSQL privilegiada lida por `drizzle.config.ts`; não é necessária no runtime.                                  |

As variáveis `VITE_*` são públicas e entram no build. Nunca use esse prefixo para service role, chave de IA, segredo de hashing ou conexão do banco. Na publicação, disponibilize as variáveis do servidor ao runtime e as públicas ao build; alterar uma variável pública exige novo build. Não versione arquivos com credenciais.

## Banco de dados e migrações

A aplicação usa o cliente Supabase; `drizzle/schema.ts` está intencionalmente vazio. Os arquivos SQL versionados são a referência para reconstruir tabelas e permissões. Não use `drizzle-kit push` ou geração automática a partir desse schema vazio para sincronizar o banco.

| Migração                              | Conteúdo                                                                                                         |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `0000_create_cotas_interesses.sql`    | Interesses privados, validações SQL e restrição de acesso.                                                       |
| `0001_create_historico_ia.sql`        | Histórico privado das interações com IA.                                                                         |
| `0002_admin_roles.sql`                | Papéis de usuário e verificação de administrador.                                                                |
| `0003_remove_first_admin_trigger.sql` | Remove a promoção automática do primeiro usuário a administrador.                                                |
| `0004_create_reservas_vip.sql`        | Reservas VIP privadas.                                                                                           |
| `0005_client_accounts_link.sql`       | Vínculo a usuários, status das cotas e índices.                                                                  |
| `0006_abuse_protection.sql`           | Contadores privados e RPC `enforce_request_limits`, executável apenas por `service_role`.                        |
| `0007_single_administrator.sql`       | Administrador designado, clientes por padrão, atribuição após confirmação e RPC privada de verificação do papel. |

Para um banco novo, aplique os SQLs `0000` a `0007` na ordem, usando o mecanismo de migração do ambiente ou o SQL Editor do Supabase. Em um banco existente, aplique somente migrações pendentes e registre sua execução. Execute cada migração como uma transação. O caminho `drizzle/migrations` não é aplicado automaticamente pelo CLI do Supabase, que utiliza outra convenção.

**Aplique `0006_abuse_protection.sql` e configure o segredo antes de disponibilizar o novo código.** Sem a RPC ou com falha no banco, IA e formulários retornam indisponibilidade e não prosseguem. A alteração no repositório não aplica SQL automaticamente no banco hospedado.

`cotas_interesses`, `reservas_vip` e `historico_ia` não oferecem leitura/escrita direta para visitantes ou clientes. Funções de servidor validam entradas e tokens antes de usar a service role. O schema `abuse_private` armazena somente chaves HMAC, contagens e expiração, sem IP ou e-mail em texto aberto.

## Proteção contra abuso

### Limites implementados

Os valores ficam em [`src/lib/rate-limit.server.ts`](src/lib/rate-limit.server.ts). As cotas contam tentativas com entrada válida, inclusive quando outra regra bloqueia a mesma requisição ou quando uma operação posterior falha.

| Operação                        | Regra                        | Limite                                                               |
| ------------------------------- | ---------------------------- | -------------------------------------------------------------------- |
| IA                              | Por origem                   | 5 tentativas por minuto e 20 por hora.                               |
| IA                              | Global entre instâncias      | 60 tentativas por hora.                                              |
| Interesse e reserva, combinados | Por origem                   | 5 tentativas em 10 minutos e 20 por dia.                             |
| Interesse e reserva, combinados | Global                       | 200 tentativas por hora.                                             |
| Interesse                       | Por e-mail normalizado       | 3 tentativas por hora.                                               |
| Cada formulário                 | Payload normalizado idêntico | Uma tentativa a cada 60 segundos, inclusive entre origens distintas. |

As janelas começam na primeira tentativa e expiram sem renovação causada por bloqueios. O PostgreSQL incrementa os contadores com `INSERT ... ON CONFLICT`, em uma RPC por requisição, mantendo a decisão entre instâncias. Requisições concorrentes disputam os mesmos registros, com ordem consistente de locks. A função remove até 100 contadores expirados há mais de um dia por chamada; sem tráfego, a limpeza aguarda a próxima requisição.

Os formulários incluem o campo invisível `website`, validado no servidor e removido antes da gravação. Se preenchido, o envio é rejeitado. Esse honeypot captura bots simples; chamadas diretas que o omitam continuam sujeitas aos limites. Duplicatas têm bloqueio temporário, não idempotência permanente. Os botões ficam desabilitados durante o envio e os dados digitados permanecem após falhas.

O consultor verifica a cota antes de acessar o provedor. A geração tem timeout de 30 segundos, teto de 1.600 tokens de saída e retries automáticos desativados. O limite de chamadas controla consumo, mas não equivale a um orçamento financeiro exato.

### Identificação da origem e proxy

Por padrão, nenhum cabeçalho informado pelo cliente é confiável: todas as origens compartilham os limites por origem. Isso funciona localmente sem presumir a infraestrutura de hospedagem, mas pode bloquear visitantes diferentes ao atingir a mesma cota.

Configure `RATE_LIMIT_TRUSTED_IP_HEADER` somente quando o proxy de entrada **sobrescrever** o cabeçalho escolhido e o servidor não puder ser acessado contornando esse proxy. São aceitos apenas `cf-connecting-ip` e `x-real-ip`, com um único IP válido. `x-forwarded-for` não é aceito. Cabeçalho ausente/inválido recai na origem compartilhada; nome não suportado interrompe a operação. Usuários na mesma rede/NAT compartilham a cota. A origem não é recebida no payload do formulário.

IP, e-mail e payload são transformados com HMAC-SHA-256 antes de sair do servidor. Use o mesmo segredo em todas as réplicas; sua troca inicia novos contadores. O teto global dificulta abuso distribuído, mas também pode ser esgotado por um atacante. As proteções da aplicação não substituem controles de tráfego na borda ou CAPTCHA adaptativo em cenários de maior exposição.

### Respostas e observabilidade

| Situação                                            | HTTP                              | Identificador / evento                                                             |
| --------------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------- |
| Cota atingida                                       | `429` + `Retry-After` em segundos | Erro `[RATE_LIMITED]`; log JSON `abuse.rate_limited` com operação, regra e espera. |
| Banco/RPC indisponível, timeout ou segredo inválido | `503` + `Retry-After: 30`         | Erro `[PROTECTION_UNAVAILABLE]`; evento `abuse.protection_unavailable`.            |
| Honeypot preenchido ou dados inválidos              | Rejeição pela validação Zod       | Sem gravação nem chamada ao provedor.                                              |

As respostas de proteção usam `Cache-Control: no-store`. Os logs próprios do limitador não incluem IP, e-mail, payload ou segredo. Os formulários exibem a espera e mantêm os dados; o assistente apresenta a mensagem recebida do servidor.

Login, cadastro e link mágico chamam diretamente o Supabase Auth. Seus limites e controles contra bots devem ser configurados no Supabase; a RPC desta aplicação cobre o consultor e os dois formulários de negócio.

## Comandos e validação

| Comando              | Finalidade                                       |
| -------------------- | ------------------------------------------------ |
| `npm run dev`        | Iniciar desenvolvimento.                         |
| `npm run build`      | Compilar cliente e servidor para produção.       |
| `npm run build:dev`  | Compilar usando modo `development`.              |
| `npm run preview`    | Visualização local do build conforme o preset.   |
| `npm test`           | Executar testes Vitest.                          |
| `npm run test:watch` | Testes em modo interativo.                       |
| `npm run lint`       | ESLint e regras de formatação.                   |
| `npm run format`     | Reformatar o repositório inteiro; revise o diff. |
| `npx tsc --noEmit`   | Verificar tipos sem gerar arquivos.              |

Não existem scripts `drizzle:generate` ou `drizzle:push` no `package.json`.

Os testes cobrem esquemas de interesse/reserva, correspondência de rotas, construção de quotas, origem confiável, bloqueio/indisponibilidade e interrupção antes de gravar ou chamar a IA. Os testes unitários do limitador simulam a RPC; não substituem a validação da migração no PostgreSQL nem a configuração do proxy real.

A suíte usa um worker de threads para reduzir falhas de inicialização em ambientes com poucos recursos. Também há testes de autorização das funções administrativas e dos redirecionamentos de visitantes, clientes e administrador. Para verificar SQL em um banco de teste isolado após as migrações, execute `drizzle/tests/abuse_protection.sql` e `drizzle/tests/account_roles.sql` com uma conexão proprietária. Eles verificam limites, expiração, confirmação de e-mail e permissões, e revertem seus dados de teste. Não execute os testes de contas em produção.

Depois de aplicar a migração em teste, envie seis requisições válidas à IA dentro de um minuto pela mesma origem: a sexta deve retornar `429`, sem nova chamada ao provedor. Nos formulários, repetir um payload em 60 segundos deve bloquear; variar o payload continua sujeito à cota compartilhada. Confira também o `503` em um ambiente isolado sem a RPC.

Referências da implementação SQL: [operações atômicas com ON CONFLICT](https://www.postgresql.org/docs/current/sql-insert.html) e [funções com SECURITY DEFINER](https://www.postgresql.org/docs/current/sql-createfunction.html).

## Estrutura do repositório

```text
ares-aqua-invest/
├── drizzle/
│   ├── migrations/                 # SQLs e histórico de migrações
│   └── schema.ts                   # Gerado, intencionalmente vazio
├── public/                         # Arquivos estáticos
├── src/
│   ├── assets/                     # Imagens e referências a vídeos remotos
│   ├── components/                 # Formulários, experiências e UI
│   ├── hooks/                      # Sessão e utilitários de interface
│   ├── integrations/supabase/      # Clientes público/privado, auth e tipos
│   ├── lib/
│   │   ├── ai/                     # Gateway e rastreamento de IA
│   │   ├── *.functions.ts          # Funções de servidor
│   │   ├── *-schema.ts             # Validações compartilhadas
│   │   └── rate-limit.server.ts    # Políticas e integração com a RPC
│   ├── routes/                     # Rotas por arquivos e layout raiz
│   ├── test/                       # Testes e setup
│   ├── routeTree.gen.ts            # Gerado; não editar manualmente
│   ├── server.ts                   # Entrada SSR e tratamento de falhas
│   ├── start.ts                    # CSRF e envio do token nas RPCs
│   └── styles.css                  # Estilos globais
├── supabase/config.toml
├── .env                            # Configuração pública do backend, mantida pelo Lovable
├── .env.example
├── AGENTS.md                       # Regras de arquitetura e Lovable
├── drizzle.config.ts
├── package.json
├── roadmap.md
├── vite.config.ts
└── vitest.config.ts
```

## Publicação e pendências

O repositório está conectado ao Lovable. Preserve o histórico publicado, conforme [AGENTS.md](AGENTS.md). O preset Vite já inclui React, TanStack, Tailwind e Nitro; não duplique plugins. Como existem funções privadas e SSR, a publicação precisa de runtime de servidor além dos arquivos estáticos do cliente.

Pendências identificadas na revisão:

- Aplicar a migração `0007_single_administrator.sql` no ambiente hospedado e confirmar a conta designada antes de utilizar o painel. As alterações locais não executam migrações no Supabase automaticamente.
- Concluir vídeos distintos por atração, conforme [roadmap.md](roadmap.md). A experiência depende da disponibilidade das URLs de mídia remotas.
- Configurar controles do Supabase Auth e validar o cabeçalho do proxy real antes de habilitar limites por IP.
- Ampliar testes de integração com banco e autenticação; a suíte unitária não demonstra o estado do Supabase hospedado.

## Licença

Projeto de uso privado/restrito para apresentação e avaliação técnica, conforme a declaração anterior do repositório. Todos os direitos reservados. Não há arquivo de licença aberta no projeto.
