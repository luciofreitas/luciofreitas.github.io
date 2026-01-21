// Clean fallback data for panel lights (corrected colors)
export const glossarioMockData = [
  { id: 1, nome: "ABS", icone: "/images/luzes-no-painel/abs.svg", cor: "amarelo", descricao: "ABS inoperante ou falha no sistema.", causas: ["Sensor de roda com defeito", "Unidade hidráulica com falha"], acoes: ["Dirija com cuidado", "Procure oficina"] },

  { id: 2, nome: "Airbag", icone: "/images/luzes-no-painel/airbag.svg", cor: "laranja", descricao: "Falha no sistema de airbag/cintos.", causas: ["Sensor de impacto com defeito"], acoes: ["Diagnóstico especializado"] },

  { id: 3, nome: "Alerta de Segurança", icone: "/images/luzes-no-painel/alerta-seguranca.svg", cor: "amarelo", descricao: "Alerta geral de segurança; verifique outros avisos.", causas: ["Falha em sensores"], acoes: ["Consultar manual", "Procurar assistência"] },

  { id: 4, nome: "Bateria / Alternador", icone: "/images/luzes-no-painel/bateria.svg", cor: "vermelho", descricao: "Problema no carregamento ou bateria.", causas: ["Alternador com defeito"], acoes: ["Desligue equipamentos", "Procure assistência"] },

  { id: 5, nome: "Capô Aberto", icone: "/images/luzes-no-painel/capo-aberto.svg", cor: "vermelho", descricao: "Capô aberto ou mal fechado.", causas: ["Capô não fechado"], acoes: ["Fechar corretamente"] },

  { id: 6, nome: "Cinto de Segurança", icone: "/images/luzes-no-painel/cinto-de-seguranca.svg", cor: "vermelho", descricao: "Aviso de cinto não afivelado ou problema no sistema.", causas: ["Cinto não afivelado"], acoes: ["Afivelar cinto"] },

  { id: 7, nome: "Desembaçador", icone: "/images/luzes-no-painel/desembacador-dianteiro-traseiro.svg", cor: "verde", descricao: "Sistema de desembaçamento ativo.", causas: ["Ativado pelo motorista"], acoes: ["Nenhuma ação necessária"] },

  { id: 8, nome: "Direção Elétrica", icone: "/images/luzes-no-painel/direcao-eletrica.svg", cor: "amarelo", descricao: "Perda de assistência da direção elétrica.", causas: ["Falha elétrica"], acoes: ["Dirija com cuidado", "Procure oficina"] },

  { id: 9, nome: "EPC", icone: "/images/luzes-no-painel/epc.svg", cor: "amarelo", descricao: "Falha no controle eletrônico do motor.", causas: ["Sensor defeituoso"], acoes: ["Diagnóstico OBD-II"] },

  { id: 10, nome: "Falha de Freio", icone: "/images/luzes-no-painel/falha-de-freio.svg", cor: "vermelho", descricao: "Problema crítico no sistema de freios.", causas: ["Vazamento no circuito"], acoes: ["PARE com segurança", "Chame assistência"] },

  { id: 11, nome: "Falha de Iluminação", icone: "/images/luzes-no-painel/falha-luzes.svg", cor: "amarelo", descricao: "Problema em alguma luz externa do veículo.", causas: ["Lâmpadas queimadas"], acoes: ["Verificar e substituir lâmpadas"] },

  { id: 12, nome: "Farol Alto", icone: "/images/luzes-no-painel/farol-alto.svg", cor: "azul", descricao: "Farol alto acionado.", causas: ["Alavanca acionada"], acoes: ["Abaixe ao cruzar com veículos"] },

  { id: 13, nome: "Farol Baixo", icone: "/images/luzes-no-painel/farol-baixo.svg", cor: "verde", descricao: "Farol baixo ligado.", causas: ["Alavanca de farol acionada", "Sensor de luminosidade (se automático)"], acoes: ["Nenhuma ação necessária", "Desligar quando não necessário"] },

  { id: 14, nome: "Farol de Neblina", icone: "/images/luzes-no-painel/farol-de-neblina.svg", cor: "verde", descricao: "Farol de neblina ativo.", causas: ["Ativado pelo motorista"], acoes: ["Usar quando necessário"] },

  { id: 15, nome: "Filtro de Partículas", icone: "/images/luzes-no-painel/filtros-particulas.svg", cor: "amarelo", descricao: "Regeneração do DPF necessária.", causas: ["Uso urbano frequente"], acoes: ["Fazer viagem em estrada para regeneração"] },

  { id: 16, nome: "Freio de Mão", icone: "/images/luzes-no-painel/falha-de-freio.svg", cor: "vermelho", descricao: "Freio de estacionamento acionado ou problema no sistema.", causas: ["Freio de mão acionado"], acoes: ["Soltar freio de mão", "Verificar nível de fluido"] },

  { id: 17, nome: "Indicador de Direção", icone: "/images/luzes-no-painel/indicador-de-direcao.svg", cor: "verde", descricao: "Seta de direção ativa.", causas: ["Acionado pelo motorista"], acoes: ["Desligar após manobra"] },

  { id: 18, nome: "Injeção / Check Engine", icone: "/images/luzes-no-painel/injecao-eletronica.svg", cor: "amarelo", descricao: "Falha detectada no sistema de injeção/emissão.", causas: ["Mau funcionamento relacionado ao motor"], acoes: ["Diagnóstico OBD-II"] },

  { id: 19, nome: "Luz de Posição", icone: "/images/luzes-no-painel/lanterna.svg", cor: "verde", descricao: "Lanterna / luz de posição ligada.", causas: ["Alavanca de luz acionada", "Luzes automáticas ativadas"], acoes: ["Nenhuma ação necessária", "Manter ligado em condições de baixa visibilidade"] },

  { id: 20, nome: "Óleo do Motor", icone: "/images/luzes-no-painel/oleo-do-motor.svg", cor: "vermelho", descricao: "Pressão ou nível de óleo crítico.", causas: ["Nível de óleo baixo"], acoes: ["PARE e verificar nível de óleo"] },

  { id: 21, nome: "Piloto Automático", icone: "/images/luzes-no-painel/piloto-automatico.svg", cor: "verde", descricao: "Cruise control ativo.", causas: ["Ativado pelo motorista"], acoes: ["Desativar se desejar"] },

  { id: 22, nome: "Pisca Alerta", icone: "/images/luzes-no-painel/pisca-alerta.svg", cor: "vermelho", descricao: "Pisca-alerta ativado.", causas: ["Ativado pelo motorista"], acoes: ["Usar em emergência"] },

  { id: 23, nome: "Porta Aberta", icone: "/images/luzes-no-painel/porta-aberta.svg", cor: "vermelho", descricao: "Porta aberta ou mal fechada.", causas: ["Porta não fechada"], acoes: ["Fechar a porta"] },

  { id: 24, nome: "Porta-malas Aberto", icone: "/images/luzes-no-painel/porta-malas-aberto.svg", cor: "vermelho", descricao: "Porta-malas aberto.", causas: ["Travamento não encaixado"], acoes: ["Fechar compartimento"] },

  { id: 25, nome: "Pré-aquecimento das Velas", icone: "/images/luzes-no-painel/pre-aquecimento-das-velas.svg", cor: "amarelo", descricao: "Pré-aquecimento em motores diesel.", causas: ["Temperatura baixa"], acoes: ["Aguardar apagar antes de ligar"] },
  
  { id: 26, nome: "Pressão dos Pneus", icone: "/images/luzes-no-painel/pressao-dos-pneus.svg", cor: "amarelo", descricao: "Pressão baixa em um ou mais pneus.", causas: ["Pneu com pressão baixa"], acoes: ["Verificar e calibrar pneus"] },

  { id: 27, nome: "Reserva de Combustível", icone: "/images/luzes-no-painel/reserva-de-combustivel.svg", cor: "amarelo", descricao: "Nível de combustível baixo.", causas: ["Combustível na reserva"], acoes: ["Abastecer o quanto antes"] },

  { id: 28, nome: "Sistema de Tração", icone: "/images/luzes-no-painel/sistema-de-tracao-estabilidade.svg", cor: "amarelo", descricao: "Tração/estabilidade ativada ou falha.", causas: ["Sensor de roda defeituoso"], acoes: ["Reduza velocidade", "Procurar diagnóstico"] },
  
  { id: 29, nome: "Start-Stop", icone: "/images/luzes-no-painel/start-stop.svg", cor: "verde", descricao: "Sistema Start-Stop pronto/ativo.", causas: ["Condições de parada"], acoes: ["Nenhuma ação necessária"],
    estados: [
      {
        key: 'ativo',
        nome: 'Ativo',
        cor: 'verde',
        titulo: 'Ativo',
        descricao: 'O sistema está funcionando corretamente e o motor será desligado automaticamente quando o carro parar.',
        acoes: ['Nenhuma ação necessária'],
        causas: ['Sistema funcionando normalmente']
      },
      {
        key: 'restrito',
        nome: 'Desativado/Restrito',
        cor: 'laranja',
        titulo: 'Desativado/Restrito',
        descricao: 'Indica que o sistema está desativado ou com restrições.',
        acoes: ['Verificar bateria', 'Verificar climatização', 'Consultar manual'],
        causas: ['Bateria fraca', 'Ar-condicionado ligado', 'Subida/condições de condução', 'Botão Start-Stop desativado']
      }
    ]
  },

  { id: 30, nome: "Temperatura do Motor", icone: "/images/luzes-no-painel/temperatura-do-motor.svg", cor: "vermelho", descricao: "Superaquecimento do motor.", causas: ["Baixo nível de líquido de arrefecimento", "Falha no eletroventilador"], acoes: ["PARE e desligue o motor"] }
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
  },
  {
    id: 'freiosSemMisterio',
    titulo: 'Freios sem Mistério',
    subtitulo: 'Sinais, riscos e como decidir o que checar',
    descricao: 'Entenda chiados, vibração, pedal e quando é risco — com checklist e peças relacionadas.',
    icone: '🛑',
    categoria: 'Diagnóstico',
    rota: '/guias/freios-sem-misterio'
  },
  {
    id: 'superaquecimento',
    titulo: 'Carro Esquentando (Superaquecimento)',
    subtitulo: 'O que fazer na hora e como achar a causa',
    descricao: 'Passo a passo seguro, checklist com motor frio e mapa de causas comuns do arrefecimento.',
    icone: '🌡️',
    categoria: 'Diagnóstico',
    rota: '/guias/superaquecimento'
  },
  {
    id: 'bateriaAlternadorPartida',
    titulo: 'Bateria, Alternador e Partida',
    subtitulo: 'Quando é bateria, quando é carga e quando é fuga',
    descricao: 'Diagnóstico prático com testes simples, sem “chute”, e o que pedir na oficina.',
    icone: '🔋',
    categoria: 'Diagnóstico',
    rota: '/guias/bateria-alternador-partida'
  }
];
