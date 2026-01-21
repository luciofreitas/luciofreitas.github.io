import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import useFocusTrap from '../hooks/useFocusTrap';
import { apiService } from '../utils/apiService';
import CompatibilityGrid from './CompatibilityGrid';
import { addMaintenance } from '../services/maintenanceService';
import './ProductDrawer.css';

function buildApplicationsList(productDetails) {
  if (!productDetails) return [];

  const normalize = (v) => String(v ?? '').trim();
  const isBlankish = (v) => {
    const s = normalize(v);
    if (!s) return true;
    const low = s.toLowerCase();
    return low === 'n/a' || low === 'na' || low === '-' || low === 'null' || low === 'undefined';
  };

  const buildYears = (start, end, single) => {
    if (Array.isArray(single) && single.length) return single.map(String);
    if (single !== undefined && single !== null && String(single).trim()) return [String(single).trim()];

    const s = Number(start);
    const e = Number(end);
    if (!Number.isFinite(s) || !Number.isFinite(e)) return [];
    const min = Math.min(s, e);
    const max = Math.max(s, e);
    // guardrail to avoid accidental huge ranges
    if (max - min > 60) return [];
    const years = [];
    for (let y = min; y <= max; y += 1) years.push(String(y));
    return years;
  };

  const stripYearsFromLabel = (label) => {
    try {
      let s = String(label ?? '').trim();
      if (!s) return '';
      // Remove any 4-digit year tokens, then clean separators
      s = s.replace(/\b(?:19|20)\d{2}\b/g, ' ');
      s = s.replace(/[()?,]/g, ' ');
      s = s.replace(/[-–—]+/g, ' ');
      s = s.replace(/\s+/g, ' ').trim();
      return s;
    } catch (e) {
      return String(label ?? '').trim();
    }
  };

  const toVehicleYears = (app) => {
    if (!app || typeof app !== 'object') return null;

    // common field shapes
    const vehicle = normalize(app.vehicle || app.veiculo);

    // Some backends store the original application string under notes-like fields
    const notesVehicle = normalize(app.observacoes || app.observacao || app.obs || app.notes || app.note);

    const marca = normalize(app.marca || app.make);
    const modelo = normalize(app.modelo || app.model);

    const vehicleFallback = !isBlankish(marca) || !isBlankish(modelo)
      ? `${isBlankish(marca) ? '' : marca} ${isBlankish(modelo) ? '' : modelo}`.trim()
      : '';

    const finalVehicle = !isBlankish(vehicle)
      ? vehicle
      : (!isBlankish(vehicleFallback) ? vehicleFallback : notesVehicle);
    if (isBlankish(finalVehicle)) return null;

    const cleanedVehicle = stripYearsFromLabel(finalVehicle);

    const years = buildYears(
      app.ano_inicio ?? app.year_start ?? app.start_year ?? app.from,
      app.ano_fim ?? app.year_end ?? app.end_year ?? app.to,
      app.ano ?? app.year ?? app.years
    );

    return { vehicle: cleanedVehicle || finalVehicle, years };
  };

  if (Array.isArray(productDetails.applications) && productDetails.applications.length > 0) {
    const normalized = productDetails.applications
      .map((app) => {
        if (typeof app === 'string') return normalize(app);
        return toVehicleYears(app);
      })
      .filter((app) => {
        if (!app) return false;
        if (typeof app === 'string') return !isBlankish(app);
        return !isBlankish(app.vehicle);
      });

    return normalized;
  }

  // Some sources use Portuguese keys
  if (Array.isArray(productDetails.aplicacoes) && productDetails.aplicacoes.length > 0) {
    const normalized = productDetails.aplicacoes
      .map((app) => {
        if (typeof app === 'string') return normalize(app);
        return toVehicleYears(app);
      })
      .filter((app) => {
        if (!app) return false;
        if (typeof app === 'string') return !isBlankish(app);
        return !isBlankish(app.vehicle);
      });
    return normalized;
  }

  if (Array.isArray(productDetails.aplicacoes_detalhadas) && productDetails.aplicacoes_detalhadas.length > 0) {
    const normalized = productDetails.aplicacoes_detalhadas
      .map((app) => toVehicleYears(app))
      .filter(Boolean)
      .filter((app) => {
        // drop placeholder entries like "N/A N/A"
        const low = normalize(app.vehicle).toLowerCase();
        return !(low === 'n/a' || low === 'na' || low === '-' || low === 'n/a n/a' || low === 'na na');
      });

    // de-dup
    const seen = new Set();
    const unique = [];
    normalized.forEach((app) => {
      const key = `${normalize(app.vehicle).toLowerCase()}|${Array.isArray(app.years) ? app.years.join(',') : ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(app);
      }
    });

    return unique;
  }

  return [];
}

export default function ProductDrawer({
  isOpen,
  onClose,
  productId,
  initialTab = 'compat',
  selectedCarId,
}) {
  const { usuarioLogado } = useContext(AuthContext) || {};
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [productDetails, setProductDetails] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [badImageUrls, setBadImageUrls] = useState(() => new Set());

  const drawerRef = useRef(null);
  useFocusTrap(isOpen, drawerRef);

  useEffect(() => {
    if (isOpen) setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  useEffect(() => {
    let mounted = true;

    async function loadProduct(id) {
      if (!id) return;
      setLoading(true);
      try {
        const product = await apiService.getPecaById(id);
        if (!mounted) return;
        if (product && product.error) {
          setProductDetails(null);
          return;
        }
        setProductDetails(product);
        setSelectedImage(0);
        setBadImageUrls(new Set());
      } catch (e) {
        if (!mounted) return;
        setProductDetails(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (isOpen && productId) loadProduct(productId);
    return () => {
      mounted = false;
    };
  }, [isOpen, productId]);

  const applications = useMemo(() => buildApplicationsList(productDetails), [productDetails]);

  const PLACEHOLDER_SRC = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><rect width='100%25' height='100%25' fill='%23f3f4f6'/><text x='50%25' y='50%25' fill='%239ca3af' font-size='24' font-family='Arial' dominant-baseline='middle' text-anchor='middle'>Imagem%20indispon%C3%ADvel</text></svg>";

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const getPrimaryCode = () => {
    try {
      return productDetails?.part_number || productDetails?.numero_peca ||
        (productDetails?.codigos && Array.isArray(productDetails.codigos.oem) && productDetails.codigos.oem[0]) ||
        (productDetails?.codigos && Array.isArray(productDetails.codigos.equivalentes) && productDetails.codigos.equivalentes[0]) ||
        productDetails?.code || productDetails?.sku || productDetails?.id || '';
    } catch (e) {
      return productDetails?.id || '';
    }
  };

  const handleSaveMaintenance = async () => {
    try {
      if (!usuarioLogado) {
        if (window.showToast) window.showToast('Faça login para registrar manutenção', 'error', 3000);
        return;
      }

      const root = drawerRef.current;
      const selectedApplications = [];
      try {
        const rows = Array.from(root.querySelectorAll('.compatibility-grid-row'));
        rows.forEach((row) => {
          const veiculoEl = row.querySelector('.compatibility-vehicle-text');
          const selectEl = row.querySelector('.compatibility-year-select');
          const veiculoText = veiculoEl ? String(veiculoEl.textContent || '').trim() : '';
          const ano = selectEl ? String(selectEl.value || '').trim() : '';
          if (veiculoText || ano) selectedApplications.push({ veiculo: veiculoText, ano });
        });
      } catch (e) {
        // non-blocking
      }

      const rawUserId = usuarioLogado.id || usuarioLogado.email;
      const userId = rawUserId ? String(rawUserId).trim().toLowerCase() : rawUserId;

      const codigoProduto = getPrimaryCode();

      const toSave = {
        veiculoId: selectedCarId || '',
        data: new Date().toISOString(),
        tipo: 'preventiva',
        descricao: productDetails?.nome || productDetails?.name || '',
        codigoProduto: codigoProduto,
        kmAtual: '',
        oficina: '',
        valor: '',
        observacoes: '',
        meta: {
          savedFrom: 'drawer',
          mappedFields: { id: productDetails?.id },
          selectedApplications,
        },
      };

      try {
        const anosUnicos = Array.from(new Set(selectedApplications.map(sa => sa.ano).filter(Boolean)));
        if (anosUnicos.length === 1) {
          toSave.meta.selectedYearSummary = anosUnicos[0];
          if (toSave.descricao) toSave.descricao = `${toSave.descricao} — Ano: ${anosUnicos[0]}`;
        } else if (anosUnicos.length > 1) {
          toSave.meta.selectedYearSummary = anosUnicos.join(', ');
        }
      } catch (e) {
        // ignore
      }

      const saved = await addMaintenance(userId, toSave);
      if (saved && saved.id) {
        try {
          if (codigoProduto) sessionStorage.setItem('pf_prefill_codigo', String(codigoProduto));
        } catch (e) {
          // ignore
        }

        onClose();
        navigate('/historico-manutencao');
        if (window.showToast) window.showToast('Manutenção registrada no histórico', 'success', 2500);
      } else {
        if (window.showToast) window.showToast('Erro ao registrar manutenção', 'error', 3000);
      }
    } catch (err) {
      console.error('Falha ao registrar manutenção (drawer)', err);
      if (window.showToast) window.showToast('Erro ao registrar manutenção', 'error', 3000);
    }
  };

  if (!isOpen) return null;

  const title = productDetails?.nome || productDetails?.name || (loading ? 'Carregando…' : 'Detalhes');

  const isRenderableImageUrl = (url) => {
    const s = String(url ?? '').trim();
    if (!s) return false;
    if (s.startsWith('data:image/')) return true;
    if (s.startsWith('http://') || s.startsWith('https://')) return true;
    if (s.startsWith('/')) return true;
    return false;
  };

  const markBadImage = (url) => {
    const s = String(url ?? '').trim();
    if (!s) return;
    setBadImageUrls((prev) => {
      if (prev && prev.has(s)) return prev;
      const next = new Set(prev || []);
      next.add(s);
      return next;
    });
  };

  const images = Array.isArray(productDetails?.imagens)
    ? productDetails.imagens
      .filter((img) => typeof img === 'string')
      .map((img) => img.trim())
      .filter(isRenderableImageUrl)
      .filter((img) => !(badImageUrls && badImageUrls.has(img)))
    : [];

  const hasImages = images.length > 0;
  const safeSelectedImage = Math.min(Math.max(selectedImage, 0), Math.max(images.length - 1, 0));
  const mainImage = hasImages ? images[safeSelectedImage] : null;

  const formatCurrencyBRL = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    try {
      return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    } catch (e) {
      return `R$ ${n.toFixed(2)}`;
    }
  };

  return (
    <div className="product-drawer-overlay" onClick={handleOverlayClick}>
      <aside ref={drawerRef} className="product-drawer" role="dialog" aria-modal="true" aria-label={title}>
        <div className="product-drawer-header">
          <div className="product-drawer-title">
            <div className="product-drawer-title-text">{title}</div>
            {productDetails?.category || productDetails?.categoria ? (
              <div className="product-drawer-subtitle">{productDetails?.categoria || productDetails?.category}</div>
            ) : null}
          </div>
          <button type="button" className="product-drawer-close" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <div className="product-drawer-tabs" role="tablist" aria-label="Abas de detalhes">
          <button
            type="button"
            className={activeTab === 'details' ? 'active' : ''}
            onClick={() => setActiveTab('details')}
            role="tab"
            aria-selected={activeTab === 'details'}
          >
            Detalhes
          </button>
          <button
            type="button"
            className={activeTab === 'compat' ? 'active' : ''}
            onClick={() => setActiveTab('compat')}
            role="tab"
            aria-selected={activeTab === 'compat'}
          >
            Compatibilidade
          </button>
        </div>

        <div className="product-drawer-body">
          {loading ? (
            <div className="product-drawer-loading">
              <div className="loading-spinner" />
              <p>Carregando dados da peça…</p>
            </div>
          ) : !productDetails ? (
            <div className="product-drawer-empty">
              <p>Não foi possível carregar os detalhes desta peça.</p>
            </div>
          ) : activeTab === 'details' ? (
            <div className="product-drawer-details">
              {hasImages ? (
                <div className="product-drawer-image-block">
                  <img
                    className="product-drawer-main-image"
                    src={mainImage}
                    alt={title}
                    onError={(e) => {
                      markBadImage(mainImage);
                    }}
                  />

                  {images.length > 1 ? (
                    <div className="product-drawer-thumbs">
                      {images.slice(0, 6).map((img, idx) => (
                        <button
                          key={`${img}-${idx}`}
                          type="button"
                          className={idx === safeSelectedImage ? 'active' : ''}
                          onClick={() => setSelectedImage(idx)}
                          aria-label={`Imagem ${idx + 1}`}
                        >
                          <img
                            src={img}
                            alt=""
                            onError={(e) => {
                              markBadImage(img);
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="product-drawer-noimage">
                  Sem imagem cadastrada para esta peça.
                </div>
              )}

              <div className="product-drawer-meta">
                {productDetails?.categoria || productDetails?.category ? (
                  <div><strong>Categoria:</strong> {productDetails.categoria || productDetails.category}</div>
                ) : null}
                <div><strong>Fabricante:</strong> {productDetails.fabricante || productDetails.manufacturer || '-'}</div>
                {getPrimaryCode() ? <div><strong>Código:</strong> {getPrimaryCode()}</div> : null}
                {productDetails?.codigos && Array.isArray(productDetails.codigos.oem) && productDetails.codigos.oem.length ? (
                  <div><strong>Cód. OEM:</strong> {productDetails.codigos.oem.slice(0, 4).join(', ')}</div>
                ) : null}
                {productDetails?.codigos && Array.isArray(productDetails.codigos.equivalentes) && productDetails.codigos.equivalentes.length ? (
                  <div><strong>Equivalentes:</strong> {productDetails.codigos.equivalentes.slice(0, 4).join(', ')}</div>
                ) : null}

                {formatCurrencyBRL(productDetails?.preco ?? productDetails?.price) ? (
                  <div><strong>Preço:</strong> {formatCurrencyBRL(productDetails?.preco ?? productDetails?.price)}</div>
                ) : null}
                {Number.isFinite(Number(productDetails?.estoque ?? productDetails?.available_quantity)) ? (
                  <div><strong>Estoque:</strong> {Number(productDetails?.estoque ?? productDetails?.available_quantity)}</div>
                ) : null}
                {Number.isFinite(Number(productDetails?.prazo_entrega_dias)) ? (
                  <div><strong>Entrega:</strong> {Number(productDetails.prazo_entrega_dias)} dia(s)</div>
                ) : null}
                {Number.isFinite(Number(productDetails?.garantia_meses)) ? (
                  <div><strong>Garantia:</strong> {Number(productDetails.garantia_meses)} mês(es)</div>
                ) : null}
                {productDetails?.instalacao?.dificuldade ? (
                  <div><strong>Dificuldade:</strong> {productDetails.instalacao.dificuldade}</div>
                ) : null}
                {Number.isFinite(Number(productDetails?.instalacao?.tempo_estimado_min)) ? (
                  <div><strong>Tempo estimado:</strong> {Number(productDetails.instalacao.tempo_estimado_min)} min</div>
                ) : null}
                <div><strong>Compatibilidade:</strong> {applications.length > 0 ? `${applications.length} aplicação(ões)` : 'não disponível'}</div>

                {productDetails?.descricao || productDetails?.description ? (
                  <div className="product-drawer-description">{productDetails.descricao || productDetails.description}</div>
                ) : null}
              </div>

              <div className="product-drawer-hint">
                Dica: vá na aba <strong>Compatibilidade</strong> para ver os carros e registrar a manutenção.
              </div>
            </div>
          ) : (
            <div className="product-drawer-compat">
              {applications.length > 0 ? (
                <CompatibilityGrid applications={applications} usuarioLogado={usuarioLogado} />
              ) : (
                <div className="product-drawer-empty">
                  <p>Compatibilidade não disponível para esta peça.</p>
                </div>
              )}

              {!selectedCarId ? (
                <div className="product-drawer-warning">
                  Selecione um carro no topo para associar a manutenção (opcional).
                </div>
              ) : null}
            </div>
          )}
        </div>

        {activeTab === 'compat' ? (
          <div className="product-drawer-footer">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveMaintenance}
              disabled={!usuarioLogado || applications.length === 0}
              aria-label="Registrar manutenção"
              title={!usuarioLogado ? 'Faça login para registrar manutenção' : (applications.length === 0 ? 'Sem compatibilidade para registrar' : '')}
            >
              Registrar manutenção
            </button>
            {!usuarioLogado ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/login')}
              >
                Fazer login
              </button>
            ) : null}
          </div>
        ) : null}
      </aside>
    </div>
  );
}
