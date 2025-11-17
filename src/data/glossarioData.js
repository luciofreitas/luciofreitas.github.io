// Dados do glossário automotivo - Luzes do painel
export const glossarioMockData = [
  // Luzes Vermelhas (Alta Prioridade)
  {
    id: 1,
    nome: 'Motor',
    icone: '🔴',
    imagem: '/images/luzes no painel/1.png',
    cor: 'vermelho',
    prioridade: 'Alta',
    descricao: 'Luz do motor (check engine) indica que o sistema detectou uma falha que precisa de verificação. Nem sempre é emergência, mas não deve ser ignorada.',
    causas: ['Falha no sistema de ignição', 'Sensor com defeito (oxigênio, MAP, etc.)', 'Problema no catalisador', 'Mistura ar/combustível errada'],
    acoes: ['Reduza a velocidade e dirija com cautela', 'Evite acelerações fortes', 'Procure diagnóstico eletrônico em oficina', 'Se houver fumaça ou perda de potência, pare em local seguro']
  },
  {
    id: 2,
    nome: 'Freios',
    icone: '🛑',
    imagem: '/images/luzes no painel/2.png',
    cor: 'vermelho',
    prioridade: 'Alta',
    descricao: 'Indica falha no sistema de freios ou nível de fluido crítico. Exige parada imediata e verificação.',
    causas: ['Nível baixo de fluido de freio', 'Vazamento no circuito hidráulico', 'Pastilhas muito gastas', 'Problema na assistência de frenagem'],
    acoes: ['Pare o veículo em local seguro', 'Evite dirigir se os freios estiverem comprometidos', 'Verifique o nível de fluido', 'Chame assistência mecânica']
  },
  {
    id: 3,
    nome: 'Bateria',
    icone: '🔋',
    imagem: '/images/luzes no painel/3.png',
    cor: 'vermelho',
    prioridade: 'Alta',
    descricao: 'Indica problema no sistema de carga (alternador/bateria). Pode levar à perda de energia elétrica do veículo.',
    causas: ['Alternador com defeito', 'Correia do alternador rompida', 'Bateria em fim de vida', 'Conexões soltas ou corroídas'],
    acoes: ['Desligue acessórios não essenciais', 'Dirija até oficina mais próxima com cuidado', 'Evite longos deslocamentos até resolver', 'Faça teste da bateria/alternador']
  },

  // Luzes Amarelas (Média Prioridade)
  {
    id: 4,
    nome: 'Óleo do Motor',
    icone: '🛢️',
    imagem: '/images/luzes no painel/4.png',
    cor: 'amarelo',
    prioridade: 'Média',
    descricao: 'Indica baixo nível ou pressão de óleo. Se ignorada, pode causar desgaste grave no motor.',
    causas: ['Nível de óleo baixo', 'Vazamento no motor ou junta', 'Bomba de óleo defeituosa', 'Problema no sensor de pressão'],
    acoes: ['Pare em local seguro e verifique o nível de óleo', 'Complete o óleo conforme especificação', 'Procure oficina em caso de vazamento', 'Não ignore por longos períodos']
  },
  {
    id: 5,
    nome: 'Injeção Eletrônica',
    icone: '⚡',
    imagem: '/images/luzes no painel/5.png',
    cor: 'amarelo',
    prioridade: 'Média',
    descricao: 'Indicação de falha no sistema de injeção/combustão. Pode afetar desempenho e consumo.',
    causas: ['Sensor de fluxo/oxigênio com defeito', 'Bico injetor com problema', 'Falha na central eletrônica', 'Combustível contaminado'],
    acoes: ['Evite acelerar bruscamente', 'Agende diagnóstico eletrônico', 'Verifique consumo e comportamento do motor']
  },
  {
    id: 6,
    nome: 'ABS',
    icone: '🚗',
    imagem: '/images/luzes no painel/6.png',
    cor: 'amarelo',
    prioridade: 'Média',
    descricao: 'Luz do ABS indica que o sistema de freio antibloqueio está inativo. Os freios normais funcionam, porém sem assistência do ABS.',
    causas: ['Sensor de roda com defeito', 'Problema na unidade hidráulica ABS', 'Fusível ou cabo com problema'],
    acoes: ['Dirija com mais cuidado em piso escorregadio', 'Evite frenagens bruscas em alta velocidade', 'Leve para diagnóstico especializado']
  },

  // Luzes Verdes (Baixa Prioridade)
  {
    id: 7,
    nome: 'Faróis Ligados',
    icone: '💡',
    imagem: '/images/luzes no painel/7.png',
    cor: 'verde',
    prioridade: 'Baixa',
    descricao: 'Indicador informativo que mostra que os faróis estão ligados.',
    causas: ['Faróis acionados manualmente', 'Sistema automático ativado'],
    acoes: ['Nenhuma ação necessária'],
  },
  {
    id: 8,
    nome: 'Eco Mode',
    icone: '🌱',
    imagem: '/images/luzes no painel/8.png',
    cor: 'verde',
    prioridade: 'Baixa',
    descricao: 'Indica que o modo de condução econômica está ativado.',
    causas: ['Motorista ativou o modo econômico', 'Sistema de condução adaptativa'],
    acoes: ['Nenhuma ação necessária']
  },

  // Luzes Azuis (Informativas)
  {
    id: 9,
    nome: 'Farol Alto',
    icone: '🔵',
    imagem: '/images/luzes no painel/9.png',
    cor: 'azul',
    prioridade: 'Baixa',
    descricao: 'Indica que o farol alto está acionado. Use com cuidado para não ofuscar outros motoristas.',
    causas: ['Acionamento do farol alto', 'Alavanca presa'],
    acoes: ['Abaixe ao cruzar com outros veículos', 'Use apenas em vias escuras e sem veículos à frente']
  },
  {
    id: 10,
    nome: 'Temperatura Baixa',
    icone: '❄️',
    imagem: '/images/luzes no painel/10.png',
    cor: 'azul',
    prioridade: 'Baixa',
    descricao: 'Indicador informativo que o motor está frio ou em aquecimento.',
    causas: ['Motor recém ligado', 'Baixa temperatura ambiente'],
    acoes: ['Aguarde o motor aquecer', 'Evite altas rotações até a temperatura normalizar']
  },

  // Luzes Laranjas (Atenção)
  {
    id: 11,
    nome: 'Combustível Baixo',
    icone: '⛽',
    imagem: '/images/luzes no painel/11.png',
    cor: 'laranja',
    prioridade: 'Média',
    descricao: 'Indica que o nível de combustível está baixo e é hora de abastecer em breve.',
    causas: ['Tanque em reserva', 'Métrica de autonomia atingida'],
    acoes: ['Abasteça o quanto antes', 'Evite percorrer longas distâncias na reserva']
  },
  {
    id: 12,
    nome: 'Airbag',
    icone: '🎈',
    imagem: '/images/luzes no painel/12.png',
    cor: 'laranja',
    prioridade: 'Alta',
    descricao: 'Indica falha no sistema de airbag ou cintos. Pode comprometer a segurança em colisões.',
    causas: ['Sensor de impacto com defeito', 'Conexões soltas', 'Falha na central de segurança'],
    acoes: ['Verifique cintos e conexões', 'Procure assistência técnica especializada', 'Não ignore esta indicação']
  }
];

// Dados iniciais das avaliações
export const avaliacoesIniciais = {
  'glossario-automotivo': { total: 847, soma: 3892, media: 4.6 },
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