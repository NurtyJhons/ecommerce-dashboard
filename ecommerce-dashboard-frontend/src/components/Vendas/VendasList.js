import React, { useState, useEffect } from 'react';
import { vendasAPI, produtosAPI, categoriasAPI } from '../../services/api';
import './VendasList.css';

const VendasList = () => {
  // Estados principais
  const [vendas, setVendas] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para filtros
  const [filtros, setFiltros] = useState({
    produto: '',
    categoria: '',
    dataInicio: '',
    dataFim: '',
    busca: ''
  });
  
  // Estados para paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalItens, setTotalItens] = useState(0);
  const itensPorPagina = 15;
  
  // Estados para modal de venda
  const [modalAberto, setModalAberto] = useState(false);
  const [vendaEditando, setVendaEditando] = useState(null);
  const [salvandoVenda, setSalvandoVenda] = useState(false);
  
  // Estados para formulário
  const [formData, setFormData] = useState({
    produto: '',
    quantidade: '',
    preco_unitario: '',
    observacoes: ''
  });

  // Estados para totais da página
  const [totais, setTotais] = useState({
    valorTotal: 0,
    quantidadeTotal: 0,
    ticketMedio: 0
  });

  // Carregar dados quando componente monta
  useEffect(() => {
    carregarDados();
    carregarProdutos();
    carregarCategorias();
  }, []);

  // Recarregar vendas quando filtros ou página mudam
  useEffect(() => {
    carregarDados();
  }, [filtros, paginaAtual]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Construir parâmetros da query
      const params = new URLSearchParams();
      
      if (filtros.produto) params.append('produto', filtros.produto);
      if (filtros.categoria) params.append('categoria', filtros.categoria);
      if (filtros.dataInicio) params.append('data_inicio', filtros.dataInicio);
      if (filtros.dataFim) params.append('data_fim', filtros.dataFim);
      
      params.append('page', paginaAtual);
      params.append('page_size', itensPorPagina);
      
      const response = await vendasAPI.listar(`?${params.toString()}`);
      
      const vendasData = response.data.results || response.data;
      setVendas(vendasData);
      setTotalItens(response.data.count || response.data.length);
      setTotalPaginas(Math.ceil((response.data.count || response.data.length) / itensPorPagina));
      
      // Calcular totais da página atual
      calcularTotais(vendasData);
      
    } catch (err) {
      setError('Erro ao carregar vendas');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const carregarProdutos = async () => {
    try {
      const response = await produtosAPI.listar('?ativo=true');
      setProdutos(response.data.results || response.data);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
    }
  };

  const carregarCategorias = async () => {
    try {
      const response = await categoriasAPI.listar('?ativo=true');
      setCategorias(response.data.results || response.data);
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
    }
  };

  const calcularTotais = (vendasData) => {
    const valorTotal = vendasData.reduce((acc, venda) => acc + parseFloat(venda.valor_total || 0), 0);
    const quantidadeTotal = vendasData.reduce((acc, venda) => acc + (venda.quantidade || 0), 0);
    const ticketMedio = vendasData.length > 0 ? valorTotal / vendasData.length : 0;

    setTotais({
      valorTotal,
      quantidadeTotal,
      ticketMedio
    });
  };

  // Handlers de filtros
  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
    setPaginaAtual(1); // Reset para primeira página
  };

  const limparFiltros = () => {
    setFiltros({
      produto: '',
      categoria: '',
      dataInicio: '',
      dataFim: '',
      busca: ''
    });
    setPaginaAtual(1);
  };

  // Modal handlers
  const abrirModal = (venda = null) => {
    if (venda) {
      setVendaEditando(venda);
      setFormData({
        produto: venda.produto,
        quantidade: venda.quantidade,
        preco_unitario: venda.preco_unitario,
        observacoes: venda.observacoes || ''
      });
    } else {
      setVendaEditando(null);
      setFormData({
        produto: '',
        quantidade: '',
        preco_unitario: '',
        observacoes: ''
      });
    }
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setVendaEditando(null);
    setFormData({
      produto: '',
      quantidade: '',
      preco_unitario: '',
      observacoes: ''
    });
  };

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-completar preço quando produto é selecionado
    if (name === 'produto' && value) {
      const produtoSelecionado = produtos.find(p => p.id === parseInt(value));
      if (produtoSelecionado && !formData.preco_unitario) {
        setFormData(prev => ({
          ...prev,
          preco_unitario: produtoSelecionado.preco
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSalvandoVenda(true);
      
      // Validações básicas
      if (!formData.produto) {
        alert('Produto é obrigatório');
        return;
      }
      
      if (!formData.quantidade || parseInt(formData.quantidade) <= 0) {
        alert('Quantidade deve ser maior que zero');
        return;
      }

      const produtoSelecionado = produtos.find(p => p.id === parseInt(formData.produto));
      if (produtoSelecionado && produtoSelecionado.estoque < parseInt(formData.quantidade)) {
        alert(`Estoque insuficiente. Disponível: ${produtoSelecionado.estoque} unidades`);
        return;
      }

      const dadosParaEnviar = {
        produto: parseInt(formData.produto),
        quantidade: parseInt(formData.quantidade),
        preco_unitario: formData.preco_unitario ? parseFloat(formData.preco_unitario) : undefined,
        observacoes: formData.observacoes
      };

      if (vendaEditando) {
        await vendasAPI.atualizar(vendaEditando.id, dadosParaEnviar);
      } else {
        await vendasAPI.criar(dadosParaEnviar);
      }

      fecharModal();
      carregarDados();
      carregarProdutos(); // Atualizar estoque dos produtos
      
    } catch (err) {
      console.error('Erro ao salvar venda:', err);
      if (err.response?.data?.error) {
        alert(err.response.data.error);
      } else {
        alert('Erro ao salvar venda. Tente novamente.');
      }
    } finally {
      setSalvandoVenda(false);
    }
  };

  const handleDelete = async (venda) => {
    if (window.confirm(`Tem certeza que deseja excluir esta venda?`)) {
      try {
        await vendasAPI.deletar(venda.id);
        carregarDados();
        carregarProdutos(); // Atualizar estoque dos produtos
      } catch (err) {
        console.error('Erro ao excluir venda:', err);
        alert('Erro ao excluir venda');
      }
    }
  };

  // Utilitários
  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  const formatarData = (dataString) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const obterDataHoje = () => {
    return new Date().toISOString().split('T')[0];
  };

  const gerarPaginas = () => {
    const paginas = [];
    const inicio = Math.max(1, paginaAtual - 2);
    const fim = Math.min(totalPaginas, paginaAtual + 2);

    for (let i = inicio; i <= fim; i++) {
      paginas.push(i);
    }
    return paginas;
  };

  if (loading && vendas.length === 0) {
    return (
      <div className="vendas-loading">
        <div className="spinner"></div>
        <p>Carregando vendas...</p>
      </div>
    );
  }

  return (
    <div className="vendas-container">
      {/* Header */}
      <div className="vendas-header">
        <div className="header-left">
          <h1>💰 Vendas</h1>
          <span className="total-itens">{totalItens} vendas encontradas</span>
        </div>
        <button 
          className="btn-nova-venda"
          onClick={() => abrirModal()}
        >
          ➕ Nova Venda
        </button>
      </div>

      {/* Resumo Financeiro */}
      <div className="vendas-resumo">
        <div className="resumo-card">
          <div className="resumo-icon">💰</div>
          <div className="resumo-content">
            <h3>Valor Total</h3>
            <p className="resumo-valor">{formatarMoeda(totais.valorTotal)}</p>
          </div>
        </div>
        
        <div className="resumo-card">
          <div className="resumo-icon">📦</div>
          <div className="resumo-content">
            <h3>Itens Vendidos</h3>
            <p className="resumo-valor">{totais.quantidadeTotal}</p>
          </div>
        </div>
        
        <div className="resumo-card">
          <div className="resumo-icon">🎯</div>
          <div className="resumo-content">
            <h3>Ticket Médio</h3>
            <p className="resumo-valor">{formatarMoeda(totais.ticketMedio)}</p>
          </div>
        </div>
        
        <div className="resumo-card">
          <div className="resumo-icon">📊</div>
          <div className="resumo-content">
            <h3>Total de Vendas</h3>
            <p className="resumo-valor">{vendas.length}</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="vendas-filtros">
        <div className="filtros-linha-1">
          <select
            value={filtros.produto}
            onChange={(e) => handleFiltroChange('produto', e.target.value)}
            className="select-produto"
          >
            <option value="">Todos os produtos</option>
            {produtos.map(produto => (
              <option key={produto.id} value={produto.id}>
                {produto.nome} (Estoque: {produto.estoque})
              </option>
            ))}
          </select>

          <select
            value={filtros.categoria}
            onChange={(e) => handleFiltroChange('categoria', e.target.value)}
            className="select-categoria"
          >
            <option value="">Todas as categorias</option>
            {categorias.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nome}</option>
            ))}
          </select>
        </div>

        <div className="filtros-linha-2">
          <div className="filtro-data">
            <label>Data início:</label>
            <input
              type="date"
              value={filtros.dataInicio}
              onChange={(e) => handleFiltroChange('dataInicio', e.target.value)}
              className="input-data"
            />
          </div>

          <div className="filtro-data">
            <label>Data fim:</label>
            <input
              type="date"
              value={filtros.dataFim}
              onChange={(e) => handleFiltroChange('dataFim', e.target.value)}
              className="input-data"
            />
          </div>

          <button 
            onClick={() => {
              handleFiltroChange('dataInicio', obterDataHoje());
              handleFiltroChange('dataFim', obterDataHoje());
            }}
            className="btn-hoje"
          >
            📅 Hoje
          </button>

          <button onClick={limparFiltros} className="btn-limpar-filtros">
            🗑️ Limpar
          </button>
        </div>
      </div>

      {/* Lista de Vendas */}
      {error && (
        <div className="vendas-error">
          <p>❌ {error}</p>
          <button onClick={carregarDados}>Tentar novamente</button>
        </div>
      )}

      {vendas.length === 0 && !loading ? (
        <div className="vendas-vazio">
          <h3>🛒 Nenhuma venda encontrada</h3>
          <p>Não há vendas que correspondam aos filtros selecionados.</p>
          <button onClick={() => abrirModal()} className="btn-criar-primeira">
            Registrar primeira venda
          </button>
        </div>
      ) : (
        <>
          <div className="vendas-table-container">
            <table className="vendas-table">
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Qtd</th>
                  <th>Preço Unit.</th>
                  <th>Total</th>
                  <th>Observações</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {vendas.map(venda => (
                  <tr key={venda.id} className="venda-row">
                    <td className="venda-data">
                      {formatarData(venda.data_venda)}
                    </td>
                    <td className="venda-produto">
                      <strong>{venda.produto_nome}</strong>
                    </td>
                    <td className="venda-categoria">
                      {venda.categoria_nome}
                    </td>
                    <td className="venda-quantidade">
                      <span className="badge-quantidade">{venda.quantidade}</span>
                    </td>
                    <td className="venda-preco">
                      {formatarMoeda(venda.preco_unitario)}
                    </td>
                    <td className="venda-total">
                      <strong>{formatarMoeda(venda.valor_total)}</strong>
                    </td>
                    <td className="venda-observacoes">
                      {venda.observacoes && (
                        <span className="observacoes-badge" title={venda.observacoes}>
                          📝 Ver
                        </span>
                      )}
                    </td>
                    <td className="venda-acoes">
                      <button 
                        onClick={() => abrirModal(venda)}
                        className="btn-editar"
                        title="Editar venda"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDelete(venda)}
                        className="btn-excluir"
                        title="Excluir venda"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="vendas-paginacao">
              <button 
                onClick={() => setPaginaAtual(1)}
                disabled={paginaAtual === 1}
                className="btn-pagina"
              >
                ⏮️
              </button>
              
              <button 
                onClick={() => setPaginaAtual(paginaAtual - 1)}
                disabled={paginaAtual === 1}
                className="btn-pagina"
              >
                ⬅️
              </button>

              {gerarPaginas().map(pagina => (
                <button
                  key={pagina}
                  onClick={() => setPaginaAtual(pagina)}
                  className={`btn-pagina ${paginaAtual === pagina ? 'ativa' : ''}`}
                >
                  {pagina}
                </button>
              ))}

              <button 
                onClick={() => setPaginaAtual(paginaAtual + 1)}
                disabled={paginaAtual === totalPaginas}
                className="btn-pagina"
              >
                ➡️
              </button>
              
              <button 
                onClick={() => setPaginaAtual(totalPaginas)}
                disabled={paginaAtual === totalPaginas}
                className="btn-pagina"
              >
                ⏭️
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal de Venda */}
      {modalAberto && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{vendaEditando ? 'Editar Venda' : 'Nova Venda'}</h2>
              <button onClick={fecharModal} className="btn-fechar-modal">✖️</button>
            </div>

            <form onSubmit={handleSubmit} className="venda-form">
              <div className="form-group">
                <label htmlFor="produto">Produto *</label>
                <select
                  id="produto"
                  name="produto"
                  value={formData.produto}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Selecione um produto</option>
                  {produtos.map(produto => (
                    <option 
                      key={produto.id} 
                      value={produto.id}
                      disabled={produto.estoque === 0}
                    >
                      {produto.nome} - {formatarMoeda(produto.preco)} 
                      (Estoque: {produto.estoque})
                      {produto.estoque === 0 ? ' - SEM ESTOQUE' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="quantidade">Quantidade *</label>
                  <input
                    type="number"
                    id="quantidade"
                    name="quantidade"
                    value={formData.quantidade}
                    onChange={handleInputChange}
                    min="1"
                    required
                    placeholder="1"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="preco_unitario">Preço Unitário</label>
                  <input
                    type="number"
                    id="preco_unitario"
                    name="preco_unitario"
                    value={formData.preco_unitario}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    placeholder="Preço do produto"
                  />
                  <small>Deixe vazio para usar o preço atual do produto</small>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="observacoes">Observações</label>
                <textarea
                  id="observacoes"
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleInputChange}
                  placeholder="Observações da venda (opcional)"
                  rows="3"
                />
              </div>

              {/* Preview do valor total */}
              {formData.quantidade && formData.preco_unitario && (
                <div className="valor-preview">
                  <strong>
                    Valor Total: {formatarMoeda(formData.quantidade * formData.preco_unitario)}
                  </strong>
                </div>
              )}

              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={fecharModal}
                  className="btn-cancelar"
                  disabled={salvandoVenda}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="btn-salvar"
                  disabled={salvandoVenda}
                >
                  {salvandoVenda ? '⏳ Salvando...' : '💾 Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading && vendas.length > 0 && (
        <div className="loading-overlay">
          <div className="spinner-small"></div>
        </div>
      )}
    </div>
  );
};

export default VendasList;