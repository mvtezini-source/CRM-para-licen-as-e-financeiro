# 📚 Exemplos de Uso - API Financeira ASAAS

## 🔐 Autenticação

Adicione header JWT em todas as requisições:
```bash
Authorization: Bearer seu_jwt_token_aqui
```

---

## 1️⃣ Criar Fatura

### Requisição
```bash
curl -X POST http://localhost:4000/api/invoices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer seu_token" \
  -d '{
    "client_id": "cliente123",
    "plan_id": "standard",
    "amount": 199.90,
    "due_date": "2025-12-25",
    "notes": "Renovação de licença - Dezembro"
  }'
```

### Resposta (201 Created)
```json
{
  "id": "INV-1700224567890",
  "client_id": "cliente123",
  "plan_id": "standard",
  "amount": 199.90,
  "due_date": "2025-12-25",
  "notes": "Renovação de licença - Dezembro",
  "status": "pending",
  "issued_at": "2025-11-17T10:00:00Z"
}
```

---

## 2️⃣ Listar Todas as Faturas

### Requisição
```bash
curl http://localhost:4000/api/invoices \
  -H "Authorization: Bearer seu_token"
```

### Resposta (200 OK)
```json
[
  {
    "id": "INV-1700224567890",
    "client_id": "cliente123",
    "client_name": "Empresa XYZ",
    "plan_id": "standard",
    "plan_name": "Profissional",
    "amount": 199.90,
    "status": "pending",
    "due_date": "2025-12-25",
    "issued_at": "2025-11-17T10:00:00Z",
    "paid_at": null,
    "notes": "Renovação de licença - Dezembro"
  },
  {
    "id": "INV-1700224567891",
    "client_id": "cliente456",
    "client_name": "Outro Cliente",
    "plan_id": "enterprise",
    "plan_name": "Empresarial",
    "amount": 499.90,
    "status": "paid",
    "due_date": "2025-12-10",
    "issued_at": "2025-11-10T10:00:00Z",
    "paid_at": "2025-11-15T14:30:00Z",
    "notes": null
  }
]
```

---

## 3️⃣ Listar Faturas de um Cliente

### Requisição
```bash
curl http://localhost:4000/api/invoices/cliente123 \
  -H "Authorization: Bearer seu_token"
```

### Resposta (200 OK)
```json
[
  {
    "id": "INV-1700224567890",
    "client_id": "cliente123",
    "plan_id": "standard",
    "plan_name": "Profissional",
    "amount": 199.90,
    "status": "pending",
    "due_date": "2025-12-25",
    "issued_at": "2025-11-17T10:00:00Z",
    "paid_at": null,
    "notes": "Renovação de licença - Dezembro"
  }
]
```

## 4. Gerar Pagamento (PIX)

### Requisição
```bash
curl -X POST http://localhost:4000/api/payments/create \
  -H "Content-Type: application/json" \
  -d '{
    "invoice_id": "INV-1700224567890",
    "client_id": "cliente123",
    "payment_method": "mercadopago",
    "payment_type": "pix"
  }'
```

### Resposta (201 Created)
```json
{
  "payment_id": "PAY-1700224578901",
  "external_id": "123456789",
  "status": "pending",
  "payment_type": "pix",
  "qr_code": "00020126580014br.gov.bcb.brcode01051.0.0123456789abcdef",
  "copy_paste": "00020126580014br.gov.bcb.brcode01051.0.0123456789abcdef",
  "transaction_details": {}
}
```

## 5. Gerar Pagamento (Boleto)

### Requisição
```bash
curl -X POST http://localhost:4000/api/payments/create \
  -H "Content-Type: application/json" \
  -d '{
    "invoice_id": "INV-1700224567890",
    "client_id": "cliente123",
    "payment_method": "mercadopago",
    "payment_type": "boleto"
  }'
```

### Resposta (201 Created)
```json
{
  "payment_id": "PAY-1700224578902",
  "external_id": "123456790",
  "status": "pending",
  "payment_type": "boleto",
  "transaction_details": {
    "external_resource_url": "https://www.mercadopago.com.br/boleto/123456790"
  }
}
```

## 6. Verificar Status de Pagamento

### Requisição
```bash
curl http://localhost:4000/api/payments/PAY-1700224578901/status
```

### Resposta (200 OK)
```json
{
  "id": "PAY-1700224578901",
  "invoice_id": "INV-1700224567890",
  "payment_method": "mercadopago",
  "payment_type": "pix",
  "status": "approved",
  "amount": "199.90",
  "external_id": "123456789",
  "qr_code": "00020126580014br.gov.bcb.brcode01051.0.0123456789abcdef",
  "copy_paste": "00020126580014br.gov.bcb.brcode01051.0.0123456789abcdef",
  "created_at": "2025-11-17T10:05:00Z",
  "paid_at": "2025-11-17T10:15:00Z"
}
```

## 7. Listar Pagamentos de uma Fatura

### Requisição
```bash
curl http://localhost:4000/api/payments/invoice/INV-1700224567890
```

### Resposta (200 OK)
```json
[
  {
    "id": "PAY-1700224578901",
    "invoice_id": "INV-1700224567890",
    "payment_method": "mercadopago",
    "payment_type": "pix",
    "status": "approved",
    "amount": "199.90",
    "external_id": "123456789",
    "created_at": "2025-11-17T10:05:00Z",
    "paid_at": "2025-11-17T10:15:00Z"
  }
]
```

## 8. Webhook de Pagamento (Recebido Automaticamente)

### Requisição (enviada pelo Mercado Pago)
```bash
POST /api/webhooks/mercadopago HTTP/1.1
Host: seu-servidor.com
Content-Type: application/json

{
  "type": "payment",
  "data": {
    "id": "123456789",
    "status": "approved",
    "amount": 199.90,
    "description": "Invoice INV-1700224567890"
  }
}
```

### Resposta (200 OK)
```json
{
  "ok": true
}
```

### Efeitos Colaterais:
1. Obtém status atualizado de `123456789` no Mercado Pago
2. Se status for "approved":
   - Atualiza `payments.status = approved`
   - Atualiza `payments.paid_at = NOW()`
   - Atualiza `invoices.status = paid`
   - Atualiza `invoices.paid_at = NOW()`
   - Cria notificação: "Pagamento recebido: Fatura INV-... - R$ 199.90"
3. Registra webhook em `payment_webhooks`

## Exemplos JavaScript/TypeScript

### Criar Fatura
```javascript
async function createInvoice() {
  const response = await fetch('http://localhost:4000/api/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: 'cliente123',
      plan_id: 'standard',
      amount: 199.90,
      due_date: '2025-12-25',
      notes: 'Renovação'
    })
  });
  return response.json();
}
```

### Gerar PIX
```javascript
async function generatePIX(invoiceId, clientId) {
  const response = await fetch('http://localhost:4000/api/payments/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      invoice_id: invoiceId,
      client_id: clientId,
      payment_method: 'mercadopago',
      payment_type: 'pix'
    })
  });
  return response.json();
}
```

### Verificar Status
```javascript
async function checkPaymentStatus(paymentId) {
  const response = await fetch(
    `http://localhost:4000/api/payments/${paymentId}/status`
  );
  return response.json();
}
```

## Códigos de Erro Esperados

### 400 Bad Request
- Campos obrigatórios faltando
- Valores inválidos (ex: amount negativo)

### 404 Not Found
- Fatura não encontrada
- Cliente não encontrado
- Pagamento não encontrado

### 500 Internal Server Error
- Erro na integração Mercado Pago
- Erro de banco de dados
- Token inválido ou ausente

## Dicas de Integração

### Rate Limiting
Mercado Pago pode ter limites de requisição. Implemente retry com backoff exponencial.

### Timeout
Configure timeout de 30 segundos para chamadas ao Mercado Pago.

### Validação
Sempre valide IDs de cliente e fatura antes de criar pagamentos.

### Logging
Log todas as chamadas ao Mercado Pago para debugging.

### Segurança
Nunca exponha `MERCADOPAGO_TOKEN` no cliente.
Sempre valide webhooks usando assinatura do Mercado Pago (implementar em v2).

## Estados Finais

```
Invoice.status:
├─ pending → O cliente ainda não pagou
├─ paid → Pagamento recebido (status final)
├─ overdue → Data de vencimento passou
└─ cancelled → Fatura foi cancelada

Payment.status:
├─ pending → Aguardando recebimento
├─ approved → Pagamento confirmado (status final)
└─ rejected → Pagamento foi recusado
```

## Máxima Segurança

Para ambiente de produção, implemente:
1. Validação de assinatura de webhook
2. Retry automático com backoff
3. Idempotência nas operações
4. Logging detalhado
5. Alertas de erro crítico
6. Reconciliação periódica com Mercado Pago
