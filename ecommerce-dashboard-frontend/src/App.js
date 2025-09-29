import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Layout/Navbar';
import Dashboard from './components/Dashboard/Dashboard';
import ProdutosList from './components/Produtos/ProdutosList';
import VendasList from './components/Vendas/VendasList';
import ConfiguracoesList from './components/Configuracoes/ConfiguracoesList';
import RelatoriosList from './components/Relatorios/RelatoriosList';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        {/* Navbar fixo no topo */}
        <Navbar />
        
        {/* Conteúdo principal */}
        <main className="main-content">
          <Routes>
            {/* Rota principal - Dashboard */}
            <Route path="/" element={<Dashboard />} />
            
            {/* Rota para produtos */}
            <Route path="/produtos" element={<ProdutosList />} />
            
            {/* Rota para vendas */}
            <Route path="/vendas" element={<VendasList />} />
            
            {/* Rota para configurações */}
            <Route path="/configuracoes" element={<ConfiguracoesList />} />
            
            {/* Rota para relatórios */}
            <Route path="/relatorios" element={<RelatoriosList />} />
            
            {/* Redirecionar rotas antigas para novas */}
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
            
            {/* Rota 404 - página não encontrada */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        
        {/* Footer (opcional) */}
        <Footer />
      </div>
    </Router>
  );
}

// Componente para página não encontrada
const NotFound = () => {
  return (
    <div className="not-found">
      <div className="not-found-content">
        <h1>404</h1>
        <h2>🔍 Página não encontrada</h2>
        <p>A página que você está procurando não existe.</p>
        <div className="not-found-actions">
          <a href="/" className="btn-home">
            🏠 Voltar ao Dashboard
          </a>
          <a href="/produtos" className="btn-produtos">
            🛍️ Ver Produtos
          </a>
          <a href="/vendas" className="btn-vendas">
            💰 Ver Vendas
          </a>
        </div>
      </div>
    </div>
  );
};

// Componente Footer simples
const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <p>
          © 2025 E-commerce Dashboard. 
          Desenvolvido com React + Django
        </p>
        <div className="footer-links">
          <span>v1.0.0</span>
          <span>•</span>
          <a href="https://github.com/NurtyJhons" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <span>•</span>
          <a href="/api/" target="_blank" rel="noopener noreferrer">
            API Docs
          </a>
        </div>
      </div>
    </footer>
  );
};

export default App;
