# 🔐 Configuração de Variáveis de Ambiente

Este projeto usa variáveis de ambiente para proteger credenciais sensíveis como chaves de API.

## 📋 Configuração Local

### 1. Criar arquivo de ambiente local

```bash
# Copie o arquivo de exemplo
cp .env.example .env.local
```

### 2. Preencher com suas credenciais

Abra o arquivo `.env.local` e preencha com suas credenciais reais do EmailJS:

```env
VITE_EMAILJS_PUBLIC_KEY=sua_public_key_aqui
VITE_EMAILJS_SERVICE_ID=seu_service_id_aqui
VITE_EMAILJS_TEMPLATE_CONTACT=seu_template_contato_aqui
VITE_EMAILJS_TEMPLATE_RESET=seu_template_reset_aqui
```

### 3. Onde encontrar as credenciais do EmailJS

#### Public Key:
1. Acesse https://emailjs.com
2. Clique no seu nome (canto superior direito)
3. Vá em **Account** → **General**
4. Copie a **Public Key**

#### Service ID:
1. No menu lateral, clique em **Email Services**
2. Copie o **Service ID** ao lado do serviço Gmail/Outlook

#### Template IDs:
1. No menu lateral, clique em **Email Templates**
2. Copie o **Template ID** de cada template:
   - Template de Contato → `VITE_EMAILJS_TEMPLATE_CONTACT`
   - Template de Reset de Senha → `VITE_EMAILJS_TEMPLATE_RESET`

### 4. Reiniciar servidor

Após criar/editar `.env.local`, reinicie o servidor de desenvolvimento:

```bash
npm run dev
```

---

## 🚀 Deploy em Produção

### GitHub Pages (Render/Vercel/Netlify)

Como o GitHub Pages não suporta variáveis de ambiente no build, você tem 2 opções:

#### Opção A: Usar GitHub Actions com Secrets

1. Vá em **Settings** → **Secrets and variables** → **Actions**
2. Adicione os secrets:
   - `VITE_EMAILJS_PUBLIC_KEY`
   - `VITE_EMAILJS_SERVICE_ID`
   - `VITE_EMAILJS_TEMPLATE_CONTACT`
   - `VITE_EMAILJS_TEMPLATE_RESET`

3. Crie `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ master ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
        env:
          VITE_EMAILJS_PUBLIC_KEY: ${{ secrets.VITE_EMAILJS_PUBLIC_KEY }}
          VITE_EMAILJS_SERVICE_ID: ${{ secrets.VITE_EMAILJS_SERVICE_ID }}
          VITE_EMAILJS_TEMPLATE_CONTACT: ${{ secrets.VITE_EMAILJS_TEMPLATE_CONTACT }}
          VITE_EMAILJS_TEMPLATE_RESET: ${{ secrets.VITE_EMAILJS_TEMPLATE_RESET }}
      - run: cp -r dist docs
      - uses: stefanzweifel/git-auto-commit-action@v4
        with:
          commit_message: "Deploy to GitHub Pages"
```

#### Opção B: Build local e commit do /docs

Se preferir continuar fazendo build localmente:

1. As variáveis do `.env.local` serão usadas no build
2. O build compilado irá para `/docs`
3. Faça commit e push normalmente

---

## ⚠️ Segurança

- ✅ Arquivo `.env.local` está no `.gitignore`
- ✅ Nunca commite credenciais no Git
- ✅ Public Key do EmailJS é segura para expor (frontend)
- ⚠️ Service ID e Template IDs também podem ser expostos (risco baixo)

---

## 🧪 Testando

Para verificar se as variáveis estão carregadas:

```javascript
console.log('EmailJS configurado:', {
  hasPublicKey: !!import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
  hasServiceId: !!import.meta.env.VITE_EMAILJS_SERVICE_ID,
  hasTemplateContact: !!import.meta.env.VITE_EMAILJS_TEMPLATE_CONTACT
});
```

---

## 📚 Referências

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [EmailJS Documentation](https://www.emailjs.com/docs/)
