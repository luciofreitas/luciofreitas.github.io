// Dados do glossário automotivo - Luzes do painel
export const glossarioMockData = [
  // Luzes Vermelhas (Alta Prioridade)
  {
    id: 1,
    nome: 'Motor',
    icone: '🔴',
    cor: 'vermelho',
    prioridade: 'Alta',
    descricao: 'Indica problema crítico no motor. Pare imediatamente e procure assistência técnica.',
    causas: ['Superaquecimento do motor', 'Baixa pressão do óleo', 'Falha no sistema de arrefecimento', 'Problema na bomba d\'água'],
    acoes: ['Pare o veículo em local seguro imediatamente', 'Desligue o motor', 'Não tente continuar dirigindo', 'Chame o guincho ou mecânico']
  },
  {
    id: 2,
    nome: 'Freios',
    icone: '🛑',
    cor: 'vermelho',
    prioridade: 'Alta',
    descricao: 'Sistema de freios com falha crítica. Risco de acidente grave.',
    causas: ['Pastilhas de freio gastas', 'Vazamento no sistema hidráulico', 'Freio de mão acionado', 'Baixo nível do fluido de freio'],
    acoes: ['Pare em local seguro imediatamente', 'Verifique o freio de mão', 'Não dirija o veículo', 'Procure assistência urgente']
  },
  {
    id: 3,
    nome: 'Bateria',
    icone: '🔋',
    cor: 'vermelho',
    prioridade: 'Alta',
    descricao: 'Sistema de carga da bateria com problema. Risco de pane elétrica.',
    causas: ['Alternador com defeito', 'Bateria descarregada ou danificada', 'Correia do alternador rompida', 'Problema no regulador de voltagem'],
    acoes: ['Desligue equipamentos não essenciais', 'Procure oficina rapidamente', 'Evite parar o motor', 'Verifique se há ruídos estranhos']
  },

  // Luzes Amarelas (Média Prioridade)
  {
    id: 4,
    nome: 'Óleo do Motor',
    icone: '🛢️',
    cor: 'amarelo',
    prioridade: 'Média',
    descricao: 'Nível ou pressão do óleo abaixo do recomendado. Pode causar danos ao motor.',
    causas: ['Nível baixo de óleo', 'Vazamento de óleo', 'Bomba de óleo com defeito', 'Filtro de óleo entupido'],
    acoes: ['Verifique o nível de óleo com a vareta', 'Complete o óleo se necessário', 'Procure vazamentos embaixo do carro', 'Agende revisão']
  },
  {
    id: 5,
    nome: 'Injeção Eletrônica',
    icone: '⚡',
    cor: 'amarelo',
    prioridade: 'Média',
    descricao: 'Problema detectado no sistema de injeção eletrônica do combustível.',
    causas: ['Sensor com defeito', 'Bico injetor entupido', 'Problema na centralina', 'Combustível de má qualidade'],
    acoes: ['Verifique se há perda de potência', 'Observe o consumo de combustível', 'Faça diagnóstico eletrônico', 'Use combustível de qualidade']
  },
  {
    id: 6,
    nome: 'ABS',
    icone: '🚗',
    cor: 'amarelo',
    prioridade: 'Média',
    descricao: 'Sistema de freios ABS desativado. Freios funcionam, mas sem assistência.',
    causas: ['Sensor de velocidade com defeito', 'Problema na central ABS', 'Fusível queimado', 'Conexão elétrica solta'],
    acoes: ['Dirija com cuidado redobrado', 'Evite frenagens bruscas', 'Procure oficina especializada', 'Teste os freios em velocidade baixa']
  },

  // Luzes Verdes (Baixa Prioridade)
  {
    id: 7,
    nome: 'Faróis Ligados',
    icone: '💡',
    cor: 'verde',
    prioridade: 'Baixa',
    descricao: 'Indica que os faróis estão ligados e funcionando normalmente.',
    causas: ['Faróis acionados pelo motorista', 'Sensor automático ativado', 'Sistema funcionando corretamente'],
    acoes: ['Nenhuma ação necessária', 'Luz informativa normal', 'Verifique se os faróis estão funcionando']
  },
  {
    id: 8,
    nome: 'Eco Mode',
    icone: '🌱',
    cor: 'verde',
    prioridade: 'Baixa',
    descricao: 'Modo econômico ativado para reduzir consumo de combustível.',
    causas: ['Modo eco selecionado pelo motorista', 'Sistema de economia ativo', 'Dirigindo de forma econômica'],
    acoes: ['Continue dirigindo normalmente', 'Aproveite a economia de combustível', 'Mode pode ser desativado se precisar de mais potência']
  },

  // Luzes Azuis (Informativas)
  {
    id: 9,
    nome: 'Farol Alto',
    icone: '🔵',
    cor: 'azul',
    prioridade: 'Baixa',
    descricao: 'Farol alto ligado. LembreSe de abaixar para não ofuscar outros motoristas.',
    causas: ['Farol alto acionado pelo motorista', 'Alavanca puxada ou travada'],
    acoes: ['Abaixe o farol ao cruzar com outros veículos', 'Verifique se não está incomodando outros motoristas', 'Use apenas quando necessário']
  },
  {
    id: 10,
    nome: 'Temperatura Baixa',
    icone: '❄️',
    cor: 'azul',
    prioridade: 'Baixa',
    descricao: 'Motor ainda frio, em processo de aquecimento.',
    causas: ['Motor recém ligado', 'Temperatura ambiente baixa', 'Sistema de arrefecimento funcionando'],
    acoes: ['Aguarde o motor aquecer', 'Evite acelerações bruscas', 'Dirija suavemente até a temperatura normalizar', 'Luz deve apagar em alguns minutos']
  },

  // Luzes Laranjas (Atenção)
  {
    id: 11,
    nome: 'Combustível Baixo',
    icone: '⛽',
    cor: 'laranja',
    prioridade: 'Média',
    descricao: 'Nível de combustível baixo. Abasteça assim que possível.',
    causas: ['Tanque com pouco combustível', 'Cerca de 50-60km de autonomia restante'],
    acoes: ['Procure um posto de combustível', 'Evite rodar na reserva por muito tempo', 'Planeje o abastecimento', 'Verifique a autonomia no painel']
  },
  {
    id: 12,
    nome: 'Airbag',
    icone: '🎈',
    cor: 'laranja',
    prioridade: 'Alta',
    descricao: 'Sistema de airbag com problema. Pode não funcionar em caso de acidente.',
    causas: ['Sensor de airbag com defeito', 'Problema na centralina', 'Cinto de segurança mal colocado', 'Sistema desativado'],
    acoes: ['Use sempre o cinto de segurança', 'Dirija com cuidado extra', 'Procure oficina especializada urgente', 'Não ignore esta luz']
  }
];

// Dados iniciais das avaliações
export const avaliacoesIniciais = {
  'glossarioAutomotivo': { total: 847, soma: 3892, media: 4.6 },
  'manutencaoPreventiva': { total: 234, soma: 1053, media: 4.5 },
  'pecasOriginais': { total: 156, soma: 702, media: 4.5 }
};

// Lista dos outros guias
export const outrosGuias = [
  {
    id: 'manutencaoPreventiva',
    titulo: 'Manutenção Preventiva',
    subtitulo: 'Cuidados essenciais para seu veículo',
    descricao: 'Guia completo sobre quando e como fazer a manutenção do seu carro.',
    icone: '🔧',
    categoria: 'Manutenção',
    rota: '/manutencao-preventiva'
  },
  {
    id: 'pecasOriginais',
    titulo: 'Peças Originais vs Compatíveis',
    subtitulo: 'Entenda as diferenças e quando usar cada uma',
    descricao: 'Compare vantagens, desvantagens e quando optar por cada tipo de peça.',
    icone: '⚙️',
    categoria: 'Peças',
    rota: '/pecas-originais-vs-compativeis'
  }
];