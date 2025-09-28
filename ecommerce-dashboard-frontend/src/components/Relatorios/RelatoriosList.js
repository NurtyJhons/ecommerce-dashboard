import React, { useState, useEffect } from 'react';
import { relatoriosAPI, downloadPDF, categoriasAPI, produtosAPI } from '../../services/api';
import './RelatoriosList.css';

const RelatoriosList = () => {
  // Estados principais
  const [relatorios, setRelatorios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gerandoPDF, setGerandoPDF] = useState(null);
  
  // Estados para filtros
  const [filtrosVendas, setFiltrosVendas] = useState({
    data_inicio: '',
    data_fim: '',
    categoria: '',
    produto: ''
  });
  
  const [filtrosEstoque, setFiltrosEstoque] = useState({
    apenas_baixo: false,
    categoria: ''
  });

  // Carregar dados quando componente monta
  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Carregar relatórios disponíveis, categorias e produtos
      const [relatoriosResponse, categoriasResponse, produtosResponse] = await Promise.all([
        relatoriosAPI.listar(),
        categoriasAPI.listar('?ativo=true'),
        produtosAPI.listar('?ativo=true')
      ]);
      
      setRelatorios(relatoriosResponse.data);
      setCategorias(categoriasResponse.data.results || categoriasResponse.data);
      setProdutos(produtosResponse.data.results || produtosResponse.data);
      
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      alert('Erro ao carregar dados dos relatórios');
    } finally {
      setLoading(false);
    }
  };

  // Handlers para filtros de vendas
  const handleFiltroVendasChange = (campo, valor) => {
    setFiltrosVendas(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  // Handlers para filtros de estoque
  const handleFiltroEstoqueChange = (campo, valor) => {
    setFiltrosEstoque(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  // Gerar relatório de vendas
  const gerarRelatorioVendas = async () => {
    try {
      setGerandoPDF('vendas');
      
      // Filtrar apenas campos com valores
      const filtros = {};
      if (filtrosVendas.data_inicio) filtros.data_inicio = filtrosVendas.data_inicio;
      if (filtrosVendas.data_fim) filtros.data_fim = filtrosVendas.data_fim;
      if (filtrosVendas.categoria) filtros.categoria = filtrosVendas.categoria;
      if (filtrosVendas.produto) filtros.produto = filtrosVendas.produto;
      
      const response = await relatoriosAPI.gerarVendasPDF(filtros);
      
      // Gerar nome do arquivo
      const dataInicio = filtrosVendas.data_inicio || 'todas';
      const dataFim = filtrosVendas.data_fim || 'datas';
      const filename = `relatorio_vendas_${dataInicio}_${dataFim}.pdf`;
      
      // Download do PDF
      downloadPDF(response.data, filename);
      
    } catch (err) {
      console.error('Erro ao gerar relatório de vendas:', err);
      alert('Erro ao gerar relatório de vendas');
    } finally {
      setGerandoPDF(null);
    }
  };

  // Gerar relatório de estoque
  const gerarRelatorioEstoque = async () => {
    try {
      setGerandoPDF('estoque');
      
      const filtros = {};
      if (filtrosEstoque.apenas_baixo) filtros.apenas_baixo = 'true';
      if (filtrosEstoque.categoria) filtros.categoria = filtrosEstoque.categoria;
      
      const response = await relatoriosAPI.gerarEstoquePDF(filtros);
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const filename = `relatorio_estoque_${timestamp}.pdf`;
      
      downloadPDF(response.data, filename);
      
    } catch (err) {
      console.error('Erro ao gerar relatório de estoque:', err);
      alert('Erro ao gerar relatório de estoque');
    } finally {
      setGerandoPDF(null);
    }
  };

  // Utilitários
  const obterDataHoje = () => {
    return new Date().toISOString().split('T')[0];
  };

  const obterDataSemanaPassada = () => {
    const data = new Date();
    data.setDate(data.getDate() - 7);
    return data.toISOString().split('T')[0];
  };

  const obterDataMesPassado = () => {
    const data = new Date();
    data.setMonth(data.getMonth() - 1);
    return data.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="relatorios-loading">
        <div className="spinner"></div>
        <p>Carregando relatórios...</p>
      </div>
    );
  }

  return (
    <div className="relatorios-container">
      {/* Header */}
      <div className="relatorios-header">
        <div className="header-left">
          <h1>📄 Relatórios</h1>
          <span className="subtitle">Gere relatórios em PDF com filtros personalizados</span>
        </div>
      </div>

      <div className="relatorios-grid">
        {/* Relatório de Vendas */}
        <div className="relatorio-card">
          <div className="card-header">
            <div className="card-icon vendas">💰</div>
            <div className="card-info">
              <h3>Relatório de Vendas</h3>
              <p>Vendas por período com estatísticas detalhadas</p>
            </div>
          </div>

          <div className="card-filters">
            <h4>Filtros</h4>
            
            <div className="filter-row">
              <div className="filter-group">
                <label>Data Início:</label>
                <input
                  type="date"
                  value={filtrosVendas.data_inicio}
                  onChange={(e) => handleFiltroVendasChange('data_inicio', e.target.value)}
                  className="input-date"
                />
              </div>

              <div className="filter-group">
                <label>Data Fim:</label>
                <input
                  type="date"
                  value={filtrosVendas.data_fim}
                  onChange={(e) => handleFiltroVendasChange('data_fim', e.target.value)}
                  className="input-date"
                />
              </div>
            </div>

            <div className="filter-row">
              <div className="filter-group">
                <label>Categoria:</label>
                <select
                  value={filtrosVendas.categoria}
                  onChange={(e) => handleFiltroVendasChange('categoria', e.target.value)}
                  className="select-filter"
                >
                  <option value="">Todas as categorias</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nome}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Produto:</label>
                <select
                  value={filtrosVendas.produto}
                  onChange={(e) => handleFiltroVendasChange('produto', e.target.value)}
                  className="select-filter"
                >
                  <option value="">Todos os produtos</option>
                  {produtos.map(prod => (
                    <option key={prod.id} value={prod.id}>{prod.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Botões rápidos */}
            <div className="quick-filters">
              <button
                onClick={() => {
                  handleFiltroVendasChange('data_inicio', obterDataHoje());
                  handleFiltroVendasChange('data_fim', obterDataHoje());
                }}
                className="btn-quick"
              >
                📅 Hoje
              </button>
              <button
                onClick={() => {
                  handleFiltroVendasChange('data_inicio', obterDataSemanaPassada());
                  handleFiltroVendasChange('data_fim', obterDataHoje());
                }}
                className="btn-quick"
              >
                📅 Última Semana
              </button>
              <button
                onClick={() => {
                  handleFiltroVendasChange('data_inicio', obterDataMesPassado());
                  handleFiltroVendasChange('data_fim', obterDataHoje());
                }}
                className="btn-quick"
              >
                📅 Último Mês
              </button>
            </div>
          </div>

          <div className="card-actions">
            <button
              onClick={gerarRelatorioVendas}
              disabled={gerandoPDF === 'vendas'}
              className="btn-gerar vendas"
            >
              {gerandoPDF === 'vendas' ? (
                <>⏳ Gerando...</>
              ) : (
                <>📄 Gerar PDF</>
              )}
            </button>
          </div>
        </div>

        {/* Relatório de Estoque */}
        <div className="relatorio-card">
          <div className="card-header">
            <div className="card-icon estoque">📦</div>
            <div className="card-info">
              <h3>Relatório de Estoque</h3>
              <p>Status do estoque por produto e categoria</p>
            </div>
          </div>

          <div className="card-filters">
            <h4>Filtros</h4>
            
            <div className="filter-row">
              <div className="filter-group">
                <label>Categoria:</label>
                <select
                  value={filtrosEstoque.categoria}
                  onChange={(e) => handleFiltroEstoqueChange('categoria', e.target.value)}
                  className="select-filter"
                >
                  <option value="">Todas as categorias</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="filter-row">
              <label className="checkbox-filter">
                <input
                  type="checkbox"
                  checked={filtrosEstoque.apenas_baixo}
                  onChange={(e) => handleFiltroEstoqueChange('apenas_baixo', e.target.checked)}
                />
                Apenas produtos com estoque baixo
              </label>
            </div>
          </div>

          <div className="card-actions">
            <button
              onClick={gerarRelatorioEstoque}
              disabled={gerandoPDF === 'estoque'}
              className="btn-gerar estoque"
            >
              {gerandoPDF === 'estoque' ? (
                <>⏳ Gerando...</>
              ) : (
                <>📄 Gerar PDF</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Informações adicionais */}
      <div className="relatorios-info">
        <div className="info-card">
          <h4>💡 Dicas</h4>
          <ul>
            <li>Use os filtros para personalizar seus relatórios</li>
            <li>PDFs são gerados automaticamente para download</li>
            <li>Relatórios incluem gráficos e estatísticas detalhadas</li>
            <li>Dados são atualizados em tempo real</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RelatoriosList;