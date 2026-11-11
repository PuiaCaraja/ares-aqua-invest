# 🌊 Ares Aqua Invest

Uma plataforma moderna para investimento e gestão de cotas no setor aquático, desenvolvida com tecnologias web de alto desempenho, arquitetura escalável e foco na experiência do utilizador.

---

## 📁 Estrutura de Pastas do Projeto

A organização do código segue uma arquitetura modular e clara, separando a lógica de servidor, componentes visuais e configurações de base de dados:

```text
ares-aqua-invest/
├── drizzle/            # Scripts e ficheiros de migração SQL (Drizzle ORM)
├── public/             # Ficheiros estáticos (imagens, ícones, favicons)
├── src/
│   ├── components/     # Componentes de interface (UI) reutilizáveis
│   ├── lib/            # Configurações de clientes (Supabase, Drizzle, utilitários)
│   ├── routes/         # Páginas e rotas da aplicação (TanStack Router)
│   └── styles/         # Ficheiros de estilo global e Tailwind CSS
├── .env.example        # Modelo de variáveis de ambiente (sem dados sensíveis)
├── .gitignore          # Ficheiros ignorados pelo Git (ex: .env, node_modules)
├── drizzle.config.ts   # Configuração principal do Drizzle ORM
├── package.json        # Dependências e scripts do projeto
├── README.md           # Documentação principal do repositório
└── vite.config.ts      # Configuração do Vite

 # 🚀 Tecnologias Utilizadas

###  **Frontend & Framework**

* **Vite** — Bundler ultrarrápido para desenvolvimento frontend moderno.

* **TanStack Router / Start** — Gestão de rotas e integração completa entre cliente e servidor.

* **Tailwind CSS** — Framework utilitário para estilização responsiva e elegante.
_______________________________________________________________________________________

### **Backend & Base de Dados**

* **Drizzle ORM** — ORM TypeScript de alta performance e tipo seguro (type-safe).

* **Supabase / PostgreSQL** — Base de dados relacional com suporte a políticas de segurança ao nível de linha (Row Level Security - RLS).

* **SQL Migrations** — Histórico e controlo de versões do schema de dados via scripts de migração.
________________________________________________________________________________________

### 🔒 **Segurança e Boas Práticas**

* **Row Level Security (RLS)**: Garantia de que a leitura e escrita na base de dados cumprem regras rigorosas de acesso por utilizador.

* **Proteção de Dados e .env**: Variáveis de ambiente isoladas e protegidas contra fugas no controlo de versões.

* **Validação de Inputs**: Esquemas de validação rígidos para formulários públicos de modo a mitigar submissões em massa e spam.

* **Rate Limiting**: Estrutura concebida para limitar o número de requisições às rotas de API e integrações com Inteligência Artificial.
 ______________________________________________________________________________________

 ### **📜 Disponibilidade de Scripts**


 # **No ficheiro package.json, estão disponíveis os seguintes comandos para desenvolvimento, manutenção e testes:**

* npm run dev — Inicia o servidor de desenvolvimento local (Vite).

* npm run build — Compila a aplicação para produção.

* npm run preview — Visualiza a versão de produção compilada localmente.

* npm run drizzle:generate — Gera novas migrações SQL com base nas alterações do schema.

* npm run drizzle:push — Aplica diretamente as alterações do schema à base de dados.

* npm run test — Executa a suíte de testes automatizados.


## 🛠️ Como Executar o Projeto Localmente

### **Pré-requisitos**
* **Node.js** (versão 18 ou superior recomendada)
* **npm** ou **pnpm**

### **Passo a Passo**

1. **Clonar o repositório:**
   ```bash
   git clone [https://github.com/PuiaCaraja/ares-aqua-invest.git](https://github.com/PuiaCaraja/ares-aqua-invest.git)
   cd ares-aqua-invest

## 2- Instalar as dependências:

npm install

## 3- Configurar as Variáveis de Ambiente:
Cria um ficheiro .env na raiz do projeto com base nas tuas credenciais locais:

VITE_SUPABASE_URL=a_tua_url_aqui
VITE_SUPABASE_ANON_KEY=a_tua_chave_anonima_aqui
DATABASE_URL=a_tua_string_de_conexao_postgresql

## 4- Executar o servidor de desenvolvimento:

npm run dev
Acede a http://localhost:5173 no teu navegador.


## 🌐 Como Navegar pela Página:

# **Após iniciar o servidor localmente ou aceder à versão online:**

**1. Página Inicial (Landing Page):** Apresentação concisa do projeto Ares Aqua Invest, destaques dos investimentos aquáticos e chamada para ação (CTA).

**2. Calculadora / Simulador:** Permite interagir com dados dinâmicos para simular retornos sobre o investimento.

**3. Formulários de Contacto / Registo:** Áreas protegidas com validação de dados para submissão segura de informações.

**4. Painel do Utilizador / Dashboard:** Área reservada acessível mediante autenticação para gestão das cotas e visualização de métricas.
____________________________________________________________________________________________________________________________________

## 📄 Licença

Este projeto é de utilização privada/restrita para fins de apresentação e avaliação técnica. Todos os direitos reservado.