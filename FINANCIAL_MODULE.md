# Módulo Financeiro - CRM Licenciamento

## Visão Geral

O módulo financeiro completo implementa um sistema robusto de faturamento e pagamentos com integração com **Mercado Pago**, suportando **Boleto** e **PIX** com confirmação automática de recebimento.

## Características Principais

### ✅ Faturamento
- **Criar Faturas**: Gere faturas para clientes com valores customizáveis
- **Gestão de Status**: Acompanhe o status (Pendente, Paga, Vencida, Cancelada)
- **Dashboard Financeiro**: Visualize estatísticas em tempo real
  - Total Faturado
  - Total Recebido
  - Total Pendente
  - Quantidade de Faturas

### ✅ Pagamentos
- **Boleto Bancário**: Gere boletos via Mercado Pago
- **PIX**: Gere QR codes PIX para pagamento instantâneo
- **Cópia e Cola**: Disponível para pagamentos via PIX
- **Verificação em Tempo Real**: Confirme pagamentos manualmente

### ✅ Automação
- **Webhook Automático**: Recebe notificações de pagamento do Mercado Pago
- **Baixa Automática**: Ao receber o pagamento, a fatura é marcada como paga automaticamente
- **Notificações**: Alertas no sistema quando um pagamento é recebido

### ✅ Filtragem
- Filtrar por Status (Todos, Pendentes, Pagos, Vencidos)
- Busca rápida entre faturas

## Banco de Dados

### Tabelas Criadas

#### `invoices`
```sql
- id (VARCHAR 100) - Identificador único da fatura
- client_id (VARCHAR 100) - FK para cliente
- plan_id (VARCHAR 100) - FK para plano (opcional)
- amount (DECIMAL 10,2) - Valor da fatura
- status (VARCHAR 50) - Estado: pending, paid, overdue, cancelled
- due_date (DATE) - Data de vencimento
- issued_at (DATETIME) - Data de emissão
- paid_at (DATETIME) - Data de pagamento (quando recebido)
- notes (TEXT) - Observações
```

#### `payments`
```sql
- id (VARCHAR 100) - Identificador único do pagamento
- invoice_id (VARCHAR 100) - FK para fatura
- payment_method (VARCHAR 50) - Método: mercadopago
- payment_type (VARCHAR 50) - Tipo: boleto, pix
- status (VARCHAR 50) - Estado: pending, approved, rejected
- amount (DECIMAL 10,2) - Valor do pagamento
- external_id (VARCHAR 255) - ID do Mercado Pago
- external_url (VARCHAR 500) - URL externa (para boleto)
- qr_code (TEXT) - QR Code (para PIX)
- copy_paste (TEXT) - Cópia e Cola (para PIX)
- created_at (DATETIME) - Criação do pagamento
- paid_at (DATETIME) - Confirmação do pagamento
```

#### `payment_webhooks`
```sql
- id (INT AUTO_INCREMENT) - ID único
- external_id (VARCHAR 255) - ID externo do Mercado Pago
- event_type (VARCHAR 100) - Tipo de evento
- status (VARCHAR 50) - Status do evento
- data (JSON) - Dados completos do webhook
- processed (TINYINT) - Flag de processamento
- created_at (DATETIME) - Timestamp
```

## Endpoints da API

### Faturas

#### `GET /api/invoices`
Retorna todas as faturas (requer permissão `manage_clients`)

**Response:**
```json
[
  {
    "id": "INV-1234567890",
    "client_id": "client1",
    "client_name": "Empresa XYZ",
    "plan_id": "standard",
    "plan_name": "Profissional",
    "amount": "199.00",
    "status": "pending",
    "due_date": "2025-12-25",
    "issued_at": "2025-11-17T10:00:00",
    "paid_at": null,
    "notes": "Primeira fatura"
  }
]
```

#### `GET /api/invoices/:clientId`
Retorna faturas de um cliente específico

#### `POST /api/invoices`
Cria uma nova fatura (requer permissão `manage_clients`)

**Request Body:**
```json
{
  "client_id": "client1",
  "plan_id": "standard",
  "amount": "199.00",
  "due_date": "2025-12-25",
  "notes": "Renovação de licença"
}
```

### Pagamentos

#### `POST /api/payments/create`
Cria um pagamento (boleto ou PIX)

**Request Body:**
```json
{
  "invoice_id": "INV-1234567890",
  "client_id": "client1",
  "payment_method": "mercadopago",
  "payment_type": "boleto" // ou "pix"
}
```

**Response (Boleto):**
```json
{
  "payment_id": "PAY-1234567890",
  "external_id": "98765432",
  "status": "pending",
  "payment_type": "boleto",
  "transaction_details": {
    "external_resource_url": "https://www.mercadopago.com.br/boleto/..."
  }
}
```

**Response (PIX):**
```json
{
  "payment_id": "PAY-1234567890",
  "external_id": "98765432",
  "status": "pending",
  "payment_type": "pix",
  "qr_code": "00020126580014br.gov.bcb.brcode...",
  "copy_paste": "00020126580014br.gov.bcb.brcode..."
}
```

#### `GET /api/payments/:paymentId/status`
Verifica o status de um pagamento

**Response:**
```json
{
  "id": "PAY-1234567890",
  "invoice_id": "INV-1234567890",
  "status": "approved",
  "amount": "199.00",
  "created_at": "2025-11-17T10:05:00",
  "paid_at": "2025-11-17T10:15:00"
}
```

#### `GET /api/payments/invoice/:invoiceId`
Retorna todos os pagamentos de uma fatura

#### `POST /api/webhooks/mercadopago`
Webhook para receber notificações do Mercado Pago (executado automaticamente)

## Configuração

### 1. Instalar Dependências

```bash
cd server
npm install
```

O package.json já inclui `mercadopago` v2.0.0+

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na pasta `server/` com:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=Password123!
DB_NAME=crm_licensing
PORT=4000
JWT_SECRET=seu-secret-aqui
FRONTEND_URL=http://localhost:5173
MERCADOPAGO_TOKEN=seu_token_aqui
```

### 3. Obter Token do Mercado Pago

1. Acesse [Mercado Pago Developers](https://www.mercadopago.com.br/developers/panel)
2. Faça login com sua conta
3. Copie o **Access Token** da seção "Credenciais"
4. Cole no arquivo `.env` como `MERCADOPAGO_TOKEN`

### 4. Configurar Webhook no Mercado Pago

1. No painel do Mercado Pago, acesse "Notificações"
2. Configure a URL do webhook: `https://seu-dominio.com/api/webhooks/mercadopago`
3. Selecione os eventos: `payment.created`, `payment.updated`

### 5. Criar Tabelas no Banco de Dados

```bash
cd server
mysql -u root -p < schema.sql
```

Ou execute as queries SQL do arquivo `schema.sql` manualmente.

## Interface Frontend

### Tela de Financeiro

Acesse via menu "Financeiro" na navegação principal.

#### Dashboard
- **Resumo financeiro** com 4 métricas principais
- Atualização em tempo real

#### Criar Fatura
- Formulário para gerar nova fatura
- Selecione cliente e plano
- Defina valor e data de vencimento
- Adicione observações

#### Lista de Faturas
- **Filtros**: Todas, Pendentes, Pagas, Vencidas
- **Cards informativos** com:
  - Status da fatura
  - Valor
  - Data de vencimento
  - Plano associado

#### Gerar Pagamento
- **Botão "Gerar Boleto"**: Cria boleto para pagamento
- **Botão "Gerar PIX"**: Cria QR code PIX instantâneo
- **Verificar Pagamento**: Consulta status em tempo real

#### Visualizar PIX/Boleto
- QR code PIX (escaneável)
- Cópia e Cola (copiável)
- Código de barras do boleto (quando disponível)

## Fluxo de Pagamento

### PIX (Recomendado)
```
1. Criar Fatura
   ↓
2. Clicar "Gerar PIX"
   ↓
3. Exibir QR Code + Cópia e Cola
   ↓
4. Cliente escaneia QR ou copia código
   ↓
5. Cliente faz transferência instantânea
   ↓
6. Webhook recebe notificação do Mercado Pago
   ↓
7. Fatura marcada como PAGA automaticamente
   ↓
8. Notificação criada no sistema
```

### Boleto
```
1. Criar Fatura
   ↓
2. Clicar "Gerar Boleto"
   ↓
3. Exibir código de barras e URL
   ↓
4. Cliente imprime ou faz pagamento online
   ↓
5. Webhook recebe notificação do Mercado Pago
   ↓
6. Fatura marcada como PAGA automaticamente
   ↓
7. Notificação criada no sistema
```

## Permissões Necessárias

O módulo requer a permissão `manage_clients` para:
- Criar faturas
- Visualizar todas as faturas
- Gerar pagamentos

Os clientes podem visualizar suas próprias faturas sem permissões adicionais.

## Tratamento de Erros

### Webhook não recebido?
1. Verifique a URL configurada no Mercado Pago
2. Verifique logs do servidor
3. Use a opção "Verificar Pagamento" manualmente

### Pagamento não confirmou?
1. Clique em "Verificar Pagamento" para sincronizar com Mercado Pago
2. Se o pagamento foi confirmado, o sistema atualizará automaticamente

### Token inválido?
1. Revise o Access Token no painel do Mercado Pago
2. Certifique-se de que está em ambiente de produção
3. Verifique permissões da conta

## Recursos Futuros

- [ ] Recibos em PDF
- [ ] Relatórios financeiros
- [ ] Integração com múltiplas formas de pagamento
- [ ] Agendamento de pagamentos
- [ ] Histórico de transações
- [ ] Juros e multas automáticas
- [ ] Integração com contabilidade
- [ ] Cupom fiscal eletrônico (NFe)

## Suporte

Para dúvidas sobre integração Mercado Pago, consulte:
- [Documentação Mercado Pago](https://www.mercadopago.com.br/developers/pt/reference)
- [SDKs Oficiais](https://www.mercadopago.com.br/developers/pt/sdk)
