# Módulo Financeiro com ASAAS - CRM Licenciamento

## 🎯 Visão Geral

O módulo financeiro integrado com **ASAAS** oferece uma solução robusta para faturamento e pagamentos com suporte a **Boleto**, **PIX** e **Cartão de Crédito**, com confirmação automática de recebimento.

## ✨ Características Principais

### ✅ Faturamento Completo
- Criar faturas para clientes
- Associar planos aos pagamentos
- Valores e datas customizáveis
- Observações e notas
- Status: Pendente, Pago, Vencido, Cancelado

### ✅ Formas de Pagamento (ASAAS)
- **PIX**: Instantâneo com QR Code e Cópia-Cola
- **Boleto**: Tradicional com código de barras
- **Cartão de Crédito**: Débito imediato (opcional via ASAAS)
- **Transferência Bancária**: Via dados bancários

### ✅ Automação Inteligente
- **Webhook Automático**: Recebe notificações em tempo real do ASAAS
- **Baixa Automática**: Fatura marcada como paga ao receber
- **Notificações**: Alertas no dashboard
- **Sincronização**: Verificação manual de status disponível

### ✅ Dashboard de Controle
- Total Faturado (R$)
- Total Recebido (R$)
- Total Pendente (R$)
- Quantidade de Faturas
- Filtros por status

## 🗄️ Estrutura de Dados

### Tabelas Utilizadas

**invoices** (Faturas)
```
- id: Identificador único
- client_id: FK para cliente
- plan_id: FK para plano
- amount: Valor da fatura
- status: pending, paid, overdue, cancelled
- due_date: Vencimento
- issued_at: Data de emissão
- paid_at: Data do pagamento
- notes: Observações
```

**payments** (Pagamentos)
```
- id: Identificador único
- invoice_id: FK para fatura
- payment_method: "asaas"
- payment_type: "asaas"
- status: pending, approved, overdue, refunded
- amount: Valor
- external_id: ID do ASAAS
- external_url: Link da cobrança
- qr_code: QR Code PIX
- copy_paste: Cópia-Cola PIX
- barcode: Código de barras
- created_at: Criação
- paid_at: Confirmação
```

**payment_webhooks** (Logs)
```
- external_id: ID externo ASAAS
- event_type: Tipo de evento
- status: Status do evento
- data: JSON com dados completos
- processed: Flag de processamento
```

## 🔌 Integração ASAAS

### Arquitetura

```
Frontend (Financial.jsx)
    ↓
Express Server (index.js)
    ↓
ASAAS Client (asaas.js)
    ↓
ASAAS API
    ↓
Webhook → Banco de Dados → Notificações
```

### Endpoints Implementados

**API Financial**
```
GET    /api/invoices              Lista todas faturas
GET    /api/invoices/:clientId    Faturas do cliente
POST   /api/invoices              Criar fatura
GET    /api/payments/invoice/:id  Pagamentos da fatura
POST   /api/payments/create       Gerar cobrança ASAAS
GET    /api/payments/:id/status   Verificar status
POST   /api/webhooks/asaas        Webhook automático
```

**Funções ASAAS (asaas.js)**
```
createPayment(paymentData)         Cria cobrança
findOrCreateCustomer(email, name)  Gerencia cliente
getPaymentStatus(paymentId)        Consulta status
updateCustomer(customerId, data)   Atualiza cliente
refundPayment(paymentId, amount)   Reembolsa pagamento
listPayments(filters)              Lista pagamentos
parseWebhook(webhookData)          Processa webhook
```

## 🚀 Guia de Configuração

### Passo 1: Criar Conta ASAAS
1. Acesse https://www.asaas.com
2. Crie uma conta (pode ser sandbox para testes)
3. Acesse Settings → API
4. Copie sua chave de API

### Passo 2: Configurar Variáveis de Ambiente

Crie/atualize o arquivo `.env`:
```bash
# ASAAS Configuration
ASAAS_API_KEY=seu_token_api_asaas
ASAAS_ENV=sandbox          # Use "production" em produção

# Webhook Configuration
FRONTEND_URL=http://localhost:5173  # URL do seu frontend
```

### Passo 3: Configurar Webhook no ASAAS

1. Painel ASAAS → Configurações → Webhooks
2. Adicione URL: `https://seu-dominio/api/webhooks/asaas`
3. Selecione eventos:
   - `PAYMENT.CREATED`
   - `PAYMENT.UPDATED`
   - `PAYMENT.CONFIRMED`
   - `PAYMENT.OVERDUE`
   - `PAYMENT.RESTORED`

### Passo 4: Instalar Dependências
```bash
cd server
npm install axios
# ou
npm install
```

### Passo 5: Reiniciar Servidor
```bash
npm run dev
```

## 💻 Como Usar

### Criar uma Fatura
1. Menu → Financeiro
2. Clique "+ Nova Fatura"
3. Selecione cliente
4. Defina valor e data de vencimento
5. Clique "Criar Fatura"

### Gerar Cobrança
1. Na fatura, clique "📝 Gerar Cobrança ASAAS"
2. Sistema criará cobrança no ASAAS
3. Será exibido:
   - Link da cobrança
   - PIX com QR Code + Cópia-Cola
   - Boleto com código de barras

### Enviar para Cliente
1. Clique "🌐 Abrir Cobrança" para ver link completo
2. Copie o PIX ou código do boleto
3. Envie via email, WhatsApp, etc.

### Verificar Pagamento
1. Clique "✓ Verificar Pagamento"
2. Sistema sincroniza com ASAAS
3. Se pagamento foi recebido:
   - Fatura marca como PAGA automaticamente
   - Dashboard atualiza em tempo real
   - Notificação aparece no sistema

## 🔄 Fluxo de Pagamento

### Fluxo PIX
```
1. Admin cria fatura: R$ 199,90
2. Admin gera cobrança ASAAS
3. Sistema retorna QR Code PIX
4. Cliente escaneia QR Code
5. Cliente confirma transferência instantânea
6. ASAAS recebe pagamento em segundos
7. Webhook acionado automaticamente
8. Sistema marca fatura como PAGA
9. Notificação criada no dashboard
10. Email enviado para cliente (via ASAAS)
```

### Fluxo Boleto
```
1. Admin cria fatura: R$ 199,90
2. Admin gera cobrança ASAAS
3. Sistema retorna código de barras
4. Cliente imprime ou paga online
5. Banco processa 2-3 dias úteis
6. ASAAS recebe confirmação
7. Webhook acionado automaticamente
8. Sistema marca fatura como PAGA
9. Notificação criada no dashboard
10. Email enviado para cliente (via ASAAS)
```

## 🔐 Permissões

Requer permissão `manage_clients` para:
- Criar faturas
- Gerar cobranças
- Visualizar todas as faturas

## 📊 Status Possíveis

**Fatura (Invoice)**
- `pending` - Aguardando pagamento
- `paid` - Pagamento recebido ✓
- `overdue` - Vencido
- `cancelled` - Cancelada

**Pagamento (Payment)**
- `pending` - Aguardando recebimento
- `approved` - Confirmado ✓
- `overdue` - Vencido
- `refunded` - Reembolsado

## 🛠️ Tratamento de Erros

### Webhook não recebido?
1. Verifique URL configurada no ASAAS
2. Use ngrok/tunneling para testar local
3. Verifique logs do servidor

### Fatura não marca como paga?
1. Clique "Verificar Pagamento" manualmente
2. Verifique se status foi confirmado no ASAAS
3. Revise logs do webhook

### Token inválido?
1. Revise token no painel ASAAS
2. Certifique-se de estar no ambiente correto
3. Verifique permissões da conta

## 📝 Exemplos de Uso

### JavaScript - Criar Fatura
```javascript
const response = await fetch('/api/invoices', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    client_id: 'cliente123',
    plan_id: 'premium',
    amount: 199.90,
    due_date: '2025-12-25',
    notes: 'Renovação Premium'
  })
});
const invoice = await response.json();
```

### JavaScript - Gerar Cobrança
```javascript
const response = await fetch('/api/payments/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    invoice_id: 'INV-123456',
    client_id: 'cliente123',
    payment_method: 'asaas'
  })
});
const payment = await response.json();
// payment.invoice_url - Link para pagar
// payment.pix_qr_code - QR Code PIX
// payment.barcode - Código boleto
```

## ✅ Teste Recomendado

1. **Criar fatura de teste**: R$ 1,00
2. **Gerar cobrança**: Clique no botão
3. **Pagar via sandbox ASAAS**: Use dados de teste
4. **Verificar webhook**: Confira notificação
5. **Confirmar baixa**: Fatura deve estar PAGA

## 🔍 Monitoramento

### Logs Importantes
- `/server/node_modules/.log` - Erros do servidor
- `/api/webhooks/asaas` - Eventos de pagamento
- Dashboard → Notificações - Alertas do sistema

### Métricas
- Total faturado (mês/ano)
- Taxa de conversão (pagos/faturados)
- Tempo médio de pagamento
- Valor médio de fatura

## 📚 Referências Importantes

**ASAAS**
- Site: https://www.asaas.com
- Documentação: https://docs.asaas.com
- API Reference: https://docs.asaas.com/reference/listar-clientes
- Dashboard: https://app.asaas.com

**Suporte**
- Email: suporte@asaas.com
- Chat: Disponível no painel ASAAS
- Comunidade: Forum ASAAS

## 🚀 Próximas Melhorias

- [ ] Relatórios financeiros
- [ ] Gráficos de receita
- [ ] Exportar PDF da cobrança
- [ ] Débito automático
- [ ] Parcelamento em cartão
- [ ] Integração com contabilidade
- [ ] NFe eletrônica
- [ ] Histórico completo de transações
- [ ] Alertas de vencimento automático

## ✨ Diferenciais ASAAS

✅ Menor taxa do mercado
✅ PIX com confirmação instantânea
✅ Suporte excelente em português
✅ Dashboard intuitivo
✅ Webhook confiável
✅ Múltiplas formas de pagamento
✅ Sem setup fee
✅ Saque automático

---

**Status**: ✅ Implementação Completa com ASAAS
**Última Atualização**: 17 de Novembro de 2025
**Testado**: ✓ Ambiente Sandbox
