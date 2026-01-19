// page-CriarGuia.jsx - Página para criar/editar guias customizados (apenas Pro)

import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Menu } from '../components';
import { AuthContext } from '../App';
import { guiasService } from '../services/guiasService';
import { corrigirAutorNomeGuiasAntigos } from '../services/guiasService';
import '../styles/pages/page-CriarGuia.css';
import { comparePtBr } from '../utils/sortUtils';

export default function CriarGuia() {
  const { usuarioLogado } = useContext(AuthContext) || {};
  // Não renderiza nada até usuarioLogado estar definido
  if (typeof usuarioLogado === 'undefined') {
    return null;
  }
  // Corrigir autorNome dos guias antigos ao carregar, se usuário logado
  useEffect(() => {
    if (!usuarioLogado || !usuarioLogado.email) return;
    corrigirAutorNomeGuiasAntigos(usuarioLogado.nome || usuarioLogado.email, usuarioLogado.email);
  }, [usuarioLogado && usuarioLogado.email, usuarioLogado && usuarioLogado.nome]);
  const navigate = useNavigate();
  const { guiaId } = useParams(); // Para edição
  const isEditing = Boolean(guiaId);

  // Estado do formulário
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    categoria: '',
    imagem: '',
    conteudo: ''
  });

  // Referência para evitar múltiplas execuções do useEffect
  const hasChecked = useRef(false);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Verificar se é Pro
  const isPro = Boolean((usuarioLogado && usuarioLogado.isPro) || localStorage.getItem('versaoProAtiva') === 'true');

  useEffect(() => {
    // Evitar múltiplas execuções
    if (hasChecked.current) return;
    
    // Aguardar usuário estar carregado
    if (!usuarioLogado) return;
    
    hasChecked.current = true;

    // Se estiver editando, verificar primeiro se é o autor
    if (isEditing && guiaId) {
      (async () => {
        const guia = await guiasService.getGuiaById(guiaId);
        
        if (!guia) {
          alert('Guia não encontrado');
          navigate('/guias');
          return;
        }

        // Verificar se é o autor
        if (guia.autorEmail !== usuarioLogado.email) {
          alert('Você não tem permissão para editar este guia');
          navigate('/guias');
          return;
        }

        // Se é o autor, pode editar mesmo sem ser Pro
        setFormData({
          titulo: guia.titulo,
          descricao: guia.descricao,
          categoria: guia.categoria,
          conteudo: guia.conteudo,
          imagem: guia.imagem || ''
        });
      })();
      return; // Não verificar Pro se estiver editando como autor
    }

    // Se estiver criando novo guia, verificar se é Pro
    if (!isPro) {
      navigate('/versao-pro');
      return;
    }
  }, [isPro, isEditing, guiaId, usuarioLogado?.email, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpar erro do campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.titulo.trim()) {
      newErrors.titulo = 'Título é obrigatório';
    } else if (formData.titulo.length < 10) {
      newErrors.titulo = 'Título deve ter pelo menos 10 caracteres';
    }

    if (!formData.descricao.trim()) {
      newErrors.descricao = 'Descrição é obrigatória';
    } else if (formData.descricao.length < 20) {
      newErrors.descricao = 'Descrição deve ter pelo menos 20 caracteres';
    }

    if (!formData.categoria) {
      newErrors.categoria = 'Selecione uma categoria';
    }

    if (!formData.conteudo.trim()) {
      newErrors.conteudo = 'Conteúdo é obrigatório';
    } else if (formData.conteudo.length < 100) {
      newErrors.conteudo = 'Conteúdo deve ter pelo menos 100 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage('');

    // Montar dados do autor (apenas nome, nunca e-mail)
    const autorNome = usuarioLogado?.nome || '';

    try {
      if (isEditing) {
        // Atualizar guia existente
        await guiasService.updateGuia(guiaId, { ...formData, autorNome }, usuarioLogado.email);
        setSuccessMessage('Guia atualizado com sucesso!');
      } else {
        // Criar novo guia (await to ensure optimistic state saved and remote POST fired)
        const novoGuia = await guiasService.createGuia({ ...formData, autorNome }, usuarioLogado.email);
        // Forçar atualização local do campo autorNome APÓS o carregamento da lista
        setTimeout(() => {
          if (novoGuia && novoGuia.id) {
            const stored = localStorage.getItem('user_custom_guias');
            if (stored) {
              const guias = JSON.parse(stored);
              const idx = guias.findIndex(g => g.id === novoGuia.id);
              if (idx !== -1) {
                guias[idx].autorNome = autorNome;
                localStorage.setItem('user_custom_guias', JSON.stringify(guias));
              }
            }
          }
        }, 500);
        setSuccessMessage('Guia criado com sucesso!');
      }

      // Short delay to let the UI settle and ensure the /guias page reads the updated list
      setTimeout(() => {
        navigate('/guias');
      }, 1000);

    } catch (error) {
      alert('Erro ao salvar guia: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  const categorias = [
    'Manutenção Preventiva',
    'Instalação de Peças',
    'Diagnóstico de Problemas',
    'Elétrica Automotiva',
    'Mecânica Geral',
    'Suspensão e Freios',
    'Motor e Transmissão',
    'Ar Condicionado',
    'Estética Automotiva',
    'Outros'
  ];

  // Não renderiza apenas se for criar novo E não for Pro
  // Se estiver editando, pode renderizar (já foi validado no useEffect)
  if (!isEditing && !isPro) {
    return null; // Não renderiza nada enquanto redireciona
  }

  return (
    <>
      <Menu />
      <div className="site-header-spacer"></div>
      <div className="page-wrapper">
        <div className="page-content" id="criar-guia">
          <h2 className="page-title">
            {isEditing ? '✏️ Editar Guia' : '📝 Criar Novo Guia'}
          </h2>

          <div className="criar-guia-intro">
            <p>Edite seu guia e compartilhe seu conhecimento atualizado com a comunidade.</p>
            <div style={{ marginTop: '0.5em' }}>
              <span style={{
                display: 'inline-block',
                background: '#ffb84d',
                color: '#222',
                fontWeight: 500,
                borderRadius: '0.7em',
                padding: '0.22em 0.8em',
                fontSize: '0.78em',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                letterSpacing: 0.05,
                lineHeight: 1.3
              }}>
                <span style={{ marginRight: '0.3em', fontSize: '0.95em' }}>⭐</span>
                RECURSO EXCLUSIVO PARA ASSINANTES PRO
              </span>
            </div>
            {successMessage && (
              <div className="success-message" style={{marginTop: '1em'}}>
                ✅ {successMessage}
              </div>
            )}
          </div>
          <form className="guia-form" onSubmit={handleSubmit}>
                        {/* Exibir imagem centralizada se houver URL válida */}
                        {formData.imagem && (
                          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '1.2em 0' }}>
                            <img
                              src={formData.imagem}
                              alt="Imagem do guia"
                              style={{
                                maxWidth: '90%',
                                maxHeight: '320px',
                                objectFit: 'contain',
                                borderRadius: '12px',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                                background: '#fff'
                              }}
                            />
                          </div>
                        )}
            {/* Título */}
            <div className="form-group">
              <label htmlFor="titulo" className="form-label">
                Título do Guia <span className="required">*</span>
              </label>
              <input
                type="text"
                id="titulo"
                name="titulo"
                className={`form-input ${errors.titulo ? 'error' : ''}`}
                value={formData.titulo}
                onChange={handleChange}
                placeholder="Ex: Como trocar o óleo do motor passo a passo"
                maxLength={100}
              />
              {errors.titulo && <span className="error-message">{errors.titulo}</span>}
              <span className="char-count">{formData.titulo.length}/100</span>
            </div>

            {/* Descrição */}
            <div className="form-group">
              <label htmlFor="descricao" className="form-label">
                Descrição Breve <span className="required">*</span>
              </label>
              <textarea
                id="descricao"
                name="descricao"
                className={`form-textarea ${errors.descricao ? 'error' : ''}`}
                value={formData.descricao}
                onChange={handleChange}
                placeholder="Breve resumo do que o guia aborda (20-200 caracteres)"
                rows={3}
                maxLength={200}
              />
              {errors.descricao && <span className="error-message">{errors.descricao}</span>}
              <span className="char-count">{formData.descricao.length}/200</span>
            </div>

            {/* Categoria */}
            <div className="form-group">
              <label htmlFor="categoria" className="form-label">
                Categoria <span className="required">*</span>
              </label>
              <select
                id="categoria"
                name="categoria"
                className={`form-select ${errors.categoria ? 'error' : ''}`}
                value={formData.categoria}
                onChange={handleChange}
              >
                <option value="">Selecione uma categoria</option>
                {[...categorias].sort(comparePtBr).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.categoria && <span className="error-message">{errors.categoria}</span>}
            </div>

            {/* URL da Imagem */}
            <div className="form-group">
              <label htmlFor="imagem" className="form-label">
                URL da Imagem (opcional)
              </label>
              <input
                type="url"
                id="imagem"
                name="imagem"
                className={`form-input${errors.imagem ? ' error' : ''}`}
                value={formData.imagem}
                onChange={handleChange}
                placeholder="https://exemplo.com/imagem.jpg"
              />
              {errors.imagem && <span className="error-message">{errors.imagem}</span>}
              <span className="help-text" style={{display: 'flex', alignItems: 'center', gap: '0.4em'}}>
                Cole o link de uma imagem ilustrativa para seu guia
                <span style={{position: 'relative', display: 'inline-block'}}>
                  <svg
                    width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{verticalAlign: 'middle', cursor: 'pointer'}}
                    onMouseOver={e => {
                      const tip = e.currentTarget.nextSibling;
                      if (tip) tip.style.display = 'block';
                    }}
                    onMouseOut={e => {
                      const tip = e.currentTarget.nextSibling;
                      if (tip) tip.style.display = 'none';
                    }}
                  >
                    <circle cx="12" cy="12" r="10" fill="#f3f4f6"/>
                    <circle cx="12" cy="8" r="1.2" fill="#888"/>
                    <rect x="11.1" y="11" width="1.8" height="5.2" rx="0.9" fill="#888"/>
                  </svg>
                  <span
                    style={{
                      display: 'none',
                      position: 'absolute',
                      right: 0,
                      top: '120%',
                      zIndex: 10,
                      background: '#fff',
                      color: '#222',
                      border: '1px solid #ddd',
                      borderRadius: '0.5em',
                      padding: '0.8em',
                      width: '320px',
                      fontSize: '0.95em',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}
                  >
                    <strong>Importante:</strong> Para que a imagem apareça corretamente, o link deve ser direto para o arquivo da imagem (terminando em <code>.jpg</code>, <code>.jpeg</code>, <code>.png</code>, <code>.gif</code>, <code>.webp</code> etc).<br/><br/>
                    Não use links de páginas como <code>prnt.sc</code> ou <code>imgur.com</code> sem pegar o endereço direto da imagem. Para obter o link correto, clique com o botão direito na imagem e escolha "Copiar endereço da imagem".<br/><br/>
                    Exemplos válidos:<br/>
                    <code>https://site.com/imagem.jpg</code><br/>
                    <code>https://imgur.com/abc123.png</code>
                  </span>
                </span>
              </span>
            </div>

            {/* Conteúdo */}
            <div className="form-group">
              <label htmlFor="conteudo" className="form-label">
                Conteúdo do Guia <span className="required">*</span>
              </label>
              <textarea
                id="conteudo"
                name="conteudo"
                className={`form-textarea large ${errors.conteudo ? 'error' : ''}`}
                value={formData.conteudo}
                onChange={handleChange}
                placeholder="Escreva aqui o conteúdo detalhado do seu guia. Seja claro e objetivo. Você pode usar quebras de linha para organizar melhor o conteúdo."
                rows={15}
                maxLength={5000}
              />
              {errors.conteudo && <span className="error-message">{errors.conteudo}</span>}
              <span className="char-count">{formData.conteudo.length}/5000</span>
            </div>

            {/* Dicas */}
            <div className="form-tips">
              <h3>💡 Dicas para um bom guia:</h3>
              <ul>
                <li>Use uma linguagem clara e objetiva</li>
                <li>Organize o conteúdo em passos numerados quando apropriado</li>
                <li>Inclua avisos de segurança quando necessário</li>
                <li>Mencione ferramentas e materiais necessários</li>
                <li>Seja específico sobre modelos e anos de veículos quando relevante</li>
              </ul>
            </div>

            {/* Botões */}
            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => navigate('/guias')}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-submit"
                disabled={isSubmitting}
              >
                {isSubmitting 
                  ? (isEditing ? 'Salvando...' : 'Criando...') 
                  : (isEditing ? 'Salvar Alterações' : 'Criar Guia')
                }
              </button>
            </div>
          </form>

          {/* Aviso sobre avaliação */}
          {!isEditing && (
            <div className="evaluation-notice">
              <h3>📊 Sobre o sistema de avaliação</h3>
              <p>
                Seu guia ficará disponível para avaliação da comunidade por <strong>7 dias</strong>.
                Se a média de avaliações for inferior a <strong>3 estrelas</strong>, o guia ficará 
                oculto para outros usuários, permitindo que você o edite e melhore antes de 
                republicá-lo.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
