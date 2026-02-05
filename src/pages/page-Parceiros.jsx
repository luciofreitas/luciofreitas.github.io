import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Menu } from '../components';
import '../styles/pages/page-Parceiros.css';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { AuthContext } from '../App';

// Fix Leaflet default marker icons in bundlers (Vite)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

try {
  // eslint-disable-next-line no-underscore-dangle
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
  });
} catch (e) {
  // ignore
}

export default function Parceiros() {
  const { usuarioLogado } = useContext(AuthContext) || {};

  const apiBase = useMemo(() => {
    try {
      return window.__API_BASE ? String(window.__API_BASE) : '';
    } catch (e) {
      return '';
    }
  }, []);

  const apiUrl = (path) => {
    const base = String(apiBase || '').trim().replace(/\/+$/, '');
    const cleanPath = String(path || '').trim();
    if (!base) return cleanPath;
    if (/\/api$/i.test(base) && cleanPath.startsWith('/api/')) return `${base}${cleanPath.slice(4)}`;
    return `${base}${cleanPath}`;
  };

  const goQueroSerParceiro = () => {
    const target = '/contato-logado';
    const isLogged = !!usuarioLogado;

    if (!isLogged) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('__post_login_redirect', target);
        }
      } catch (e) {
        // ignore
      }
      window.location.hash = '#/login';
      return;
    }

    window.location.hash = `#${target}`;
  };

  const [partnersLoading, setPartnersLoading] = useState(false);
  const [partnersError, setPartnersError] = useState('');
  const [partners, setPartners] = useState([]);

  const [rankingLoading, setRankingLoading] = useState(false);
  const [rankingError, setRankingError] = useState('');
  const [rankingDays, setRankingDays] = useState(30);
  const [ranking, setRanking] = useState([]);

  const [geoError, setGeoError] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [userPos, setUserPos] = useState(null); // { lat, lng, accuracyM, updatedAt }

  const [selectedPartnerId, setSelectedPartnerId] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersLayerRef = useRef(null);
  const markerByIdRef = useRef(new Map());
  const geoTooltipTimerRef = useRef(null);

  function digitsOnly(value) {
    return String(value || '').replace(/\D+/g, '');
  }

  function textOrDash(value) {
    const s = String(value ?? '').trim();
    return s ? s : '—';
  }

  function formatAccuracyMeters(value) {
    const m = Number(value);
    if (!Number.isFinite(m) || m <= 0) return '';
    return `${Math.round(m)} m`;
  }

  function normalizeUrl(url) {
    const raw = String(url || '').trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    return `https://${raw}`;
  }

  function instagramUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    const handle = raw.replace(/^@/, '').replace(/^https?:\/\/www\./i, '').replace(/^https?:\/\//i, '').replace(/^instagram\.com\//i, '');
    return `https://instagram.com/${handle}`;
  }

  function whatsappUrl(value) {
    const d = digitsOnly(value);
    if (!d) return '';
    // If user typed without country code, assume Brazil (+55)
    const full = d.length >= 12 ? d : `55${d}`;
    return `https://wa.me/${full}`;
  }

  function companyLabel(c) {
    try {
      return String(c?.trade_name || c?.legal_name || c?.company_code || '').trim();
    } catch (e) {
      return '';
    }
  }

  function companyTypeLabel(value) {
    const map = {
      concessionaria: 'Concessionária',
      oficina: 'Oficina',
      autopecas: 'Autopeças',
      centro_automotivo: 'Centro automotivo',
    };
    const key = String(value || '').toLowerCase();
    return map[key] || (value ? String(value) : '—');
  }

  function buildAddressLine(c) {
    const street = String(c?.address_street || '').trim();
    const number = String(c?.address_number || '').trim();
    const neighborhood = String(c?.neighborhood || '').trim();
    const city = String(c?.city || '').trim();
    const state = String(c?.state || '').trim();
    const parts = [];
    const line1 = [street, number].filter(Boolean).join(', ');
    if (line1) parts.push(line1);
    if (neighborhood) parts.push(neighborhood);
    const line2 = [city, state].filter(Boolean).join(' - ');
    if (line2) parts.push(line2);
    return parts.join(' • ');
  }

  function haversineKm(lat1, lng1, lat2, lng2) {
    const toRad = (v) => (Number(v) * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function mapsUrlForCompany(c) {
    const label = companyLabel(c);
    const address = buildAddressLine(c);
    const lat = c?.lat;
    const lng = c?.lng;
    const hasCoords = lat != null && lng != null && String(lat) !== '' && String(lng) !== '';

    if (hasCoords && userPos?.lat != null && userPos?.lng != null) {
      return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(`${userPos.lat},${userPos.lng}`)}&destination=${encodeURIComponent(`${lat},${lng}`)}`;
    }
    if (hasCoords) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
    }
    const q = [label, address].filter(Boolean).join(' - ');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q || label || '')}`;
  }

  async function loadPartners() {
    setPartnersLoading(true);
    setPartnersError('');
    try {
      const resp = await fetch(apiUrl(`/api/companies?status=active&view=partners`), { headers: { Accept: 'application/json' } });
      const body = await resp.json().catch(() => ({}));
      if (!resp.ok || !body || body.error) {
        const msg = body && body.error ? String(body.error) : `HTTP ${resp.status}`;
        throw new Error(msg);
      }
      const list = Array.isArray(body.companies) ? body.companies : [];
      setPartners(list);
    } catch (e) {
      setPartners([]);
      setPartnersError(e && e.message ? String(e.message) : 'Não foi possível carregar parceiros.');
    } finally {
      setPartnersLoading(false);
    }
  }

  async function loadRanking() {
    setRankingLoading(true);
    setRankingError('');
    try {
      const days = 30;
      const limit = 10;
      const url = apiUrl(`/api/partners/ranking?days=${days}&limit=${limit}`);
      const resp = await fetch(url, { headers: { Accept: 'application/json' } });
      const body = await resp.json().catch(() => ({}));
      if (!resp.ok || !body || body.error) {
        if (resp.status === 404) {
          throw new Error('Endpoint de ranking não encontrado (404). O backend pode estar desatualizado; faça redeploy para incluir /api/partners/ranking.');
        }
        const msg = body && body.error ? String(body.error) : `HTTP ${resp.status}`;
        throw new Error(msg);
      }
      setRankingDays(Number(body.days) || days);
      setRanking(Array.isArray(body.ranking) ? body.ranking : []);
    } catch (e) {
      setRanking([]);
      setRankingError(e && e.message ? String(e.message) : 'Não foi possível carregar o ranking.');
    } finally {
      setRankingLoading(false);
    }
  }

  useEffect(() => {
    loadPartners();
    loadRanking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase]);

  function requestGeolocation(opts = {}) {
    const { highAccuracy = false } = opts || {};
    setGeoError('');
    if (!navigator?.geolocation?.getCurrentPosition) {
      setGeoError('Geolocalização não suportada neste navegador.');
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos?.coords?.latitude;
        const lng = pos?.coords?.longitude;
        const accuracyM = pos?.coords?.accuracy;
        if (lat == null || lng == null) {
          setGeoError('Não foi possível obter sua localização.');
          setGeoLoading(false);
          return;
        }
        setUserPos({ lat, lng, accuracyM: (accuracyM != null ? Number(accuracyM) : null), updatedAt: Date.now() });
        setGeoLoading(false);
      },
      (err) => {
        const msg = err && err.message ? String(err.message) : 'Permissão negada ou erro ao obter localização.';
        setGeoError(msg);
        setGeoLoading(false);
      },
      {
        enableHighAccuracy: !!highAccuracy,
        timeout: highAccuracy ? 15000 : 8000,
        maximumAge: highAccuracy ? 0 : 10 * 60 * 1000
      }
    );
  }

  // Ask for geolocation automatically on page load (browser permission popup)
  useEffect(() => {
    requestGeolocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lock scroll & allow ESC close when details modal is open
  useEffect(() => {
    if (!detailsOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e) => {
      if (e && e.key === 'Escape') setDetailsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [detailsOpen]);

  const partnersView = useMemo(() => {
    const list = Array.isArray(partners) ? partners : [];
    const uLat = userPos?.lat;
    const uLng = userPos?.lng;
    const canSortByDistance = uLat != null && uLng != null;

    const withDistance = list.map((c) => {
      const lat = c?.lat;
      const lng = c?.lng;
      const hasCoords = canSortByDistance && lat != null && lng != null && String(lat) !== '' && String(lng) !== '';
      const distKm = hasCoords ? haversineKm(Number(uLat), Number(uLng), Number(lat), Number(lng)) : null;
      return { ...c, __distKm: (distKm != null && Number.isFinite(distKm)) ? distKm : null };
    });

    withDistance.sort((a, b) => {
      const ad = a.__distKm;
      const bd = b.__distKm;
      if (ad != null && bd != null) return ad - bd;
      if (ad != null) return -1;
      if (bd != null) return 1;
      return companyLabel(a).localeCompare(companyLabel(b), 'pt-BR', { sensitivity: 'base' });
    });
    return withDistance;
  }, [partners, userPos]);

  const selectedPartner = useMemo(() => {
    const id = String(selectedPartnerId || '').trim();
    if (!id) return null;
    const list = Array.isArray(partnersView) ? partnersView : [];
    return list.find((c) => String(c?.id || companyLabel(c) || '') === id) || null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPartnerId, partnersView]);

  const partnersById = useMemo(() => {
    const map = new Map();
    (partnersView || []).forEach((c) => {
      const id = c?.id;
      if (id == null || String(id).trim() === '') return;
      map.set(String(id), c);
    });
    return map;
  }, [partnersView]);

  // Initialize Leaflet map once
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    mapRef.current = map;
    markersLayerRef.current = markersLayer;

    // Default view (Brazil-ish) until we have user or partners
    map.setView([-14.235, -51.9253], 4);

    return () => {
      try { map.remove(); } catch (e) {}
      mapRef.current = null;
      markersLayerRef.current = null;
      markerByIdRef.current = new Map();
    };
  }, []);

  // Update markers when partners or user position changes
  useEffect(() => {
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    if (geoTooltipTimerRef.current) {
      clearTimeout(geoTooltipTimerRef.current);
      geoTooltipTimerRef.current = null;
    }

    markersLayer.clearLayers();
    markerByIdRef.current = new Map();

    const boundsPoints = [];

    // User marker
    if (userPos?.lat != null && userPos?.lng != null) {
      const acc = Number(userPos?.accuracyM);
      if (Number.isFinite(acc) && acc > 0) {
        L.circle([Number(userPos.lat), Number(userPos.lng)], {
          radius: acc,
          color: '#38bdf8',
          weight: 1,
          opacity: 0.9,
          fillColor: '#38bdf8',
          fillOpacity: 0.12,
          dashArray: '4 4',
        }).addTo(markersLayer);
      }
      const userMarker = L.circleMarker([Number(userPos.lat), Number(userPos.lng)], {
        radius: 7,
        color: '#0ea5e9',
        fillColor: '#0ea5e9',
        fillOpacity: 0.8,
        weight: 2,
      }).addTo(markersLayer);
      userMarker.bindPopup('Você está aqui');

      if (Number.isFinite(acc) && acc > 0) {
        const label = `± ${formatAccuracyMeters(acc)}`;
        userMarker.bindTooltip(label, { direction: 'top', offset: [0, -10], opacity: 0.95, sticky: false });
        userMarker.on('mouseover', () => {
          if (geoTooltipTimerRef.current) clearTimeout(geoTooltipTimerRef.current);
          geoTooltipTimerRef.current = setTimeout(() => {
            geoTooltipTimerRef.current = null;
            try { userMarker.openTooltip(); } catch (e) {}
          }, 700);
        });
        userMarker.on('mouseout', () => {
          if (geoTooltipTimerRef.current) {
            clearTimeout(geoTooltipTimerRef.current);
            geoTooltipTimerRef.current = null;
          }
          try { userMarker.closeTooltip(); } catch (e) {}
        });
      }
      boundsPoints.push([Number(userPos.lat), Number(userPos.lng)]);
    }

    // Partner markers
    (partnersView || []).forEach((c) => {
      const lat = c?.lat;
      const lng = c?.lng;
      const hasCoords = lat != null && lng != null && String(lat) !== '' && String(lng) !== '';
      if (!hasCoords) return;
      const id = String(c?.id || companyLabel(c) || `${lat},${lng}`);
      const name = companyLabel(c) || 'Parceiro';
      const address = buildAddressLine(c);
      const dist = c.__distKm != null ? `${c.__distKm.toFixed(1)} km` : '';

      const marker = L.marker([Number(lat), Number(lng)]).addTo(markersLayer);
      marker.bindPopup(
        `<div style="min-width:180px"><strong>${String(name).replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</strong><br/>${[address, dist].filter(Boolean).join(' • ')}</div>`
      );
      markerByIdRef.current.set(id, marker);
      boundsPoints.push([Number(lat), Number(lng)]);
    });

    // Fit bounds when we have points
    if (boundsPoints.length) {
      try {
        map.fitBounds(boundsPoints, { padding: [24, 24], maxZoom: 14 });
      } catch (e) {
        // ignore
      }
    }

    return () => {
      if (geoTooltipTimerRef.current) {
        clearTimeout(geoTooltipTimerRef.current);
        geoTooltipTimerRef.current = null;
      }
    };
  }, [partnersView, userPos]);

  // When selecting partner in list, center map and open popup
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!selectedPartnerId) return;
    const marker = markerByIdRef.current.get(String(selectedPartnerId));
    if (!marker) return;
    try {
      map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 14), { duration: 0.6 });
      marker.openPopup();
    } catch (e) {
      // ignore
    }
  }, [selectedPartnerId]);

  return (
    <>
      <Menu />
      <div className="page-wrapper menu-page parceiros-page">
        <div className="page-content parceiros-section" id="parceiros">
          <div className="parceiros-container">
            <h2 className="page-title">Parceiros</h2>

          <div className="parceiros-intro">
            <p>
              Aqui você encontra autopeças, oficinas e centros automotivos parceiros. Com sua permissão, usamos sua localização para mostrar os mais próximos.
            </p>
            {!apiBase && (
              <p style={{ marginTop: 12 }}>
                O backend não está configurado neste ambiente, então a lista de parceiros não pode ser carregada agora.
              </p>
            )}
          </div>

          {geoError && (
            <div className="parceiros-intro" style={{ borderColor: '#fecaca', background: '#fff1f2' }}>
              <p style={{ color: '#991b1b' }}>
                {geoError} {' '}
                <button type="button" className="parceiros-inline-link" onClick={requestGeolocation}>
                  Tentar novamente
                </button>
              </p>
            </div>
          )}

          {partnersError && (
            <div className="parceiros-intro" style={{ borderColor: '#fecaca', background: '#fff1f2' }}>
              <p style={{ color: '#991b1b' }}>{partnersError}</p>
            </div>
          )}

          <div className="parceiros-layout">
            <div className="parceiros-list">
              <div className="parceiros-list-header">
                <h3 className="parceiros-list-title">Empresas</h3>
                {partnersLoading && <span className="parceiros-list-sub">Carregando…</span>}
                {!partnersLoading && userPos && (
                  <span className="parceiros-list-sub">
                    Ordenado por distância
                  </span>
                )}
                {!partnersLoading && !userPos && <span className="parceiros-list-sub">Ative a localização para ordenar por distância</span>}
              </div>

              {partnersView.length === 0 && !partnersLoading ? (
                <div className="parceiros-empty">
                  Nenhum parceiro disponível no momento.
                </div>
              ) : (
                <ul className="parceiros-list-items">
                  {partnersView.map((c) => {
                    const name = companyLabel(c) || '—';
                    const address = buildAddressLine(c);
                    const dist = c.__distKm != null ? `${c.__distKm.toFixed(1)} km` : '';
                    const id = String(c?.id || name);
                    const active = String(selectedPartnerId || '') === id;
                    return (
                      <li key={id} className={active ? 'parceiros-list-item active' : 'parceiros-list-item'}>
                        <button
                          type="button"
                          className="parceiros-list-item-btn"
                          onClick={() => {
                            setSelectedPartnerId(id);
                            setDetailsOpen(true);
                          }}
                        >
                          <div className="parceiros-list-item-top">
                            <span className="parceiros-list-item-name">{name}</span>
                            <span className="parceiros-list-item-dist">{dist}</span>
                          </div>
                          <div className="parceiros-list-item-meta">
                            <span>{companyTypeLabel(c.company_type)}</span>
                            {address ? <span> • {address}</span> : null}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="parceiros-map-col">
              <div className="parceiros-map-card" aria-label="Mapa de parceiros">
                <button
                  type="button"
                  className={geoLoading ? 'parceiros-map-refresh-btn is-loading' : 'parceiros-map-refresh-btn'}
                  aria-label="Atualizar localização"
                  title="Atualizar sua localização"
                  disabled={geoLoading}
                  onClick={() => requestGeolocation({ highAccuracy: true })}
                >
                  ⟳
                </button>
                <div ref={mapContainerRef} className="parceiros-map" />
              </div>

              <div className="parceiros-map-actions">
                <button className="parceiros-cta-btn parceiros-cta-btn--subtle" type="button" onClick={goQueroSerParceiro}>
                  Quero ser parceiro
                </button>
              </div>
            </div>
          </div>

          <div className="parceiros-ranking">
            <div className="parceiros-ranking-card" aria-label="Ranking de empresas mais citadas">
              <div className="parceiros-ranking-header">
                <h3 className="parceiros-ranking-title">Ranking dos locais onde mais foram registradas manutenções</h3>
                {rankingLoading ? (
                  <span className="parceiros-ranking-sub">Carregando…</span>
                ) : (
                  <span className="parceiros-ranking-sub">Últimos {rankingDays} dias</span>
                )}
              </div>

              {rankingError && (
                <div className="parceiros-ranking-error" role="alert">
                  {rankingError}
                </div>
              )}

              {ranking.length === 0 && !rankingLoading && !rankingError ? (
                <div className="parceiros-ranking-empty">Sem dados suficientes para montar o ranking ainda.</div>
              ) : (
                <ol className="parceiros-ranking-items">
                  {ranking.map((row, idx) => {
                    const id = String(row?.id || '').trim();
                    const name = companyLabel(row) || '—';
                    const uses = Number(row?.uses) || 0;
                    const hasDetails = id && partnersById.has(id);
                    return (
                      <li key={id || `${name}-${idx}`} className="parceiros-ranking-item">
                        <button
                          type="button"
                          className="parceiros-ranking-item-btn"
                          disabled={!hasDetails}
                          title={hasDetails ? 'Ver detalhes do parceiro' : 'Empresa não está na lista de parceiros ativos'}
                          onClick={() => {
                            if (!hasDetails) return;
                            setSelectedPartnerId(id);
                            setDetailsOpen(true);
                          }}
                        >
                          <span className="parceiros-ranking-pos">{idx + 1}º</span>
                          <span className="parceiros-ranking-name">
                            {name}
                            <span className="parceiros-ranking-meta">{companyTypeLabel(row?.company_type)}</span>
                          </span>
                          <span className="parceiros-ranking-uses">{uses} citações</span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </div>

          {detailsOpen && (
            <div
              className="modal-overlay"
              onClick={(e) => {
                if (e && e.target && e.target.classList && e.target.classList.contains('modal-overlay')) {
                  setDetailsOpen(false);
                }
              }}
            >
              <div className="modal-content">
                <div className="parceiros-modal" role="dialog" aria-modal="true" aria-label="Detalhes do parceiro">
                  <div className="parceiros-modal-header">
                    <div className="parceiros-modal-title">
                      {companyLabel(selectedPartner) || 'Parceiro'}
                    </div>
                    <button className="parceiros-modal-close" aria-label="Fechar" onClick={() => setDetailsOpen(false)}>
                      ✕
                    </button>
                  </div>

                  <div className="parceiros-modal-body">
                    {selectedPartner ? (
                      <>
                        <div className="parceiros-modal-sub">
                          <div className="parceiros-modal-badges">
                            <span className="parceiros-badge">{companyTypeLabel(selectedPartner.company_type)}</span>
                            {selectedPartner.__distKm != null && (
                              <span className="parceiros-badge accent">{selectedPartner.__distKm.toFixed(1)} km</span>
                            )}
                          </div>
                        </div>

                        <div className="parceiros-form-grid" aria-label="Dados do parceiro">
                          <div className="parceiros-form-item">
                            <label className="parceiros-form-label">CEP</label>
                            <input
                              className="parceiros-form-input"
                              readOnly
                              value={String(selectedPartner.cep || '').trim()}
                              placeholder="—"
                            />
                          </div>

                          <div className="parceiros-form-item">
                            <label className="parceiros-form-label">Telefone</label>
                            <input
                              className="parceiros-form-input"
                              readOnly
                              value={String(selectedPartner.phone || '').trim()}
                              placeholder="—"
                            />
                          </div>

                          <div className="parceiros-form-item span-2">
                            <label className="parceiros-form-label">Endereço</label>
                            <input
                              className="parceiros-form-input"
                              readOnly
                              value={String(buildAddressLine(selectedPartner) || '').trim()}
                              placeholder="—"
                            />
                          </div>

                          <div className="parceiros-form-item">
                            <label className="parceiros-form-label">WhatsApp</label>
                            <input
                              className="parceiros-form-input"
                              readOnly
                              value={String(selectedPartner.whatsapp || '').trim()}
                              placeholder="—"
                            />
                          </div>

                          <div className="parceiros-form-item">
                            <label className="parceiros-form-label">Site</label>
                            <input
                              className="parceiros-form-input"
                              readOnly
                              value={String(selectedPartner.website || '').trim()}
                              placeholder="—"
                            />
                          </div>

                          <div className="parceiros-form-item">
                            <label className="parceiros-form-label">Instagram</label>
                            <input
                              className="parceiros-form-input"
                              readOnly
                              value={String(selectedPartner.instagram || '').trim()}
                              placeholder="—"
                            />
                          </div>

                          <div className="parceiros-form-item span-2">
                            <label className="parceiros-form-label">Observações</label>
                            <textarea
                              className="parceiros-form-input textarea"
                              readOnly
                              value={String(selectedPartner.public_notes || '').trim()}
                              placeholder="—"
                            />
                          </div>
                        </div>

                        <div className="parceiros-modal-actions">
                          <a className="parceiros-modal-action secondary" href={mapsUrlForCompany(selectedPartner)} target="_blank" rel="noreferrer">
                            Abrir no mapa
                          </a>
                          {String(selectedPartner.whatsapp || '').trim() && (
                            <a className="parceiros-modal-action" href={whatsappUrl(selectedPartner.whatsapp)} target="_blank" rel="noreferrer">
                              WhatsApp
                            </a>
                          )}
                          {String(selectedPartner.phone || '').trim() && (
                            <a className="parceiros-modal-action" href={`tel:${digitsOnly(selectedPartner.phone)}`}>
                              Ligar
                            </a>
                          )}
                          {String(selectedPartner.website || '').trim() && (
                            <a className="parceiros-modal-action" href={normalizeUrl(selectedPartner.website)} target="_blank" rel="noreferrer">
                              Site
                            </a>
                          )}
                          {String(selectedPartner.instagram || '').trim() && (
                            <a className="parceiros-modal-action" href={instagramUrl(selectedPartner.instagram)} target="_blank" rel="noreferrer">
                              Instagram
                            </a>
                          )}
                        </div>

                        {(selectedPartner.lat == null || selectedPartner.lng == null || String(selectedPartner.lat) === '' || String(selectedPartner.lng) === '') && (
                          <div className="parceiros-modal-alert" role="note">
                            Este parceiro ainda não tem coordenadas cadastradas (não aparece no mapa).
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="parceiros-modal-hint">Selecione um parceiro na lista.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </>
  );
}
