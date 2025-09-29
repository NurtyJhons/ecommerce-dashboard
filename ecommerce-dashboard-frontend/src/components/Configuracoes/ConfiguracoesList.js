import React, { useState, useEffect } from 'react';
import { configuracoesAPI, viacepAPI, formatters, validators } from '../../services/api';
import './ConfiguracoesList.css';

const ConfiguracoesList = () => {
  // Estados principais
  const [configuracoes, setConfiguracoes] = useState({
    nome_empresa: '',
    cnpj: '',
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    telefone: '',
    email: '',
  });
  
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [buscandoCEP, setBuscandoCEP] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  // Carregar configurações quando componente monta
  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  const carregarConfiguracoes = async () => {
    try {
      setLoading(true);
      const response = await configuracoesAPI.obter();
      setConfiguracoes(response.data);
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
      setMessage('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  // Handler para mudanças nos inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Aplicar formatação específica
    let formattedValue = value;
    
    if (name === 'cep') {
      formattedValue = formatters.cep(value);
      
      // Buscar CEP automaticamente quando completar 8 dígitos
      if (formattedValue.replace(/\D/g, '').length === 8) {
        buscarCEP(formattedValue);
      }
    } else if (name === 'cnpj') {
      formattedValue = formatters.cnpj(value);
    } else if (name === 'telefone') {
      formattedValue = formatters.telefone(value);
    }
    
    setConfiguracoes(prev => ({
      ...prev,
      [name]: formattedValue
    }));
    
    // Limpar erro específico quando usuário começar a digitar
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Buscar CEP no ViaCEP
  const buscarCEP = async (cep) => {
    try {
      setBuscandoCEP(true);
      setMessage('');
      
      const response = await viacepAPI.buscarCEP(cep);
      const data = response.data;
      
      if (data.success) {
        // Auto-preencher campos de endereço
        setConfiguracoes(prev => ({
          ...prev,
          endereco: data.endereco,
          bairro: data.bairro,
          cidade: data.cidade,
          uf: data.uf,
          complemento: data.complemento || prev.complemento
        }));
        
        setMessage('✅ CEP encontrado! Endereço preenchido automaticamente.');
      }
      
    } catch (err) {
      console.error('Erro ao buscar CEP:', err);
      
      if (err.response?.status === 404) {
        setMessage('❌ CEP não encontrado. Verifique o número digitado.');
      } else {
        setMessage('❌ Erro ao buscar CEP. Tente novamente.');
      }
      
      setErrors(prev => ({
        ...prev,
        cep: 'CEP não encontrado ou inválido'
      }));
      
    } finally {
      setBuscandoCEP(false);
    }
  };

  // Validar formulário
  const validateForm = () => {
    const newErrors = {};
    
    // Campos obrigatórios
    if (!configuracoes.nome_empresa.trim()) {
      newErrors.nome_empresa = 'Nome da empresa é obrigatório';
    }
    
    if (!configuracoes.cep.trim()) {
      newErrors.cep = 'CEP é obrigatório';
    } else if (!validators.cep(configuracoes.cep)) {
      newErrors.cep = 'CEP deve ter 8 dígitos';
    }
    
    if (!configuracoes.endereco.trim()) {
      newErrors.endereco = 'Endereço é obrigatório';
    }
    
    if (!configuracoes.cidade.trim()) {
      newErrors.cidade = 'Cidade é obrigatória';
    }
    
    if (!configuracoes.uf.trim()) {
      newErrors.uf = 'UF é obrigatório';
    }
    
    // Validações condicionais
    if (configuracoes.cnpj && !validators.cnpj(configuracoes.cnpj)) {
      newErrors.cnpj = 'CNPJ deve ter 14 dígitos';
    }
    
    if (configuracoes.email && !validators.email(configuracoes.email)) {
      newErrors.email = 'Email inválido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Salvar configurações
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setMessage('❌ Corrija os erros antes de salvar');
      return;
    }
    
    try {
      setSalvando(true);
      setMessage('');
      
      await configuracoesAPI.salvar(configuracoes);
      
      setMessage('✅ Configurações salvas com sucesso!');
      
      // Limpar mensagem após 3 segundos
      setTimeout(() => setMessage(''), 3000);
      
    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
      
      if (err.response?.data?.error) {
        setMessage(`❌ ${err.response.data.error}`);
      } else {
        setMessage('❌ Erro ao salvar configurações');
      }
      
    } finally {
      setSalvando(false);
    }
  };

  // Estados UF do Brasil
  const estadosBrasil = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
    'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
    'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  if (loading) {
    return (
      <div className="configuracoes-loading">
        <div className="spinner"></div>
        <p>Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="configuracoes-container">
      {/* Header */}
      <div className="configuracoes-header">
        <div className="header-left">
          <h1>🏪 Configurações da Loja</h1>
          <span className="subtitle">Gerencie os dados da sua empresa</span>
        </div>
        
        {/* Status da integração ViaCEP */}
        <div className="integracao-status">
          <div className="status-item">
            <span className="status-icon">🔗</span>
            <span className="status-text">ViaCEP Integrado</span>
          </div>
        </div>
      </div>

      {/* Mensagem de feedback */}
      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="configuracoes-form">
        
        {/* Dados da Empresa */}
        <div className="form-section">
          <h3>📋 Dados da Empresa</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nome_empresa">Nome da Empresa *</label>
              <input
                type="text"
                id="nome_empresa"
                name="nome_empresa"
                value={configuracoes.nome_empresa}
                onChange={handleInputChange}
                className={errors.nome_empresa ? 'error' : ''}
                placeholder="Ex: Minha Loja LTDA"
                required
              />
              {errors.nome_empresa && <span className="error-text">{errors.nome_empresa}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="cnpj">CNPJ</label>
              <input
                type="text"
                id="cnpj"
                name="cnpj"
                value={configuracoes.cnpj}
                onChange={handleInputChange}
                className={errors.cnpj ? 'error' : ''}
                placeholder="12.345.678/0001-90"
                maxLength="18"
              />
              {errors.cnpj && <span className="error-text">{errors.cnpj}</span>}
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div className="form-section">
          <h3>📍 Endereço</h3>
          
          <div className="form-row">
            <div className="form-group cep-group">
              <label htmlFor="cep">CEP *</label>
              <div className="input-with-icon">
                <input
                  type="text"
                  id="cep"
                  name="cep"
                  value={configuracoes.cep}
                  onChange={handleInputChange}
                  className={errors.cep ? 'error' : ''}
                  placeholder="12345-678"
                  maxLength="9"
                  required
                />
                {buscandoCEP && <div className="input-loading"></div>}
              </div>
              {errors.cep && <span className="error-text">{errors.cep}</span>}
              <small>Digite o CEP para buscar automaticamente</small>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-2">
              <label htmlFor="endereco">Endereço *</label>
              <input
                type="text"
                id="endereco"
                name="endereco"
                value={configuracoes.endereco}
                onChange={handleInputChange}
                className={errors.endereco ? 'error' : ''}
                placeholder="Rua, Avenida, etc."
                required
              />
              {errors.endereco && <span className="error-text">{errors.endereco}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="numero">Número</label>
              <input
                type="text"
                id="numero"
                name="numero"
                value={configuracoes.numero}
                onChange={handleInputChange}
                placeholder="123"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="complemento">Complemento</label>
              <input
                type="text"
                id="complemento"
                name="complemento"
                value={configuracoes.complemento}
                onChange={handleInputChange}
                placeholder="Sala, Andar, etc."
              />
            </div>

            <div className="form-group">
              <label htmlFor="bairro">Bairro</label>
              <input
                type="text"
                id="bairro"
                name="bairro"
                value={configuracoes.bairro}
                onChange={handleInputChange}
                placeholder="Nome do bairro"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-2">
              <label htmlFor="cidade">Cidade *</label>
              <input
                type="text"
                id="cidade"
                name="cidade"
                value={configuracoes.cidade}
                onChange={handleInputChange}
                className={errors.cidade ? 'error' : ''}
                placeholder="Nome da cidade"
                required
              />
              {errors.cidade && <span className="error-text">{errors.cidade}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="uf">UF *</label>
              <select
                id="uf"
                name="uf"
                value={configuracoes.uf}
                onChange={handleInputChange}
                className={errors.uf ? 'error' : ''}
                required
              >
                <option value="">Selecione</option>
                {estadosBrasil.map(estado => (
                  <option key={estado} value={estado}>{estado}</option>
                ))}
              </select>
              {errors.uf && <span className="error-text">{errors.uf}</span>}
            </div>
          </div>
        </div>

        {/* Contato */}
        <div className="form-section">
          <h3>📞 Contato</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="telefone">Telefone</label>
              <input
                type="tel"
                id="telefone"
                name="telefone"
                value={configuracoes.telefone}
                onChange={handleInputChange}
                placeholder="(11) 99999-9999"
                maxLength="15"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={configuracoes.email}
                onChange={handleInputChange}
                className={errors.email ? 'error' : ''}
                placeholder="contato@minhaloja.com"
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="form-actions">
          <button
            type="submit"
            disabled={salvando || buscandoCEP}
            className="btn-salvar"
          >
            {salvando ? (
              <>⏳ Salvando...</>
            ) : (
              <>💾 Salvar Configurações</>
            )}
          </button>
        </div>
      </form>

      {/* Informações */}
      <div className="configuracoes-info">
        <div className="info-card">
          <h4>💡 Sobre as Configurações</h4>
          <ul>
            <li><strong>Nome da Empresa:</strong> Aparece nos relatórios e documentos</li>
            <li><strong>CEP:</strong> Busca automática via ViaCEP ao digitar</li>
            <li><strong>Endereço:</strong> Usado para cálculos de frete e relatórios</li>
            <li><strong>Dados salvos:</strong> Ficam disponíveis em todo o sistema</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracoesList;