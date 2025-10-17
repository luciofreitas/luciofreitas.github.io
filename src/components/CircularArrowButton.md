# CircularArrowButton Component

## Descrição
Componente de botão circular com seta, criado como alternativa ao GetStartedButton. Mantém o mesmo degradê dourado e estilo visual, mas em formato circular compacto.

# CircularArrowButton Component

## Descrição
Componente de botão circular com seta, criado como alternativa ao `GetStartedButton`. Mantém o mesmo degradê dourado e estilo visual, mas em formato circular compacto.

## Uso

```jsx
import { CircularArrowButton } from '.'; // importa do barrel em src/components

// Uso básico
<CircularArrowButton onClick={() => navigate('/login')} />

// Com tamanhos diferentes
<CircularArrowButton size="small" onClick={() => navigate('/login')} />
<CircularArrowButton size="large" onClick={() => navigate('/login')} />
<CircularArrowButton size="extra-large" onClick={() => navigate('/login')} />

// Com classes CSS customizadas
<CircularArrowButton className="minha-classe-custom" onClick={() => navigate('/login')} />
```

## Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `onClick` | `function` | - | Função chamada quando o botão é clicado |
| `className` | `string` | `''` | Classes CSS adicionais |
| `size` | `'small' \| 'medium' \| 'large' \| 'extra-large'` | `'medium'` | Tamanho do botão |

## Tamanhos Disponíveis

- **small**: 40px (mobile: 36px)
- **medium**: 56px (mobile: 48px) - padrão
- **large**: 64px (mobile: 56px)
- **extra-large**: 80px (sem alteração mobile)

## Características

- ✅ Formato circular perfeito
- ✅ Degradê dourado (igual ao GetStartedButton)
- ✅ Sombras e efeitos visuais
- ✅ Animações de hover e active
- ✅ Responsivo para mobile
- ✅ Acessibilidade (aria-label, focus-visible)
- ✅ Estados disabled
- ✅ Múltiplos tamanhos

## Exemplo de Integração

Para usar no lugar do `GetStartedButton` em versões mobile:

```jsx
// No MenuLogin.jsx
import { GetStartedButton, CircularArrowButton } from '.';

{isDesktop ? (
  <GetStartedButton onClick={handleNavigation(() => navigate('/login'))} />
) : (
  <CircularArrowButton onClick={handleNavigation(() => navigate('/login'))} />
)}
```