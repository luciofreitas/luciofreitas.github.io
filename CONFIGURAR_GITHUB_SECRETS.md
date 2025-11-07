# 🔐 Configurar Secrets no GitHub para Deploy Automático

## 📋 Passo a Passo Completo

### **1️⃣ Acessar Configurações do Repositório**

1. Acesse: https://github.com/luciofreitas/luciofreitas.github.io
2. Clique na aba **"Settings"** (Configurações)
3. No menu lateral esquerdo, procure por **"Secrets and variables"**
4. Clique em **"Actions"**

---

### **2️⃣ Adicionar os 4 Secrets**

Clique no botão verde **"New repository secret"** e adicione cada um destes:

#### **Secret 1: Public Key**
- **Name:** `VITE_EMAILJS_PUBLIC_KEY`
- **Value:** `k8h3SZ62ntwf2hBGV`
- Clique em **"Add secret"**

#### **Secret 2: Service ID**
- **Name:** `VITE_EMAILJS_SERVICE_ID`
- **Value:** `service_0s8bzau`
- Clique em **"Add secret"**

#### **Secret 3: Template de Contato**
- **Name:** `VITE_EMAILJS_TEMPLATE_CONTACT`
- **Value:** `template_x12ij9d`
- Clique em **"Add secret"**

#### **Secret 4: Template de Reset de Senha**
- **Name:** `VITE_EMAILJS_TEMPLATE_RESET`
- **Value:** `template_y3axysk`
- Clique em **"Add secret"**

---

### **3️⃣ Verificar se os Secrets foram Adicionados**

Após adicionar todos, você verá uma lista assim:

```
Repository secrets (4)
✓ VITE_EMAILJS_PUBLIC_KEY        Updated X seconds ago
✓ VITE_EMAILJS_SERVICE_ID        Updated X seconds ago
✓ VITE_EMAILJS_TEMPLATE_CONTACT  Updated X seconds ago
✓ VITE_EMAILJS_TEMPLATE_RESET    Updated X seconds ago
```

---

### **4️⃣ Como Funciona Agora**

#### **Desenvolvimento Local:**
- Usa `.env.local` (suas credenciais no PC)
- Funciona normalmente com `npm run dev`

#### **Deploy Automático (GitHub Actions):**
- ✅ Toda vez que você fizer `git push origin master`
- ✅ GitHub Actions roda automaticamente
- ✅ Faz build usando os **Secrets** configurados
- ✅ Copia para `/docs` e faz commit automático
- ✅ Deploy no GitHub Pages

---

### **5️⃣ Acompanhar o Deploy**

1. Após fazer `git push`, vá em: https://github.com/luciofreitas/luciofreitas.github.io/actions
2. Você verá um workflow rodando: **"Deploy to GitHub Pages"**
3. Clique nele para ver o progresso em tempo real
4. ✅ Quando ficar verde, o deploy foi concluído!

---

### **6️⃣ Testando**

1. Após o deploy, acesse: https://luciofreitas.github.io
2. Vá para a página de **Contato**
3. Preencha o formulário e envie
4. Verifique se o email chegou em `suportegaragemsmart@gmail.com`

---

## 🔄 **Fluxo de Trabalho Atualizado**

**ANTES (Manual):**
```bash
npm run build
Remove-Item -Recurse -Force docs
Copy-Item -Recurse dist docs
git add .
git commit -m "Deploy"
git push
```

**AGORA (Automático):**
```bash
# Apenas faça suas alterações e:
git add .
git commit -m "Suas alterações"
git push

# GitHub Actions faz o resto automaticamente! 🎉
```

---

## ⚠️ **IMPORTANTE**

### **Se o deploy falhar:**

1. Vá em **Actions** no GitHub
2. Clique no workflow que falhou
3. Veja qual step deu erro
4. Possíveis causas:
   - ❌ Secrets não configurados
   - ❌ Nome dos secrets errado (deve ser EXATO)
   - ❌ Erro no build (veja os logs)

### **Para desabilitar o deploy automático:**

Se preferir fazer manual novamente:
1. Delete o arquivo `.github/workflows/deploy.yml`
2. Faça commit e push
3. Volte ao fluxo manual

---

## 📝 **Checklist Final**

- [ ] Acessei Settings → Secrets and variables → Actions
- [ ] Adicionei `VITE_EMAILJS_PUBLIC_KEY`
- [ ] Adicionei `VITE_EMAILJS_SERVICE_ID`
- [ ] Adicionei `VITE_EMAILJS_TEMPLATE_CONTACT`
- [ ] Adicionei `VITE_EMAILJS_TEMPLATE_RESET`
- [ ] Fiz um teste fazendo `git push`
- [ ] Acompanhei o workflow em Actions
- [ ] Testei o site em produção

---

**Pronto! Agora você tem deploy automático com segurança! 🚀**
