# 🎫 Sistema de Tickets - Documentação Completa

## Visão Geral

O Sistema de Tickets é um módulo completo de gerenciamento de suporte e rastreamento de tarefas, integrado ao CRM para melhorar a qualidade do atendimento ao cliente e controle operacional.

## Características Principais

### 1. **Gerenciamento de Tickets**
- ✅ Criar novos tickets
- ✅ Listar tickets com filtros
- ✅ Visualizar detalhes completos
- ✅ Atualizar status com workflow
- ✅ Adicionar respostas e conversas

### 2. **Campos Disponíveis**

#### Informações Básicas
- **Título**: Breve descrição do problema/solicitação
- **Descrição**: Detalhes completos do ticket
- **ID**: Identificador único auto-incrementado
- **Categoria**: Classificação do tipo de problema
- **Prioridade**: Nível de urgência
- **Status**: Estado atual do ticket

#### Categorias Disponíveis
- 🆘 **Suporte**: Problemas com licenças, acesso, etc
- 🐛 **Bug**: Erros no sistema
- ✨ **Feature**: Solicitação de novos recursos
- 📋 **Outro**: Assuntos diversos

#### Níveis de Prioridade
- 🟢 **Baixa**: Não urgente
- 🟡 **Média**: Normal
- 🟠 **Alta**: Urgente
- 🔴 **Crítica**: Bloqueante

#### Estados do Workflow
1. **Aberto** 🔵 - Ticket recém criado
2. **Em Progresso** 🟡 - Sendo trabalhado
3. **Resolvido** 🟢 - Solução pronta
4. **Fechado** ⚫ - Finalizado

### 3. **Funcionalidades Avançadas**

#### SLA (Service Level Agreement)
- Cálculo automático de horas desde a abertura
- Visualização em tempo real do tempo decorrido
- Base para análise de eficiência de suporte

#### Conversação em Thread
- Respostas organizadas por ordem cronológica
- Histórico completo de interações
- Identificação de autor em cada mensagem
- Timestamps precisos

#### Filtros e Busca
- Busca por título (busca textual)
- Filtro por status
- Filtro por prioridade
- Combinação de múltiplos filtros

#### Atribuição de Tickets
- Campo `assignedTo` para rastrear responsável
- Suporte a equipes de suporte
- Visualização do criador original

## Arquitetura

### Frontend (`src/components/Tickets.jsx`)
```javascript
- 600+ linhas de código React
- 3 visualizações: Lista, Formulário, Detalhes
- Integração com API backend
- Estados gerenciados com useState/useEffect
```

**Componentes da Interface:**
1. **Vista de Lista**: Card view com busca e filtros
2. **Vista de Formulário**: Form estruturado com validação
3. **Vista de Detalhes**: Painel lateral com informações + conversação

### Backend (`server/index.js`)
```javascript
Endpoints implementados:

GET    /api/tickets                    - Listar todos (com filtros)
GET    /api/tickets/:id                - Detalhes de um ticket
POST   /api/tickets                    - Criar novo ticket
PATCH  /api/tickets/:id                - Atualizar status
POST   /api/tickets/:id/replies        - Adicionar resposta
```

### Banco de Dados

#### Tabela: `tickets`
```sql
CREATE TABLE tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  priority VARCHAR(50) NOT NULL DEFAULT 'media',
  status VARCHAR(50) NOT NULL DEFAULT 'aberto',
  createdBy VARCHAR(255) NOT NULL,
  assignedTo VARCHAR(255),
  dueDate DATETIME,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Tabela: `ticket_replies`
```sql
CREATE TABLE ticket_replies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticketId INT NOT NULL,
  author VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticketId) REFERENCES tickets(id) ON DELETE CASCADE
);
```

## Como Usar

### 1. Acessar o Sistema
1. Faça login no CRM
2. Clique em "🎫 Tickets" na navbar
3. Você verá a lista de tickets

### 2. Criar um Novo Ticket
1. Clique em "➕ Novo Ticket"
2. Preencha os campos obrigatórios:
   - Título
   - Descrição
3. Escolha a categoria e prioridade
4. Clique em "✅ Criar Ticket"

### 3. Filtrar Tickets
Use os filtros no topo da lista:
- Digite na busca por título
- Selecione status específico
- Selecione prioridade específica

### 4. Visualizar Detalhes
1. Clique em um ticket na lista
2. Você verá:
   - Descrição completa
   - Todas as respostas
   - Informações do ticket (categoria, prioridade, SLA)
   - Opções para mudar status

### 5. Responder a um Ticket
1. No painel de detalhes
2. Role até "Conversação"
3. Digite sua resposta
4. Clique em "💬 Enviar Resposta"

### 6. Atualizar Status
No painel lateral de detalhes:
1. Visualize o status atual
2. Clique no botão para mudar para novo status
3. Confirme a alteração

## Fluxo Típico de um Ticket

```
1. Cliente cria ticket (Status: Aberto)
   ↓
2. Suporte recebe notificação
   ↓
3. Suporte atribui a si mesmo (assignedTo)
   ↓
4. Status muda para "Em Progresso"
   ↓
5. Suporte adiciona respostas conforme trabalha
   ↓
6. Após resolver, muda status para "Resolvido"
   ↓
7. Cliente confirma solução (opcional)
   ↓
8. Status final "Fechado"
```

## Integração com Outras Partes do CRM

### Dashboard
- Pode exibir tickets abertos
- Mostrar SLA crítico
- Alertas de tickets vencidos

### Clientes
- Cada cliente pode ter múltiplos tickets
- Rastreamento de satisfação
- Histórico de suporte

### Financeiro
- Ticket como pré-venda
- Rastreamento de custo de suporte
- ROI de resolução de problemas

### Relatórios
- Tempo médio de resolução
- Taxa de resolução
- Distribuição por categoria
- Análise de prioridade

## Melhorias Futuras

### Curto Prazo
- [ ] Anexos de arquivo
- [ ] Avaliação de satisfação (1-5 stars)
- [ ] Email automático ao criar ticket
- [ ] Notificações em tempo real
- [ ] Atribuição inteligente (Round-robin)

### Médio Prazo
- [ ] Kanban view (Drag & drop)
- [ ] Templates de resposta
- [ ] Knowledge base (Perguntas frequentes)
- [ ] Chat ao vivo integrado
- [ ] Priorização automática por IA

### Longo Prazo
- [ ] Análise de sentimento em mensagens
- [ ] Sugestões de resolução por IA
- [ ] Integração com Slack
- [ ] Bot de respostas automáticas
- [ ] Portal do cliente

## Endpoints API

### Listar Tickets
```bash
GET /api/tickets?status=aberto&priority=critica&search=erro
```

**Respostas:**
- `status`: aberto | em-progresso | resolvido | fechado
- `priority`: baixa | media | alta | critica
- `search`: busca textual no título

**Response (200):**
```json
[
  {
    "id": 1,
    "title": "Erro no login",
    "description": "Usuário não consegue fazer login",
    "category": "bug",
    "priority": "critica",
    "status": "em-progresso",
    "createdBy": "cliente@email.com",
    "assignedTo": "suporte@empresa.com",
    "dueDate": null,
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T11:45:00.000Z"
  }
]
```

### Detalhes do Ticket
```bash
GET /api/tickets/:id
```

**Response (200):**
```json
{
  "id": 1,
  "title": "Erro no login",
  "description": "Usuário não consegue fazer login",
  "category": "bug",
  "priority": "critica",
  "status": "em-progresso",
  "createdBy": "cliente@email.com",
  "assignedTo": "suporte@empresa.com",
  "replies": [
    {
      "id": 1,
      "author": "suporte@empresa.com",
      "message": "Investigando o problema",
      "createdAt": "2025-01-15T10:45:00.000Z"
    }
  ]
}
```

### Criar Ticket
```bash
POST /api/tickets
Content-Type: application/json

{
  "title": "Erro no login",
  "description": "Usuário não consegue fazer login",
  "category": "bug",
  "priority": "critica"
}
```

### Atualizar Status
```bash
PATCH /api/tickets/:id
Content-Type: application/json

{
  "status": "resolvido"
}
```

### Adicionar Resposta
```bash
POST /api/tickets/:id/replies
Content-Type: application/json

{
  "message": "Problema resolvido! Limpe o cache."
}
```

## Troubleshooting

### Problema: Tickets não aparecem na lista
**Solução:** 
- Verifique se está logado
- Verifique conexão com banco de dados
- Verifique logs do servidor: `tail /tmp/server.log`

### Problema: Não consigo criar ticket
**Solução:**
- Verifique se todos os campos obrigatórios estão preenchidos
- Verifique se o servidor está rodando na porta 4000
- Veja o console do navegador (F12 > Console)

### Problema: Respostas não aparecem
**Solução:**
- Atualize a página
- Verifique se o ID do ticket está correto na URL

## Métricas e Monitoramento

### KPIs Sugeridos
- **Tempo Médio de Resolução**: (Tempo total de tickets / Total de tickets)
- **Taxa de Resolução**: (Tickets resolvidos / Total de tickets)
- **SLA Compliance**: (Tickets resolvidos no SLA / Total de tickets)
- **Satisfação do Cliente**: (Média de avaliações dos clientes)
- **Tickets por Categoria**: Distribuição de tipos de problemas

## Segurança

- ✅ Autenticação JWT obrigatória
- ✅ Validação de entrada no backend
- ✅ Proteção contra SQL injection
- ✅ Histórico completo de alterações
- ⏳ Audit logging (em desenvolvimento)

## Suporte

Para reportar bugs ou sugerir melhorias, contate a equipe de desenvolvimento.

---

**Versão:** 1.0  
**Última Atualização:** 2025-01-15  
**Status:** ✅ Produção
