import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { dashboardAPI } from '../../services/api';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);
  const [stats, setStats] = useState({});
  const [horaAtual, setHoraAtual] = useState(new Date());

  // Atualizar hora a cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setHoraAtual(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Carregar estatísticas básicas
  useEffect(() => {
    carregarStats();
  }, []);

  const carregarStats = async () => {
    try {
      const response = await dashboardAPI.stats();
      setStats(response.data);
    } catch (err) {
      console.error('Erro ao carregar stats:', err);
    }
  };

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const toggleMenu = () => {
    setMenuAberto(!menuAberto);
  };

  const fecharMenu = () => {
    setMenuAberto(false);
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valor || 0);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo e título */}
        <div className="navbar-brand">
          <Link to="/" className="brand-link" onClick={fecharMenu}>
            <div className="brand-logo">🛒</div>
            <div className="brand-text">
              <h1>E-commerce</h1>
              <span>Dashboard</span>
            </div>
          </Link>
        </div>

        {/* Menu hamburger para mobile */}
        <button 
          className={`menu-toggle ${menuAberto ? 'ativo' : ''}`}
          onClick={toggleMenu}
          aria-label="Abrir menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Links de navegação */}
        <div className={`navbar-menu ${menuAberto ? 'ativo' : ''}`}>
          <div className="navbar-nav">
            <Link 
              to="/" 
              className={`nav-link ${isActive('/') ? 'ativo' : ''}`}
              onClick={fecharMenu}
            >
              <span className="nav-icon">📊</span>
              <span className="nav-text">Dashboard</span>
            </Link>

            <Link 
              to="/produtos" 
              className={`nav-link ${isActive('/produtos') ? 'ativo' : ''}`}
              onClick={fecharMenu}
            >
              <span className="nav-icon">🛍️</span>
              <span className="nav-text">Produtos</span>
              {stats.produtos_estoque_baixo > 0 && (
                <span className="nav-badge">{stats.produtos_estoque_baixo}</span>
              )}
            </Link>

            <Link 
              to="/vendas" 
              className={`nav-link ${isActive('/vendas') ? 'ativo' : ''}`}
              onClick={fecharMenu}
            >
              <span className="nav-icon">💰</span>
              <span className="nav-text">Vendas</span>
            </Link>

            <Link 
              to="/configuracoes" 
              className={`nav-link ${isActive('/configuracoes') ? 'ativo' : ''}`}
              onClick={fecharMenu}
            >
              <span className="nav-icon">⚙️</span>
              <span className="nav-text">Configurações</span>
            </Link>

            <Link 
              to="/relatorios" 
              className={`nav-link ${isActive('/relatorios') ? 'ativo' : ''}`}
              onClick={fecharMenu}
            >
              <span className="nav-icon">📄</span>
              <span className="nav-text">Relatórios</span>
            </Link>
          </div>

          {/* Informações no header */}
          <div className="navbar-info">
            {/* Estatísticas rápidas */}
            <div className="info-stats">
              <div className="stat-item">
                <span className="stat-label">Hoje:</span>
                <span className="stat-value">{formatarMoeda(stats.total_vendas_hoje)}</span>
              </div>
              <div className="stat-separator">•</div>
              <div className="stat-item">
                <span className="stat-label">Mês:</span>
                <span className="stat-value">{formatarMoeda(stats.total_vendas_mes)}</span>
              </div>
            </div>

            {/* Relógio */}
            <div className="navbar-clock">
              <div className="clock-time">
                {horaAtual.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              <div className="clock-date">
                {horaAtual.toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit'
                })}
              </div>
            </div>

            {/* Botão de atualizar */}
            <button 
              onClick={carregarStats}
              className="btn-refresh"
              title="Atualizar dados"
            >
              🔄
            </button>
          </div>
        </div>

        {/* Overlay para fechar menu mobile */}
        {menuAberto && <div className="menu-overlay" onClick={fecharMenu}></div>}
      </div>
    </nav>
  );
};

export default Navbar;