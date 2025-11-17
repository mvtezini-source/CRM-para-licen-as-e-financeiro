# 🚀 Guia Rápido - Módulo Financeiro ASAAS

## ⚡ Setup em 5 Minutos

### 1️⃣ Obter Chave API ASAAS
```bash
# Acesse: https://www.asaas.com/register
# Ou use sandbox: https://sandbox.asaas.com
# Vá em: Configurações → API
# Copie seu token
```

### 2️⃣ Configurar .env
```bash
ASAAS_API_KEY=sk_live_xxxxxxxxxxxxx  # Sua chave API
ASAAS_ENV=sandbox                     # ou "production"
FRONTEND_URL=http://localhost:5173
```

### 3️⃣ Instalar Dependências
```bash
cd server
npm install
cd ..
```

### 4️⃣ Iniciar Servidor
```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
npm run dev
```

### 5️⃣ Criar Primeira Fatura
1. Acesse http://localhost:5173
2. Login com admin
3. Menu → Financeiro
4. "+ Nova Fatura"
5. Selecione cliente → Digite valor → Clique "Criar"

## 📋 Checklist de Configuração

- [ ] Criar conta ASAAS (https://www.asaas.com)
- [ ] Obter Chave API
- [ ] Configurar .env com ASAAS_API_KEY
- [ ] npm install na pasta server
- [ ] Backend rodando na porta 4000
- [ ] Frontend rodando na porta 5173
- [ ] Consegue fazer login
- [ ] Menu Financeiro aparece
- [ ] Consegue criar fatura
- [ ] Consegue gerar cobrança ASAAS
- [ ] Consegue ver PIX/Boleto

## 🏃 Fluxo Rápido de Teste

1. **Criar Fatura**
   - Menu → Financeiro
   - Clicar "+ Nova Fatura"
   - Selecionar cliente
   - Informar valor (ex: 100)
   - Clicar "Criar Fatura"

2. **Gerar Pagamento**
   - Na fatura criada, clicar "Gerar PIX" ou "Gerar Boleto"
   - PIX: Verá QR Code + Cópia e Cola
   - Boleto: Verá código de barras

3. **Simular Pagamento**
   - No painel Mercado Pago (sandbox)
   - Simular pagamento com ID da fatura
   - Webhook processará automaticamente
   - Fatura mudará para status PAID

4. **Verificar Status**
   - Clicar "Verificar Pagamento"
   - Sistema sincroniza com Mercado Pago
   - Status atualiza automaticamente

## 🔧 Troubleshooting

### Erro: Token inválido
- [ ] Revise token no painel Mercado Pago
- [ ] Certifique-se que está em PRODUÇÃO (não sandbox)
- [ ] Copie corretamente sem espaços

### Erro: Webhook não é acionado
- [ ] Configure URL no painel Mercado Pago
- [ ] Use ngrok ou similar para testar localmente
- [ ] Verifique logs do servidor

### Fatura não marca como paga
- [ ] Clique "Verificar Pagamento"
- [ ] Verifique se pagamento foi confirmado no Mercado Pago
- [ ] Verifique ID da fatura nos logs

### Boleto/PIX não aparecem
- [ ] Verifique se token está configurado
- [ ] Verifique se fatura foi criada com sucesso
- [ ] Revise console do servidor para erros

## 📱 URLs Importantes

- Painel Mercado Pago: https://www.mercadopago.com.br/developers/panel
- Documentação: https://www.mercadopago.com.br/developers/pt/reference
- Webhook tester: https://webhook.site/

## 💡 Dicas

- Use sandbox primeiro para testar
- PIX é mais rápido (instantâneo)
- Boleto leva 2-3 dias úteis
- Guarde IDs das faturas para referência
- Monitore logs para debugging

## 📞 Suporte Mercado Pago

- Email: devsupport@mercadopago.com
- Chat: https://www.mercadopago.com.br/developers/pt
- Forum: Comunidade oficial do Mercado Pago

---

**Status**: ✅ Implementação Completa
**Última Atualização**: 17 de Novembro de 2025
