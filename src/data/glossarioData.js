// Clean fallback data for panel lights (corrected colors)
export const glossarioMockData = [
  { id: 1, nome: "ABS", icone: "/images/luzes-no-painel/abs.png", cor: "amarelo", descricao: "ABS inoperante ou falha no sistema.", causas: ["Sensor de roda com defeito", "Unidade hidráulica com falha"], acoes: ["Dirija com cuidado", "Procure oficina"] },

  { id: 2, nome: "Airbag", icone: "/images/luzes-no-painel/airbag.png", cor: "amarelo", descricao: "Falha no sistema de airbag/cintos.", causas: ["Sensor de impacto com defeito"], acoes: ["Diagnóstico especializado"] },

  { id: 3, nome: "Alerta de Segurança", icone: "/images/luzes-no-painel/alerta-seguranca.png", cor: "amarelo", descricao: "Alerta geral de segurança; verifique outros avisos.", causas: ["Falha em sensores"], acoes: ["Consultar manual", "Procurar assistência"] },

  { id: 4, nome: "Bateria / Alternador", icone: "/images/luzes-no-painel/bateria.png", cor: "vermelho", descricao: "Problema no carregamento ou bateria.", causas: ["Alternador com defeito"], acoes: ["Desligue equipamentos", "Procure assistência"] },

  { id: 5, nome: "Capô Aberto", icone: "/images/luzes-no-painel/capo-aberto.png", cor: "vermelho", descricao: "Capô aberto ou mal fechado.", causas: ["Capô não fechado"], acoes: ["Fechar corretamente"] },

  { id: 6, nome: "Cinto de Segurança", icone: "/images/luzes-no-painel/cinto-de-seguranca.png", cor: "vermelho", descricao: "Aviso de cinto não afivelado ou problema no sistema.", causas: ["Cinto não afivelado"], acoes: ["Afivelar cinto"] },

  { id: 7, nome: "Desembaçador", icone: "/images/luzes-no-painel/desembacador-dianteiro-traseiro.png", cor: "verde", descricao: "Sistema de desembaçamento ativo.", causas: ["Ativado pelo motorista"], acoes: ["Nenhuma ação necessária"] },

  { id: 8, nome: "Direção Elétrica", icone: "/images/luzes-no-painel/direcao-eletrica.png", cor: "amarelo", descricao: "Perda de assistência da direção elétrica.", causas: ["Falha elétrica"], acoes: ["Dirija com cuidado", "Procure oficina"] },

  { id: 9, nome: "EPC", icone: "/images/luzes-no-painel/epc.png", cor: "amarelo", descricao: "Falha no controle eletrônico do motor.", causas: ["Sensor defeituoso"], acoes: ["Diagnóstico OBD-II"] },

  { id: 10, nome: "Falha de Freio", icone: "/images/luzes-no-painel/falha-de-freio.png", cor: "vermelho", descricao: "Problema crítico no sistema de freios.", causas: ["Vazamento no circuito"], acoes: ["PARE com segurança", "Chame assistência"] },

  { id: 11, nome: "Falha de Iluminação", icone: "/images/luzes-no-painel/falha-luzes.png", cor: "amarelo", descricao: "Problema em alguma luz externa do veículo.", causas: ["Lâmpadas queimadas"], acoes: ["Verificar e substituir lâmpadas"] },

  { id: 12, nome: "Farol Alto", icone: "/images/luzes-no-painel/farol-alto.png", cor: "azul", descricao: "Farol alto acionado.", causas: ["Alavanca acionada"], acoes: ["Abaixe ao cruzar com veículos"] },

  { id: 13, nome: "Farol Baixo", icone: "/images/luzes-no-painel/farol-baixo.png", cor: "verde", descricao: "Farol baixo ligado.", causas: ["Farol acionado"], acoes: ["Nenhuma ação necessária"] },

  { id: 14, nome: "Farol de Neblina", icone: "/images/luzes-no-painel/farol-de-neblina.png", cor: "verde", descricao: "Farol de neblina ativo.", causas: ["Ativado pelo motorista"], acoes: ["Usar quando necessário"] },

  { id: 15, nome: "Filtro de Partículas", icone: "/images/luzes-no-painel/filtros-particulas.png", cor: "amarelo", descricao: "Regeneração do DPF necessária.", causas: ["Uso urbano frequente"], acoes: ["Fazer viagem em estrada para regeneração"] },

  { id: 16, nome: "Freio de Mão", icone: "/images/luzes-no-painel/falha-de-freio.png", cor: "vermelho", descricao: "Freio de estacionamento acionado ou problema no sistema.", causas: ["Freio de mão acionado"], acoes: ["Soltar freio de mão", "Verificar nível de fluido"] },

  { id: 17, nome: "Indicador de Direção", icone: "/images/luzes-no-painel/indicador-de-direcao.png", cor: "verde", descricao: "Seta de direção ativa.", causas: ["Acionado pelo motorista"], acoes: ["Desligar após manobra"] },

  { id: 18, nome: "Injeção / Check Engine", icone: "/images/luzes-no-painel/injecao_eletronica.png", cor: "amarelo", descricao: "Falha detectada no sistema de injeção/emissão.", causas: ["Mau funcionamento relacionado ao motor"], acoes: ["Diagnóstico OBD-II"] },

  { id: 19, nome: "Luz de Posição", icone: "/images/luzes-no-painel/lanterna.png", cor: "verde", descricao: "Lanterna / luz de posição ligada.", causas: ["Sistema acionado"], acoes: ["Nenhuma ação necessária"] },

  { id: 20, nome: "Óleo do Motor", icone: "/images/luzes-no-painel/oleo-do-motor.png", cor: "vermelho", descricao: "Pressão ou nível de óleo crítico.", causas: ["Nível de óleo baixo"], acoes: ["PARE e verificar nível de óleo"] },

  { id: 21, nome: "Piloto Automático", icone: "/images/luzes-no-painel/piloto-automatico.png", cor: "verde", descricao: "Cruise control ativo.", causas: ["Ativado pelo motorista"], acoes: ["Desativar se desejar"] },

  { id: 22, nome: "Pisca Alerta", icone: "/images/luzes-no-painel/pisca-alerta.png", cor: "verde", descricao: "Pisca-alerta ativado.", causas: ["Ativado pelo motorista"], acoes: ["Usar em emergência"] },

  { id: 23, nome: "Porta Aberta", icone: "/images/luzes-no-painel/porta-aberta.png", cor: "vermelho", descricao: "Porta aberta ou mal fechada.", causas: ["Porta não fechada"], acoes: ["Fechar a porta"] },

  { id: 24, nome: "Porta-malas Aberto", icone: "/images/luzes-no-painel/porta-malas-aberto.png", cor: "vermelho", descricao: "Porta-malas aberto.", causas: ["Travamento não encaixado"], acoes: ["Fechar compartimento"] },

  { id: 25, nome: "Pré-aquecimento das Velas", icone: "/images/luzes-no-painel/pre-aquecimento-das-velas.png", cor: "amarelo", descricao: "Pré-aquecimento em motores diesel.", causas: ["Temperatura baixa"], acoes: ["Aguardar apagar antes de ligar"] },

  { id: 26, nome: "Pressão dos Pneus", icone: "/images/luzes-no-painel/pressao-dos-pneus.png", cor: "amarelo", descricao: "Pressão baixa em um ou mais pneus.", causas: ["Pneu com pressão baixa"], acoes: ["Verificar e calibrar pneus"] },

  { id: 27, nome: "Reserva de Combustível", icone: "/images/luzes-no-painel/reserva-de-combustivel.png", cor: "amarelo", descricao: "Nível de combustível baixo.", causas: ["Combustível na reserva"], acoes: ["Abastecer o quanto antes"] },

  { id: 28, nome: "Sistema de Tração", icone: "/images/luzes-no-painel/sistema-de-tracao-estabilidade.png", cor: "amarelo", descricao: "Tração/estabilidade ativada ou falha.", causas: ["Sensor de roda defeituoso"], acoes: ["Reduza velocidade", "Procurar diagnóstico"] },

  { id: 29, nome: "Start-Stop", icone: "/images/luzes-no-painel/start-stop.png", cor: "verde", descricao: "Sistema Start-Stop pronto/ativo.", causas: ["Condições de parada"], acoes: ["Nenhuma ação necessária"] },

  { id: 30, nome: "Temperatura do Motor", icone: "/images/luzes-no-painel/temperatura-do-motor.png", cor: "vermelho", descricao: "Superaquecimento do motor.", causas: ["Baixo nível de líquido de arrefecimento", "Falha no eletroventilador"], acoes: ["PARE e desligue o motor"] }
];

// Mapping from color token -> hex. This is the single source of truth for theme colors used
// by the glossário UI. Components will generate CSS rules from this mapping at runtime.
export const glossarioColors = {
  vermelho: '#b91c1c',
  laranja: '#ff7a00',
  amarelo: '#ffd400',
  verde: '#16a34a',
  azul: '#2563eb'
};

export const avaliacoesIniciais = {
  'glossario-automotivo': { total: 0, soma: 0, media: 0 }
};

export const outrosGuias = [
  {
    id: 'manutencaoPreventiva',
    titulo: 'Manutenção Preventiva',
    subtitulo: 'Dicas e cronogramas para manter seu veículo em dia',
    descricao: 'Rotinas de manutenção que ajudam a prolongar a vida útil do seu veículo.',
    icone: '🛠️',
    categoria: 'Diagnóstico',
    rota: '/manutencao-preventiva'
  },
  {
    id: 'pecasOriginais',
    titulo: 'Peças Originais vs Compatíveis',
    subtitulo: 'Como escolher peças com segurança',
    descricao: 'Comparativo entre peças originais e compatíveis para ajudar sua decisão.',
    icone: '🔩',
    categoria: 'Diagnóstico',
    rota: '/pecas-originais-vs-compativeis'
  }
];
