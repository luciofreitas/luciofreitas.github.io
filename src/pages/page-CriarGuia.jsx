// page-CriarGuia.jsx - Página para criar/editar guias customizados (apenas Pro)

import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Menu } from '../components';
import { AuthContext } from '../App';
import { guiasService } from '../services/guiasService';
import '../styles/pages/page-CriarGuia.css';

export default function CriarGuia() {
  const { usuarioLogado } = useContext(AuthContext) || {};
  const navigate = useNavigate();
  const { guiaId } = useParams(); // Para edição
  const isEditing = Boolean(guiaId);

  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    categoria: '',
    conteudo: '',
    imagem: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Verificar se é Pro
  const isPro = Boolean((usuarioLogado && usuarioLogado.isPro) || localStorage.getItem('versaoProAtiva') === 'true');

  useEffect(() => {
    // Redirecionar se não for Pro
    if (!isPro) {
      navigate('/seja-pro');
      return;
    }

    // Carregar dados se estiver editando
    if (isEditing && guiaId) {
      const guia = guiasService.getGuiaById(guiaId);
      
      if (!guia) {
        alert('Guia não encontrado');
        navigate('/guias');
        return;
      }

      // Verificar se é o autor
      if (guia.autorEmail !== usuarioLogado?.email) {
        alert('Você não tem permissão para editar este guia');
        navigate('/guias');
        return;
      }

      setFormData({
        titulo: guia.titulo,
        descricao: guia.descricao,
        categoria: guia.categoria,
        conteudo: guia.conteudo,
        imagem: guia.imagem || ''
      });
    }
  }, [isPro, isEditing, guiaId, usuarioLogado, navigate]);

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

    try {
      if (isEditing) {
        // Atualizar guia existente
        await guiasService.updateGuia(guiaId, formData, usuarioLogado.email);
        setSuccessMessage('Guia atualizado com sucesso!');
      } else {
        // Criar novo guia (await to ensure optimistic state saved and remote POST fired)
        const created = await guiasService.createGuia(formData, usuarioLogado.email);
        setSuccessMessage('Guia criado com sucesso!');
        console.debug('createGuia returned', created && created.id ? created.id : '(no-id)');
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

  if (!isPro) {
    return null; // Não renderiza nada enquanto redireciona
  }

  return (
    <>
      <Menu />
      <div className="page-wrapper">
        <div className="page-content" id="criar-guia">
          <h2 className="page-title">
            {isEditing ? '✏️ Editar Guia' : '📝 Criar Novo Guia'}
          </h2>

          <div className="criar-guia-intro">
            <p>
              {isEditing 
                ? 'Edite seu guia e compartilhe seu conhecimento atualizado com a comunidade.'
                : 'Compartilhe seu conhecimento criando um guia personalizado para a comunidade.'
              }
            </p>
            <p className="pro-badge">
              ⭐ Recurso exclusivo para assinantes Pro
            </p>
          </div>

          {successMessage && (
            <div className="success-message">
              ✅ {successMessage}
            </div>
          )}

          <form className="guia-form" onSubmit={handleSubmit}>
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
                {categorias.map(cat => (
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
                className="form-input"
                value={formData.imagem}
                onChange={handleChange}
                placeholder="https://exemplo.com/imagem.jpg"
              />
              <span className="help-text">
                Cole o link de uma imagem ilustrativa para seu guia
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
