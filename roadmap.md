# Roadmap

## Done
- Tabela cotas_interesses privada, formulário com validação e gravação permanente; envio confirmado na página e no banco, com testes de validação aprovados.
- Seção de atrações com imagem futurista + efeito de varredura neon + botão "Ver Vídeo Imersivo" com modal (tour.mp4 + miniaturas).
- Assistente IA: comprador marca prioridades → server function via Lovable AI Gateway (openai/gpt-6-astra em /v1/responses) compara as 3 cotas, rankeia com score e explica os benefícios alinhados.
- historico_ia: interações do assistente salvas server-side em tabela privada.
- /admin protegido com KPIs, tabela de leads, busca, criação de clientes e atualização automática. Verificação do papel no servidor; função pública de leads removida.

- Login de clientes (senha / link mágico), botão Entrar/Minha Conta, área Minha Conta com cotas, reservas e histórico da IA.
- Modal de sucesso com assistente ARIA + link WhatsApp pré-preenchido após interesse e reserva VIP.

## In progress
- Aplicar a migração 0007 no ambiente hospedado: um administrador designado por e-mail confirmado, demais contas como clientes e navegação sem login como visitante. Login direciona cada perfil à sua área.
- Vídeos distintos por card de atração: gerar MP4 do tobogã (descida imersiva) e da piscina de ondas (ondas gigantes); bar mantém tour.mp4; cada card toca seu vídeo em loop no hover/carregamento.
- Número oficial do WhatsApp de atendimento (aguardando o usuário).
