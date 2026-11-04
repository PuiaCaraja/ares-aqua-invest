# Roadmap

## Done
- Tabela cotas_interesses privada, formulário com validação e gravação permanente; envio confirmado na página e no banco, com testes de validação aprovados.
- Seção de atrações com imagem futurista + efeito de varredura neon + botão "Ver Vídeo Imersivo" com modal (tour.mp4 + miniaturas).
- Assistente IA: comprador marca prioridades → server function via Lovable AI Gateway (openai/gpt-6-astra em /v1/responses) compara as 3 cotas, rankeia com score e explica os benefícios alinhados.
- historico_ia: interações do assistente salvas server-side em tabela privada.
- /admin com KPIs, tabela de leads, busca e atualização automática.

- Login de clientes (senha / link mágico), botão Entrar/Minha Conta, área Minha Conta com cotas, reservas e histórico da IA.
- Modal de sucesso com assistente ARIA + link WhatsApp pré-preenchido após interesse e reserva VIP.

## In progress
- /admin temporariamente público (sem login) para demonstração; dados continuam protegidos no banco (tabela sem acesso anônimo). Reverter: voltar a rota para _authenticated e remover listarInteressesPublico.
- Vídeos distintos por card de atração: gerar MP4 do tobogã (descida imersiva) e da piscina de ondas (ondas gigantes); bar mantém tour.mp4; cada card toca seu vídeo em loop no hover/carregamento.
- Número oficial do WhatsApp de atendimento (aguardando o usuário).
