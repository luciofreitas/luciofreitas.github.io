// Dados do glossário automotivo - Luzes do painel
export const glossarioMockData = [
  { id: 1, nome: "Motor", imagem: "/images/luzes-no-painel/1.png", cor: "vermelho", prioridade: "Alta", descricao: "Luz do motor (check engine) indica que o sistema detectou uma falha no motor ou nos sistemas de emissões. Nem sempre é emergência imediata, mas requer diagnóstico o quanto antes.", causas: ["Falha no sistema de ignição", "Sensor com defeito (oxigênio, MAP, etc.)", "Problema no catalisador", "Mistura ar/combustível incorreta"], acoes: ["Verifique comportamento do motor e consumo", "Agende diagnóstico eletrônico em oficina de confiança", "Evite rodar longas distâncias sem avaliação", "Se houver fumaça ou perda de potência, pare em local seguro"] },
  { id: 2, nome: "Freios", imagem: "/images/luzes-no-painel/2.png", cor: "vermelho", prioridade: "Alta", descricao: "Luz de freio pode indicar que o freio de mão está acionado ou que há nível de fluido de freio baixo ou falha no sistema. É um alerta de segurança.", causas: ["Freio de mão acionado", "Nível de fluido de freio baixo", "Vazamento no circuito de freio", "Problema na assistência de frenagem"], acoes: ["Confirme se o freio de mão está solto", "Verifique nível do fluido de freio", "Não siga com freios comprometidos; chame assistência se necessário", "Procure oficina imediatamente em caso de perda de eficiência"] },
  { id: 3, nome: "Bateria", imagem: "/images/luzes-no-painel/3.png", cor: "vermelho", prioridade: "Alta", descricao: "Sinaliza que a bateria não está sendo carregada corretamente pelo alternador ou que há problema no sistema elétrico. Se permanecer acesa, a bateria pode descarregar.", causas: ["Alternador defeituoso", "Correia do alternador rompida", "Bateria com carga insuficiente", "Conexões soltas ou corroídas"], acoes: ["Desligue itens elétricos não essenciais", "Procure oficina para teste de carga", "Evite deslocamentos longos até a falha ser solucionada", "Substitua bateria/alternador conforme diagnóstico"] },
  { id: 4, nome: "Óleo do Motor", imagem: "/images/luzes-no-painel/4.png", cor: "amarelo", prioridade: "Média", descricao: "Indica baixo nível ou pressão do óleo do motor. Ignorar pode levar a danos sérios por falta de lubrificação.", causas: ["Nível de óleo baixo", "Vazamento no motor", "Bomba de óleo com defeito", "Sensor de pressão com problema"], acoes: ["Pare em local seguro e verifique o nível de óleo", "Complete com óleo conforme especificação", "Procure oficina se houver vazamento ou se a luz persistir"] },
  { id: 5, nome: "Injeção Eletrônica", imagem: "/images/luzes-no-painel/5.png", cor: "amarelo", prioridade: "Média", descricao: "A luz de injeção (check engine) acende normalmente ao dar a partida e deve apagar; se permanecer, indica necessidade de verificação do sistema de injeção/combustão.", causas: ["Defeito em sensores (oxigênio, MAP, MAF)", "Problema em bicos injetores", "Falha na central eletrônica", "Combustível contaminado"], acoes: ["Não ignore se a luz não apagar após a partida", "Agende diagnóstico eletrônico", "Evite forçar o motor até resolver"] },
  { id: 6, nome: "ABS", imagem: "/images/luzes-no-painel/6.png", cor: "amarelo", prioridade: "Média", descricao: "Quando acesa, o sistema ABS pode estar inoperante. Os freios continuam funcionando, mas sem a assistência do ABS, aumentando risco em frenagens bruscas.", causas: ["Sensor de roda defeituoso", "Problema na unidade hidráulica ABS", "Fusível queimado ou cabo danificado"], acoes: ["Redobre atenção em pisos escorregadios", "Evite frenagens bruscas em alta velocidade", "Procure oficina para diagnóstico e reparo"] },
  { id: 7, nome: "Faróis Ligados", imagem: "/images/luzes-no-painel/7.png", cor: "verde", prioridade: "Baixa", descricao: "Indicador informativo que mostra que os faróis estão ligados.", causas: ["Faróis acionados manualmente", "Sistema automático ativado"], acoes: ["Nenhuma ação necessária"] },
  { id: 8, nome: "Eco Mode", imagem: "/images/luzes-no-painel/8.png", cor: "verde", prioridade: "Baixa", descricao: "Indica que o modo de condução econômica está ativado.", causas: ["Motorista ativou o modo econômico", "Sistema de condução adaptativa"], acoes: ["Nenhuma ação necessária"] },
  { id: 9, nome: "Farol Alto", imagem: "/images/luzes-no-painel/9.png", cor: "azul", prioridade: "Baixa", descricao: "Indica que o farol alto está acionado. Use com cuidado para não ofuscar outros motoristas.", causas: ["Acionamento do farol alto", "Alavanca presa"], acoes: ["Abaixe ao cruzar com outros veículos", "Use apenas em vias escuras e sem veículos à frente"] },
  { id: 10, nome: "Temperatura do Motor", imagem: "/images/luzes-no-painel/10.png", cor: "vermelho", prioridade: "Alta", descricao: "Indica superaquecimento do motor ou problema no circuito de arrefecimento (temperatura do líquido de arrefecimento). Exige atenção imediata.", causas: ["Baixo nível do líquido de arrefecimento", "Vazamento no sistema de arrefecimento", "Ventoinha de radiador inoperante", "Termostato ou bomba d'água com defeito"], acoes: ["Pare em local seguro e desligue o motor", "Verifique nível do líquido de arrefecimento com o motor frio", "Chame assistência ou leve a oficina imediatamente"] },
  { id: 11, nome: "Combustível Baixo", imagem: "/images/luzes-no-painel/11.png", cor: "laranja", prioridade: "Média", descricao: "Indica que o nível de combustível está baixo e é hora de abastecer em breve.", causas: ["Tanque em reserva", "Métrica de autonomia atingida"], acoes: ["Abasteça o quanto antes", "Evite percorrer longas distâncias na reserva"] },
  { id: 12, nome: "Airbag", imagem: "/images/luzes-no-painel/12.png", cor: "laranja", prioridade: "Alta", descricao: "Indica falha no sistema de airbag ou cintos. Pode comprometer a segurança em colisões.", causas: ["Sensor de impacto com defeito", "Conexões soltas", "Falha na central de segurança"], acoes: ["Verifique cintos e conexões", "Procure assistência técnica especializada", "Não ignore esta indicação"] },
  { id: 13, nome: "Pré-aquecimento das Velas", imagem: "/images/luzes-no-painel/13.png", cor: "amarelo", prioridade: "Média", descricao: "Indicador presente em motores diesel que sinaliza o pré-aquecimento das velas. Se permanecer acesa após a partida, pode indicar necessidade de manutenção.", causas: ["Velas de aquecimento com desgaste", "Problema no circuito de pré-aquecimento"], acoes: ["Aguarde o tempo de pré-aquecimento antes de dar a partida", "Se a luz não apagar, procure uma oficina"] },
  { id: 14, nome: "Controle de Tração", imagem: "/images/luzes-no-painel/14.png", cor: "amarelo", prioridade: "Baixa", descricao: "Indica que o sistema de controle de tração/estabilidade foi ativado (informativo). Se acusar falha, o sistema pode estar desativado.", causas: ["Sistema ativado por perda de aderência", "Sensor ou central com defeito"], acoes: ["Se acionado, reduza velocidade e dirija com cuidado", "Se permanecer acesa, leve para diagnóstico"] },
  { id: 15, nome: "Portas Abertas", imagem: "/images/luzes-no-painel/15.png", cor: "laranja", prioridade: "Baixa", descricao: "Indica que alguma porta, capô ou mala está aberta ou mal fechada.", causas: ["Porta/capô/mala não completamente fechados", "Sensor com mau contato"], acoes: ["Verifique e feche todas as portas e tampas", "Se a luz permanecer, verifique sensores"] },
  { id: 16, nome: "Temperatura do Líquido de Arrefecimento", imagem: "/images/luzes-no-painel/16.png", cor: "vermelho", prioridade: "Alta", descricao: "Sinaliza problemas no circuito de arrefecimento que podem causar superaquecimento do motor. Deve ser tratado com prioridade.", causas: ["Nível baixo do líquido de arrefecimento", "Vazamento", "Ventoinha do radiador inoperante", "Termostato ou bomba com defeito"], acoes: ["Pare o veículo e desligue o motor", "Espere o motor esfriar antes de verificar o reservatório", "Procure socorro mecânico se necessário"] }
];

// Dados iniciais das avaliações (valores aproximados para exibição)
export const avaliacoesIniciais = {
  'glossario-automotivo': { total: 0, soma: 0, media: 0 },
  'manutencaoPreventiva': { total: 0, soma: 0, media: 0 },
  'pecasOriginais': { total: 0, soma: 0, media: 0 }
};

// Lista dos outros guias fixos (serão exibidos na página de Guias)
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
