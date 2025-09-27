import React, { useState, useEffect } from 'react';
import { produtosAPI, categoriasAPI } from '../../services/api';
import './ProdutosList.css';

const ProdutosList = () => {
  // Estados principais
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para filtros
  const [filtros, setFiltros] = useState({
    busca: '',
    categoria: '',
    estoqueBaixo: false,
    ativo: true
  });
  
  // Estados para paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalItens, setTotalItens] = useState(0);
  const itensPorPagina = 12;
  
  // Estados para modal de produto
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [salvandoProduto, setSalvandoProduto] = useState(false);
  
  // Estados para formulário
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    preco: '',
    estoque: '',
    categoria: '',
    ativo: true
  });

  // Carregar dados quando componente monta
  useEffect(() => {
    carregarDados();
    carregarCategorias();
  }, []);

  // Recarregar produtos quando filtros ou página mudam
  useEffect(() => {
    carregarDados();
  }, [filtros, paginaAtual]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Construir parâmetros da query
      const params = new URLSearchParams();
      
      if (filtros.busca) params.append('busca', filtros.busca);
      if (filtros.categoria) params.append('categoria', filtros.categoria);
      if (filtros.estoqueBaixo) params.append('estoque_baixo', 'true');
      if (filtros.ativo !== null) params.append('ativo', filtros.ativo);
      
      params.append('page', paginaAtual);
      params.append('page_size', itensPorPagina);
      
      const response = await produtosAPI.listar(`?${params.toString()}`);
      
      setProdutos(response.data.results || response.data);
      setTotalItens(response.data.count || response.data.length);
      setTotalPaginas(Math.ceil((response.data.count || response.data.length) / itensPorPagina));
      
    } catch (err) {
      setError('Erro ao carregar produtos');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const carregarCategorias = async () => {
    try {
      const response = await categoriasAPI.listar();
      setCategorias(response.data.results || response.data);
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
    }
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
      busca: '',
      categoria: '',
      estoqueBaixo: false,
      ativo: true
    });
    setPaginaAtual(1);
  };

  // Modal handlers
  const abrirModal = (produto = null) => {
    if (produto) {
      setProdutoEditando(produto);
      setFormData({
        nome: produto.nome,
        descricao: produto.descricao || '',
        preco: produto.preco,
        estoque: produto.estoque,
        categoria: produto.categoria,
        ativo: produto.ativo
      });
    } else {
      setProdutoEditando(null);
      setFormData({
        nome: '',
        descricao: '',
        preco: '',
        estoque: '',
        categoria: '',
        ativo: true
      });
    }
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setProdutoEditando(null);
    setFormData({
      nome: '',
      descricao: '',
      preco: '',
      estoque: '',
      categoria: '',
      ativo: true
    });
  };

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSalvandoProduto(true);
      
      // Validações básicas
      if (!formData.nome.trim()) {
        alert('Nome do produto é obrigatório');
        return;
      }
      
      if (!formData.preco || parseFloat(formData.preco) <= 0) {
        alert('Preço deve ser maior que zero');
        return;
      }
      
      if (!formData.categoria) {
        alert('Categoria é obrigatória');
        return;
      }

      const dadosParaEnviar = {
        ...formData,
        preco: parseFloat(formData.preco),
        estoque: parseInt(formData.estoque) || 0
      };

      if (produtoEditando) {
        await produtosAPI.atualizar(produtoEditando.id, dadosParaEnviar);
      } else {
        await produtosAPI.criar(dadosParaEnviar);
      }

      fecharModal();
      carregarDados();
      
    } catch (err) {
      console.error('Erro ao salvar produto:', err);
      alert('Erro ao salvar produto. Tente novamente.');
    } finally {
      setSalvandoProduto(false);
    }
  };

  const handleDelete = async (produto) => {
    if (window.confirm(`Tem certeza que deseja excluir o produto "${produto.nome}"?`)) {
      try {
        await produtosAPI.deletar(produto.id);
        carregarDados();
      } catch (err) {
        console.error('Erro ao excluir produto:', err);
        alert('Erro ao excluir produto');
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

  const getStatusEstoque = (produto) => {
    if (produto.estoque === 0) {
      return { texto: 'SEM ESTOQUE', classe: 'sem-estoque' };
    } else if (produto.estoque < 10) {
      return { texto: 'BAIXO', classe: 'estoque-baixo' };
    } else {
      return { texto: 'OK', classe: 'estoque-ok' };
    }
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

  if (loading && produtos.length === 0) {
    return (
      <div className="produtos-loading">
        <div className="spinner"></div>
        <p>Carregando produtos...</p>
      </div>
    );
  }

  return (
    <div className="produtos-container">
      {/* Header */}
      <div className="produtos-header">
        <div className="header-left">
          <h1>🛍️ Produtos</h1>
          <span className="total-itens">{totalItens} produtos encontrados</span>
        </div>
        <button 
          className="btn-novo-produto"
          onClick={() => abrirModal()}
        >
          ➕ Novo Produto
        </button>
      </div>

      {/* Filtros */}
      <div className="produtos-filtros">
        <div className="filtro-busca">
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={filtros.busca}
            onChange={(e) => handleFiltroChange('busca', e.target.value)}
            className="input-busca"
          />
        </div>

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

        <label className="checkbox-estoque">
          <input
            type="checkbox"
            checked={filtros.estoqueBaixo}
            onChange={(e) => handleFiltroChange('estoqueBaixo', e.target.checked)}
          />
          Apenas estoque baixo
        </label>

        <select
          value={filtros.ativo}
          onChange={(e) => handleFiltroChange('ativo', e.target.value === 'true')}
          className="select-status"
        >
          <option value={true}>Apenas ativos</option>
          <option value={false}>Apenas inativos</option>
          <option value="">Todos</option>
        </select>

        <button onClick={limparFiltros} className="btn-limpar-filtros">
          🗑️ Limpar
        </button>
      </div>

      {/* Lista de Produtos */}
      {error && (
        <div className="produtos-error">
          <p>❌ {error}</p>
          <button onClick={carregarDados}>Tentar novamente</button>
        </div>
      )}

      {produtos.length === 0 && !loading ? (
        <div className="produtos-vazio">
          <h3>📦 Nenhum produto encontrado</h3>
          <p>Não há produtos que correspondam aos filtros selecionados.</p>
          <button onClick={() => abrirModal()} className="btn-criar-primeiro">
            Criar primeiro produto
          </button>
        </div>
      ) : (
        <>
          <div className="produtos-grid">
            {produtos.map(produto => {
              const statusEstoque = getStatusEstoque(produto);
              
              return (
                <div key={produto.id} className={`produto-card ${!produto.ativo ? 'inativo' : ''}`}>
                  <div className="produto-header">
                    <h3 className="produto-nome">{produto.nome}</h3>
                    <div className="produto-acoes">
                      <button 
                        onClick={() => abrirModal(produto)}
                        className="btn-editar"
                        title="Editar produto"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDelete(produto)}
                        className="btn-excluir"
                        title="Excluir produto"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="produto-info">
                    <p className="produto-categoria">{produto.categoria_nome}</p>
                    
                    {produto.descricao && (
                      <p className="produto-descricao">{produto.descricao}</p>
                    )}
                    
                    <div className="produto-preco">
                      {formatarMoeda(produto.preco)}
                    </div>
                    
                    <div className="produto-estoque">
                      <span className="estoque-label">Estoque:</span>
                      <span className={`estoque-valor ${statusEstoque.classe}`}>
                        {produto.estoque} ({statusEstoque.texto})
                      </span>
                    </div>
                    
                    {!produto.ativo && (
                      <div className="produto-inativo">
                        ⚠️ Produto inativo
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="produtos-paginacao">
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

      {/* Modal de Produto */}
      {modalAberto && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{produtoEditando ? 'Editar Produto' : 'Novo Produto'}</h2>
              <button onClick={fecharModal} className="btn-fechar-modal">✖️</button>
            </div>

            <form onSubmit={handleSubmit} className="produto-form">
              <div className="form-group">
                <label htmlFor="nome">Nome do Produto *</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  required
                  placeholder="Digite o nome do produto"
                />
              </div>

              <div className="form-group">
                <label htmlFor="descricao">Descrição</label>
                <textarea
                  id="descricao"
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleInputChange}
                  placeholder="Descrição do produto (opcional)"
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="preco">Preço *</label>
                  <input
                    type="number"
                    id="preco"
                    name="preco"
                    value={formData.preco}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    required
                    placeholder="0,00"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="estoque">Estoque</label>
                  <input
                    type="number"
                    id="estoque"
                    name="estoque"
                    value={formData.estoque}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="categoria">Categoria *</label>
                <select
                  id="categoria"
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nome}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="checkbox-ativo">
                  <input
                    type="checkbox"
                    name="ativo"
                    checked={formData.ativo}
                    onChange={handleInputChange}
                  />
                  Produto ativo
                </label>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={fecharModal}
                  className="btn-cancelar"
                  disabled={salvandoProduto}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="btn-salvar"
                  disabled={salvandoProduto}
                >
                  {salvandoProduto ? '⏳ Salvando...' : '💾 Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading && produtos.length > 0 && (
        <div className="loading-overlay">
          <div className="spinner-small"></div>
        </div>
      )}
    </div>
  );
};

export default ProdutosList;