# 📧 Configuração do EmailJS

Este guia explica como configurar o EmailJS para receber emails do formulário de contato em `suportegaragemsmart@gmail.com`.

## 🚀 Passo a Passo

### 1. Criar Conta no EmailJS

1. Acesse: https://emailjs.com
2. Clique em **"Sign Up"** (ou "Get Started")
3. Crie uma conta gratuita (você tem direito a 200 emails/mês)

---

### 2. Adicionar Serviço de Email

1. No dashboard do EmailJS, vá em **"Email Services"**
2. Clique em **"Add New Service"**
3. Escolha seu provedor (Gmail recomendado):
   - **Gmail**: Selecione "Gmail"
   - Conecte sua conta Gmail (`suportegaragemsmart@gmail.com`)
   - Autorize o acesso
4. Depois de conectar, copie o **Service ID** (exemplo: `service_xyz123`)

📝 **Dica**: Se usar Gmail, pode precisar permitir "Apps menos seguros" ou criar uma "Senha de app" nas configurações do Google.

---

### 3. Criar Template de Email

1. No dashboard, vá em **"Email Templates"**
2. Clique em **"Create New Template"**
3. Configure o template:

**Subject (Assunto):**
```
Nova mensagem de contato - {{from_name}}
```

**Content (Conteúdo):**
```
Você recebeu uma nova mensagem de contato:

Nome: {{from_name}}
Email: {{from_email}}
User ID: {{user_id}}

Mensagem:
{{message}}

---
Enviado através do formulário de contato
Garagem Smart - Peças Automotivas
```

**To Email:**
```
suportegaragemsmart@gmail.com
```

4. Clique em **"Save"**
5. Copie o **Template ID** (exemplo: `template_abc456`)

---

### 4. Copiar Public Key

1. No dashboard, clique no seu nome (canto superior direito)
2. Vá em **"Account"** → **"General"**
3. Na seção **"API Keys"**, copie sua **Public Key** (exemplo: `AbCdEfGh123456789`)

---

### 5. Configurar no Projeto

1. Abra o arquivo: `src/config/emailjs.config.js`
2. Substitua os valores:

```javascript
export const EMAILJS_CONFIG = {
  PUBLIC_KEY: 'SUA_PUBLIC_KEY_AQUI',      // ← Cole aqui
  SERVICE_ID: 'SEU_SERVICE_ID_AQUI',       // ← Cole aqui
  TEMPLATE_ID: 'SEU_TEMPLATE_ID_AQUI',     // ← Cole aqui
  DESTINATION_EMAIL: 'suportegaragemsmart@gmail.com'
};
```

**Exemplo configurado:**
```javascript
export const EMAILJS_CONFIG = {
  PUBLIC_KEY: 'AbCdEfGh123456789',
  SERVICE_ID: 'service_xyz123',
  TEMPLATE_ID: 'template_abc456',
  DESTINATION_EMAIL: 'suportegaragemsmart@gmail.com'
};
```

---

### 6. Testar

1. Execute o projeto: `npm run dev`
2. Vá para a página **Contato** ou **Contato Logado**
3. Preencha o formulário e clique em **"Enviar Mensagem"**
4. Verifique se a mensagem chegou em `suportegaragemsmart@gmail.com`

---

## ✅ Checklist

- [ ] Conta criada no EmailJS
- [ ] Serviço de email configurado (Gmail)
- [ ] Template criado com variáveis corretas
- [ ] Public Key, Service ID e Template ID copiados
- [ ] Arquivo `emailjs.config.js` atualizado
- [ ] Testado envio de email

---

## 🔍 Variáveis do Template

O formulário envia estas variáveis para o EmailJS:

| Variável | Descrição |
|----------|-----------|
| `{{from_name}}` | Nome do remetente |
| `{{from_email}}` | Email do remetente |
| `{{message}}` | Mensagem do contato |
| `{{user_id}}` | ID do usuário (ou "Visitante") |
| `{{to_email}}` | Email de destino (suportegaragemsmart@gmail.com) |

---

## ❌ Problemas Comuns

### "EmailJS não configurado"
- Verifique se você substituiu os valores no `emailjs.config.js`
- As credenciais NÃO podem conter `'SUA_PUBLIC_KEY_AQUI'`

### "Template não encontrado" (erro 412)
- Verifique se o Template ID está correto
- Certifique-se de que o template foi salvo no EmailJS

### "Credenciais inválidas" (erro 400)
- Verifique Public Key e Service ID
- Confirme que o serviço está ativo no EmailJS

### Email não chega
- Verifique a pasta de SPAM
- Confirme que `suportegaragemsmart@gmail.com` está configurado no template
- Veja os logs no dashboard do EmailJS

---

## 📊 Limites da Conta Gratuita

- ✅ **200 emails/mês** grátis
- ✅ Todos os recursos disponíveis
- ⚠️ Se ultrapassar, pode fazer upgrade ou criar outra conta

---

## 🔐 Segurança

- ✅ A Public Key pode ser exposta no frontend (é segura)
- ✅ O template no EmailJS protege o email de destino
- ⚠️ Não exponha Service ID ou Template ID em locais públicos (mas tudo bem no código)

---

## 🎯 Próximos Passos

Após configurar:
1. Faça build: `npm run build`
2. Commit e push: `git add . && git commit -m "Configurar EmailJS" && git push`
3. Verifique em produção no GitHub Pages

---

**Dúvidas?** Consulte a documentação: https://www.emailjs.com/docs/
