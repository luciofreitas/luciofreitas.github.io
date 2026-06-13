export const CATEGORIAS_PRODUTO = ['Brownies', 'Bolos', 'Tortas', 'Bebidas', 'Kits Presente', 'Outros']

export const FORMAS_PAGAMENTO = ['Dinheiro', 'Cartão de Débito', 'Cartão de Crédito', 'PIX', 'Vale']

export const produtosIniciais = [
  { id: 1, nome: 'Brownie Tradicional', categoria: 'Brownies', preco: 8.00, custo: 2.80, ativo: true, descricao: 'Brownie clássico de chocolate meio amargo' },
  { id: 2, nome: 'Brownie com Nozes', categoria: 'Brownies', preco: 10.00, custo: 3.50, ativo: true, descricao: 'Brownie com nozes crocantes' },
  { id: 3, nome: 'Brownie Nutella', categoria: 'Brownies', preco: 12.00, custo: 4.20, ativo: true, descricao: 'Brownie recheado com Nutella' },
  { id: 4, nome: 'Brownie Red Velvet', categoria: 'Brownies', preco: 11.00, custo: 3.90, ativo: true, descricao: 'Brownie vermelho com cream cheese' },
  { id: 5, nome: 'Brownie Oreo', categoria: 'Brownies', preco: 11.00, custo: 4.00, ativo: true, descricao: 'Brownie com pedaços de Oreo' },
  { id: 6, nome: 'Brownie de Caramelo', categoria: 'Brownies', preco: 10.50, custo: 3.60, ativo: true, descricao: 'Brownie com calda de caramelo' },
  { id: 7, nome: 'Caixa 4 Brownies', categoria: 'Kits Presente', preco: 38.00, custo: 14.00, ativo: true, descricao: 'Caixa com 4 brownies à escolha' },
  { id: 8, nome: 'Caixa 6 Brownies', categoria: 'Kits Presente', preco: 55.00, custo: 20.00, ativo: true, descricao: 'Caixa com 6 brownies à escolha' },
  { id: 9, nome: 'Caixa 9 Brownies', categoria: 'Kits Presente', preco: 78.00, custo: 28.00, ativo: true, descricao: 'Caixa com 9 brownies à escolha' },
  { id: 10, nome: 'Bolo de Chocolate', categoria: 'Bolos', preco: 65.00, custo: 22.00, ativo: true, descricao: 'Bolo de chocolate com ganache (500g)' },
  { id: 11, nome: 'Bolo Red Velvet', categoria: 'Bolos', preco: 75.00, custo: 26.00, ativo: true, descricao: 'Bolo red velvet com cobertura de cream cheese' },
  { id: 12, nome: 'Torta de Morango', categoria: 'Tortas', preco: 80.00, custo: 28.00, ativo: true, descricao: 'Torta com creme e morangos frescos' },
  { id: 13, nome: 'Torta de Limão', categoria: 'Tortas', preco: 72.00, custo: 24.00, ativo: true, descricao: 'Torta de limão siciliano com merengue' },
  { id: 14, nome: 'Café Expresso', categoria: 'Bebidas', preco: 6.00, custo: 1.50, ativo: true, descricao: 'Café expresso tradicional' },
  { id: 15, nome: 'Cappuccino', categoria: 'Bebidas', preco: 9.00, custo: 2.80, ativo: true, descricao: 'Cappuccino cremoso' },
  { id: 16, nome: 'Chocolate Quente', categoria: 'Bebidas', preco: 10.00, custo: 3.20, ativo: true, descricao: 'Chocolate quente cremoso' },
  { id: 17, nome: 'Suco Natural', categoria: 'Bebidas', preco: 8.00, custo: 2.50, ativo: true, descricao: 'Suco de laranja ou limão' },
  { id: 18, nome: 'Kit Dia dos Namorados', categoria: 'Kits Presente', preco: 120.00, custo: 42.00, ativo: true, descricao: 'Caixa especial com 9 brownies + cartão' },
]

export const estoquesIniciais = [
  { id: 1, nome: 'Chocolate meio amargo 70%', unidade: 'kg', quantidade: 15.5, minimo: 5, custo_unitario: 32.00 },
  { id: 2, nome: 'Manteiga sem sal', unidade: 'kg', quantidade: 8.0, minimo: 3, custo_unitario: 18.00 },
  { id: 3, nome: 'Açúcar refinado', unidade: 'kg', quantidade: 20.0, minimo: 5, custo_unitario: 4.50 },
  { id: 4, nome: 'Ovos', unidade: 'unid', quantidade: 120, minimo: 30, custo_unitario: 0.70 },
  { id: 5, nome: 'Farinha de trigo', unidade: 'kg', quantidade: 12.0, minimo: 4, custo_unitario: 3.80 },
  { id: 6, nome: 'Nozes', unidade: 'kg', quantidade: 2.5, minimo: 1, custo_unitario: 65.00 },
  { id: 7, nome: 'Nutella', unidade: 'kg', quantidade: 4.0, minimo: 2, custo_unitario: 38.00 },
  { id: 8, nome: 'Cream cheese', unidade: 'kg', quantidade: 3.5, minimo: 1.5, custo_unitario: 28.00 },
  { id: 9, nome: 'Morango fresco', unidade: 'kg', quantidade: 1.2, minimo: 1, custo_unitario: 12.00 },
  { id: 10, nome: 'Limão siciliano', unidade: 'kg', quantidade: 2.0, minimo: 1, custo_unitario: 8.50 },
  { id: 11, nome: 'Caixas individuais', unidade: 'unid', quantidade: 200, minimo: 50, custo_unitario: 0.90 },
  { id: 12, nome: 'Caixas para presente (4u)', unidade: 'unid', quantidade: 80, minimo: 20, custo_unitario: 3.50 },
  { id: 13, nome: 'Caixas para presente (6u)', unidade: 'unid', quantidade: 60, minimo: 20, custo_unitario: 4.80 },
  { id: 14, nome: 'Caixas para presente (9u)', unidade: 'unid', quantidade: 40, minimo: 15, custo_unitario: 6.20 },
  { id: 15, nome: 'Fita de presente', unidade: 'rolo', quantidade: 8, minimo: 3, custo_unitario: 5.00 },
  { id: 16, nome: 'Café em grão', unidade: 'kg', quantidade: 3.0, minimo: 1, custo_unitario: 45.00 },
  { id: 17, nome: 'Leite integral', unidade: 'L', quantidade: 10.0, minimo: 4, custo_unitario: 5.20 },
]

export const clientesIniciais = [
  { id: 1, nome: 'Ana Paula Ferreira', telefone: '(21) 98765-4321', email: 'anapaula@email.com', bairro: 'Alcântara', dataCadastro: '2024-01-15', totalCompras: 3, valorTotal: 246.00 },
  { id: 2, nome: 'Marcos Oliveira', telefone: '(21) 97654-3210', email: 'marcos.oli@email.com', bairro: 'Neves', dataCadastro: '2024-02-03', totalCompras: 5, valorTotal: 387.50 },
  { id: 3, nome: 'Juliana Santos', telefone: '(21) 96543-2109', email: 'juju.santos@email.com', bairro: 'Zé Garoto', dataCadastro: '2024-02-20', totalCompras: 2, valorTotal: 158.00 },
  { id: 4, nome: 'Roberto Lima', telefone: '(21) 95432-1098', email: 'robertolima@email.com', bairro: 'Tribobó', dataCadastro: '2024-03-05', totalCompras: 8, valorTotal: 624.00 },
  { id: 5, nome: 'Fernanda Costa', telefone: '(21) 94321-0987', email: 'fer.costa@email.com', bairro: 'Mutondo', dataCadastro: '2024-03-18', totalCompras: 3, valorTotal: 315.00 },
  { id: 6, nome: 'Diego Alves', telefone: '(21) 93210-9876', email: 'diegoalves@email.com', bairro: 'Coelho', dataCadastro: '2024-04-02', totalCompras: 6, valorTotal: 498.00 },
  { id: 7, nome: 'Camila Rocha', telefone: '(21) 92109-8765', email: 'camirocha@email.com', bairro: 'Alcântara', dataCadastro: '2024-04-14', totalCompras: 1, valorTotal: 78.00 },
  { id: 8, nome: 'Thiago Mendes', telefone: '(21) 91098-7654', email: 'thiago.m@email.com', bairro: 'Centro', dataCadastro: '2024-05-06', totalCompras: 4, valorTotal: 332.00 },
  { id: 9, nome: 'Patricia Souza', telefone: '(21) 90987-6543', email: 'paty.souza@email.com', bairro: 'Laranjal', dataCadastro: '2024-05-22', totalCompras: 7, valorTotal: 541.00 },
  { id: 10, nome: 'Lucas Cardoso', telefone: '(21) 99876-5432', email: 'lucas.card@email.com', bairro: 'Boaçu', dataCadastro: '2024-06-10', totalCompras: 2, valorTotal: 194.00 },
  { id: 11, nome: 'Beatriz Nunes', telefone: '(21) 98765-1234', email: 'beah.nunes@email.com', bairro: 'Arsenal', dataCadastro: '2024-06-28', totalCompras: 9, valorTotal: 712.00 },
  { id: 12, nome: 'Rafael Torres', telefone: '(21) 97654-2345', email: 'rafa.torres@email.com', bairro: 'Vista Alegre', dataCadastro: '2024-07-15', totalCompras: 3, valorTotal: 278.00 },
]

function gerarVendas() {
  const vendas = []
  let id = 1
  const agora = new Date()

  for (let i = 89; i >= 0; i--) {
    const data = new Date(agora)
    data.setDate(data.getDate() - i)
    const numVendas = Math.floor(Math.random() * 8) + 3

    for (let j = 0; j < numVendas; j++) {
      const clienteId = Math.random() > 0.3 ? Math.floor(Math.random() * 12) + 1 : null
      const numItens = Math.floor(Math.random() * 4) + 1
      const itens = []
      let total = 0

      for (let k = 0; k < numItens; k++) {
        const prod = produtosIniciais[Math.floor(Math.random() * 18)]
        const qty = Math.floor(Math.random() * 3) + 1
        itens.push({ produtoId: prod.id, nome: prod.nome, quantidade: qty, preco: prod.preco })
        total += prod.preco * qty
      }

      const hora = `${String(9 + Math.floor(Math.random() * 10)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`
      vendas.push({
        id: id++,
        data: data.toISOString().split('T')[0],
        hora,
        clienteId,
        itens,
        total: Number(total.toFixed(2)),
        formaPagamento: FORMAS_PAGAMENTO[Math.floor(Math.random() * FORMAS_PAGAMENTO.length)],
        status: 'concluida',
      })
    }
  }
  return vendas
}

function gerarPedidos() {
  const status = ['pendente', 'em_producao', 'pronto', 'entregue', 'cancelado']
  const pedidos = []
  const agora = new Date()

  for (let i = 1; i <= 25; i++) {
    const diasOffset = Math.floor(Math.random() * 30) - 10
    const dataEntrega = new Date(agora)
    dataEntrega.setDate(dataEntrega.getDate() + diasOffset)
    const dataPedido = new Date(dataEntrega)
    dataPedido.setDate(dataPedido.getDate() - Math.floor(Math.random() * 5) - 2)

    const clienteId = Math.floor(Math.random() * 12) + 1
    const cliente = clientesIniciais[clienteId - 1]
    const prod = produtosIniciais[Math.floor(Math.random() * 18)]
    const qty = Math.floor(Math.random() * 5) + 1
    const statusIdx = diasOffset < -5 ? 3 : diasOffset < 0 ? Math.floor(Math.random() * 3) : Math.floor(Math.random() * 2)

    pedidos.push({
      id: i,
      clienteId,
      clienteNome: cliente.nome,
      clienteTelefone: cliente.telefone,
      dataPedido: dataPedido.toISOString().split('T')[0],
      dataEntrega: dataEntrega.toISOString().split('T')[0],
      itens: [{ produtoId: prod.id, nome: prod.nome, quantidade: qty, preco: prod.preco }],
      total: Number((prod.preco * qty).toFixed(2)),
      status: status[statusIdx],
      observacoes: Math.random() > 0.6 ? 'Sem nozes. Embrulho para presente.' : '',
      sinal: Number((prod.preco * qty * 0.5).toFixed(2)),
    })
  }
  return pedidos
}

function gerarLancamentosFinanceiros() {
  const lancamentos = []
  const categoriasDespesa = ['Insumos', 'Aluguel', 'Energia', 'Salários', 'Embalagens', 'Marketing', 'Manutenção']
  const agora = new Date()
  let id = 1

  for (let i = 89; i >= 0; i--) {
    const data = new Date(agora)
    data.setDate(data.getDate() - i)
    const dataStr = data.toISOString().split('T')[0]

    if (i % 30 === 0) {
      lancamentos.push({ id: id++, tipo: 'despesa', descricao: 'Aluguel', categoria: 'Aluguel', valor: 2800.00, data: dataStr })
      lancamentos.push({ id: id++, tipo: 'despesa', descricao: 'Salário funcionária', categoria: 'Salários', valor: 1800.00, data: dataStr })
    }
    if (i % 7 === 0) {
      lancamentos.push({ id: id++, tipo: 'despesa', descricao: 'Compra de insumos', categoria: 'Insumos', valor: Number((Math.random() * 300 + 150).toFixed(2)), data: dataStr })
    }
    if (i % 15 === 0) {
      lancamentos.push({ id: id++, tipo: 'despesa', descricao: 'Conta de energia', categoria: 'Energia', valor: Number((Math.random() * 100 + 180).toFixed(2)), data: dataStr })
    }
  }
  return lancamentos
}

export const vendasIniciais = gerarVendas()
export const pedidosIniciais = gerarPedidos()
export const lancamentosIniciais = gerarLancamentosFinanceiros()
