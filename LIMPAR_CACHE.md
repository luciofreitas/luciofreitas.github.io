# 🔄 Como Forçar Atualização do CSS (Limpar Cache)

O CSS foi atualizado com sucesso, mas o navegador pode estar usando a **versão antiga em cache**.

## Soluções (na ordem de facilidade):

### 1️⃣ **CTRL + SHIFT + R** (Mais Rápido)
- **Windows/Linux**: `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`
- Faz um **hard reload** ignorando o cache

### 2️⃣ **CTRL + F5** (Alternativa)
- **Windows**: `Ctrl + F5`
- Force reload completo da página

### 3️⃣ **DevTools Cache Clear**
1. Abra o DevTools (F12)
2. Clique com **botão direito** no ícone de reload (ao lado da URL)
3. Selecione **"Empty Cache and Hard Reload"** ou **"Limpar cache e recarregar forçadamente"**

### 4️⃣ **Limpar Todo Cache do Navegador**

#### Chrome/Edge:
1. `Ctrl + Shift + Delete`
2. Selecione **"Imagens e arquivos em cache"**
3. Período: **"Última hora"**
4. Clique em **"Limpar dados"**

#### Firefox:
1. `Ctrl + Shift + Delete`
2. Marque **"Cache"**
3. Clique em **"Limpar agora"**

### 5️⃣ **Modo Incógnito/Privado** (Teste Rápido)
- Abra uma janela anônima (`Ctrl + Shift + N`)
- Acesse `http://localhost:5174`
- Verá a versão mais recente sem cache

---

## 🔍 Como Verificar se Funcionou

Após limpar o cache, inspecione o elemento `.login-card` no DevTools:

```css
/* ANTES (errado - cache): */
.login-card {
  width: 960px; /* ❌ Valor fixo antigo */
}

/* DEPOIS (correto - novo CSS): */
.login-card {
  width: clamp(18rem, 85vw, 60rem); /* ✅ Valor fluido */
}
```

### Teste as Resoluções:
- **1366x768**: Card deve ter ~1161px de largura (85% de 1366px)
- **1920x1080**: Card deve ter ~960px de largura (máximo do clamp)
- **Mobile**: Card reduz proporcionalmente

---

## 🚀 Se Ainda Não Funcionar

Reinicie o servidor de desenvolvimento:
```powershell
# No terminal, pressione Ctrl+C para parar o servidor
# Depois execute:
npm run dev
```

O servidor agora está configurado com headers de cache desabilitados!
