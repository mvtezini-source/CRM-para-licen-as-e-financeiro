# 🔐 Implementação de 2FA (Two-Factor Authentication)

## 📋 Visão Geral

Este é o próximo item crítico no roadmap do CRM. A implementação de 2FA aumentará significativamente a segurança do sistema.

## 🎯 Objetivos

1. Adicionar TOTP (Time-based One-Time Password) - Google Authenticator
2. Suporte a SMS como fallback
3. Códigos de backup para recuperação
4. Enforcement de 2FA por role
5. UI/UX seamless para usuários

## 📐 Arquitetura de 2FA

### Fluxo de Autenticação com 2FA

```
1. Usuário entra email e senha
   ↓
2. Sistema valida credenciais
   ↓
3. Se válido, envia desafio 2FA
   ↓
4. Usuário insere código do authenticator (TOTP) ou SMS
   ↓
5. Sistema valida código
   ↓
6. Se válido, emite JWT com flag 2fa_verified
   ↓
7. Acesso concedido
```

### Tipos de 2FA Suportados

#### 1. TOTP (Time-based One-Time Password)
- Códigos gerados localmente no dispositivo
- Algoritmo: SHA-1 com HMAC
- Duração: 30 segundos
- Compatível com Google Authenticator, Authy, Microsoft Authenticator

#### 2. SMS
- Envio de código via SMS
- Backup para TOTP
- Integração com Twilio
- Códigos com validade de 5 minutos

#### 3. Backup Codes
- Códigos de 8 dígitos gerados uma única vez
- Para emergências quando 2FA está indisponível
- Cada código só pode ser usado uma vez

## 🔧 Implementação Técnica

### Backend - Dependências
```bash
npm install speakeasy qrcode dotenv twilio
```

### Backend - Tabelas do Banco de Dados

#### Nova tabela: `user_2fa`
```sql
CREATE TABLE user_2fa (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL UNIQUE,
  totp_secret VARCHAR(255) NOT NULL,
  totp_enabled BOOLEAN DEFAULT FALSE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  sms_phone VARCHAR(20),
  verified_at TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

#### Nova tabela: `user_backup_codes`
```sql
CREATE TABLE user_backup_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  code VARCHAR(10) NOT NULL UNIQUE,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

#### Nova tabela: `user_2fa_attempts`
```sql
CREATE TABLE user_2fa_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  ip_address VARCHAR(45),
  success BOOLEAN,
  method ENUM('totp', 'sms', 'backup_code'),
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

### Backend - Endpoints

```javascript
// Novos endpoints para 2FA:

// 1. Gerar QR Code para TOTP
POST /api/auth/2fa/generate-totp
Response: { secret, qrCode (base64) }

// 2. Verificar e ativar TOTP
POST /api/auth/2fa/verify-totp
Body: { secret, code }
Response: { backupCodes, message }

// 3. Enviar código SMS
POST /api/auth/2fa/send-sms
Body: { phoneNumber }
Response: { message, expires_at }

// 4. Verificar código 2FA no login
POST /api/auth/2fa/verify-code
Body: { userId, code, method }
Response: { token, refresh_token }

// 5. Obter status de 2FA
GET /api/auth/2fa/status
Response: { totp_enabled, sms_enabled, sms_phone, backup_codes_count }

// 6. Desabilitar 2FA
DELETE /api/auth/2fa
Response: { message }

// 7. Regenerar backup codes
POST /api/auth/2fa/regenerate-backup-codes
Response: { backupCodes }
```

### Backend - Serviço de 2FA

```javascript
// server/2fa.js

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { Twilio } from 'twilio';

export async function generateTOTPSecret(userId, email) {
  const secret = speakeasy.generateSecret({
    name: `CRM Licenciamento (${email})`,
    issuer: 'CRM Licenciamento',
    length: 32
  });
  
  return {
    secret: secret.base32,
    qrCode: await QRCode.toDataURL(secret.otpauth_url)
  };
}

export async function verifyTOTPCode(secret, code) {
  const verified = speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: code,
    window: 2
  });
  
  return verified !== undefined;
}

export async function generateBackupCodes(userId) {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
  }
  return codes;
}

export async function sendSMSCode(phoneNumber) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  
  await client.messages.create({
    body: `Seu código de segurança CRM é: ${code}. Válido por 5 minutos.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phoneNumber
  });
  
  return code; // Salvar em cache com expiração
}

export async function verifyBackupCode(userId, code) {
  const result = await pool.query(
    'SELECT id FROM user_backup_codes WHERE userId = ? AND code = ? AND used = FALSE',
    [userId, code]
  );
  
  if (result[0].length === 0) return false;
  
  // Marcar como usado
  await pool.query(
    'UPDATE user_backup_codes SET used = TRUE, used_at = NOW() WHERE id = ?',
    [result[0][0].id]
  );
  
  return true;
}
```

### Frontend - Componente de Configuração de 2FA

```javascript
// src/components/2FA.jsx

import { useState } from 'react';
import api from '../services/apiService';

export default function TwoFactorSetup() {
  const [step, setStep] = useState(1); // 1: Menu, 2: TOTP, 3: SMS, 4: Backup
  const [totp, setTotp] = useState({ secret: null, qrCode: null });
  const [totpCode, setTotpCode] = useState('');
  const [smsPhone, setSmsPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [status, setStatus] = useState({});

  const handleGenerateTotp = async () => {
    try {
      const response = await api.post('/api/auth/2fa/generate-totp');
      setTotp(response.data);
      setStep(2);
    } catch (error) {
      alert('Erro: ' + error.message);
    }
  };

  const handleVerifyTotp = async () => {
    try {
      const response = await api.post('/api/auth/2fa/verify-totp', {
        secret: totp.secret,
        code: totpCode
      });
      setBackupCodes(response.data.backupCodes);
      alert('TOTP ativado com sucesso!');
      setStep(4); // Mostrar backup codes
    } catch (error) {
      alert('Código incorreto. Tente novamente.');
    }
  };

  const handleSendSms = async () => {
    try {
      await api.post('/api/auth/2fa/send-sms', {
        phoneNumber: smsPhone
      });
      alert('Código enviado! Verifique seu SMS.');
      setStep(3);
    } catch (error) {
      alert('Erro ao enviar SMS: ' + error.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '0 auto' }}>
      <h2>🔐 Configurar Autenticação de Dois Fatores</h2>

      {step === 1 && (
        <div>
          <p>Escolha como você quer proteger sua conta:</p>
          <button onClick={handleGenerateTotp} style={styles.button}>
            📱 Google Authenticator / Authy
          </button>
          <button onClick={() => setStep(3)} style={styles.button}>
            📲 SMS
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <p>1. Abra seu app de autenticação (Google Authenticator)</p>
          <p>2. Escaneie este código QR:</p>
          <img src={totp.qrCode} alt="QR Code" style={{ width: 200 }} />
          <p>3. Digite o código de 6 dígitos:</p>
          <input
            type="text"
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value)}
            maxLength={6}
            style={styles.input}
            placeholder="000000"
          />
          <button onClick={handleVerifyTotp} style={styles.button}>
            Verificar Código
          </button>
        </div>
      )}

      {step === 3 && (
        <div>
          <p>Número de telefone (com código do país):</p>
          <input
            type="tel"
            value={smsPhone}
            onChange={(e) => setSmsPhone(e.target.value)}
            style={styles.input}
            placeholder="+55 11 99999-9999"
          />
          <input
            type="text"
            value={smsCode}
            onChange={(e) => setSmsCode(e.target.value)}
            maxLength={6}
            style={styles.input}
            placeholder="Código do SMS"
          />
          <button onClick={handleSendSms} style={styles.button}>
            Enviar Código
          </button>
        </div>
      )}

      {step === 4 && (
        <div>
          <p>⚠️ Guarde estes códigos de backup em local seguro:</p>
          <div style={styles.codeBox}>
            {backupCodes.map((code, i) => (
              <code key={i}>{code}</code>
            ))}
          </div>
          <button onClick={() => setStep(1)} style={styles.button}>
            Concluído
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  button: {
    width: '100%',
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer'
  },
  input: {
    width: '100%',
    padding: 10,
    marginBottom: 10,
    border: '1px solid #ddd',
    borderRadius: 4
  },
  codeBox: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 4,
    marginBottom: 10,
    fontFamily: 'monospace',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10
  }
};
```

### Frontend - Tela de Login com 2FA

```javascript
// Modificação em src/components/Login.jsx

const [step, setStep] = useState(1); // 1: Email/Senha, 2: 2FA
const [tempToken, setTempToken] = useState(null);
const [twoFACode, setTwoFACode] = useState('');

const handleLogin = async (e) => {
  e.preventDefault();
  try {
    const response = await api.post('/api/auth/login', {
      email,
      password
    });

    if (response.data.requires_2fa) {
      setTempToken(response.data.temp_token);
      setStep(2); // Mostrar tela de 2FA
    } else {
      localStorage.setItem('token', response.data.token);
      setUserId(response.data.userId);
      onLogin();
    }
  } catch (error) {
    alert('Erro: ' + error.message);
  }
};

const handleVerify2FA = async (e) => {
  e.preventDefault();
  try {
    const response = await api.post('/api/auth/2fa/verify-code', {
      code: twoFACode,
      temp_token: tempToken
    });

    localStorage.setItem('token', response.data.token);
    setUserId(response.data.userId);
    onLogin();
  } catch (error) {
    alert('Código inválido!');
  }
};

// Se step === 2, mostrar campo de 2FA
{step === 2 && (
  <form onSubmit={handleVerify2FA}>
    <h3>Verificação de Segurança</h3>
    <input
      type="text"
      value={twoFACode}
      onChange={(e) => setTwoFACode(e.target.value)}
      placeholder="Digite o código de 6 dígitos"
      maxLength={6}
    />
    <button type="submit">Verificar</button>
  </form>
)}
```

## 🧪 Testes

### Testes Unitários
```javascript
describe('2FA Service', () => {
  it('should generate valid TOTP secret', async () => {
    const secret = await generateTOTPSecret(1, 'test@example.com');
    expect(secret.qrCode).toBeDefined();
    expect(secret.secret).toBeDefined();
  });

  it('should verify valid TOTP code', async () => {
    const secret = speakeasy.generateSecret();
    const token = speakeasy.totp({ secret: secret.base32 });
    const result = await verifyTOTPCode(secret.base32, token);
    expect(result).toBe(true);
  });

  it('should reject invalid TOTP code', async () => {
    const result = await verifyTOTPCode('invalid-secret', '000000');
    expect(result).toBe(false);
  });
});
```

### Testes E2E (Playwright)
```javascript
test('Enable 2FA with TOTP', async ({ page }) => {
  await login(page);
  await page.click('[data-test="settings"]');
  await page.click('[data-test="2fa-setup"]');
  
  // Scan QR Code
  const qrCode = await page.locator('img[alt="QR Code"]');
  expect(qrCode).toBeVisible();
  
  // Enter TOTP code
  const totp = generateTOTPCode(); // Mock
  await page.fill('[data-test="totp-input"]', totp);
  await page.click('[data-test="verify-totp"]');
  
  // See backup codes
  const backupCodes = await page.locator('[data-test="backup-codes"]');
  expect(backupCodes).toBeVisible();
});
```

## 📊 Métricas de Sucesso

- ✅ 2FA implementado e funcional
- ✅ 95%+ de taxa de sucesso na verificação
- ✅ < 100ms para validação de código
- ✅ 0% taxa de erro de TOTP
- ✅ UI/UX intuitiva (< 2 min para setup)
- ✅ 100% de cobertura de testes

## 🚀 Plano de Rollout

### Fase 1: Alpha (Interno)
- [ ] Testes com equipe interna
- [ ] Testes de segurança
- [ ] Otimizações de performance

### Fase 2: Beta (Clientes Piloto)
- [ ] Disponibilizar como opcional
- [ ] Coletar feedback
- [ ] Ajustes baseados em feedback

### Fase 3: GA (Produção)
- [ ] Lançamento público
- [ ] 2FA obrigatório para admins
- [ ] Comunicação aos usuários

## ⚠️ Considerações de Segurança

1. **Rate Limiting**: Limitar tentativas de código
2. **Session Timeout**: Expiração de temp tokens
3. **Audit Logging**: Logar todas as tentativas de 2FA
4. **Backup Codes**: Nunca mostrar em email, apenas em setup
5. **HTTPS Only**: 2FA deve funcionar apenas em HTTPS
6. **Cookie Security**: Flags Secure, HttpOnly, SameSite

## 📝 Próximos Passos

1. Validar requisitos com stakeholders
2. Começar implementação do backend
3. Implementar testes unitários
4. Criar componentes frontend
5. Realizar testes E2E
6. Deploy em staging
7. Beta testing com grupo piloto
8. Launch em produção

---

**Estimativa:** 40 horas
**Prioridade:** 🔴 Crítica
**Complexidade:** ⭐⭐⭐ Média
