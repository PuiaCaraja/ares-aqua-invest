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