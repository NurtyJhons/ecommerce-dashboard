import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { dashboardAPI, produtosAPI, vendasAPI } from '../../services/api';
import './Dashboard.css';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  // Estados para armazenar dados
  const [stats, setStats] = useState({});
  const [vendasData, setVendasData] = useState([]);
  const [produtosData, setProdutosData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carregar dados quando componente monta
  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Buscar todos os dados em paralelo
      const [statsResponse, vendasResponse, produtosResponse] = await Promise.all([
        dashboardAPI.stats(),
        dashboardAPI.graficoVendas(30),
        dashboardAPI.graficoProdutos(10)
      ]);

      setStats(statsResponse.data);
      setVendasData(vendasResponse.data);
      setProdutosData(produtosResponse.data);
      
    } catch (err) {
      setError('Erro ao carregar dados do dashboard');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  // Configuração do gráfico de vendas
  const vendasChartData = {
    labels: vendasData.map(item => {
      const date = new Date(item.data);
      return date.toLocaleDateString('pt-BR');
    }),
    datasets: [
      {
        label: 'Vendas (R$)',
        data: vendasData.map(item => item.total_vendas),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
      },
      {
        label: 'Quantidade de Vendas',
        data: vendasData.map(item => item.quantidade_vendas),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        yAxisID: 'y1',
      },
    ],
  };

  const vendasChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Vendas dos Últimos 30 Dias',
      },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  // Configuração do gráfico de produtos
  const produtosChartData = {
    labels: produtosData.map(item => item.nome),
    datasets: [
      {
        label: 'Unidades Vendidas',
        data: produtosData.map(item => item.total_vendido),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
          'rgba(199, 199, 199, 0.8)',
          'rgba(83, 102, 255, 0.8)',
          'rgba(255, 99, 255, 0.8)',
          'rgba(99, 255, 132, 0.8)',
        ],
      },
    ],
  };

  const produtosChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Top 10 Produtos Mais Vendidos',
      },
    },
  };

  // Formatação de moeda brasileira
  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h3>❌ {error}</h3>
        <button onClick={carregarDados} className="btn-retry">
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>📊 Dashboard E-commerce</h1>
        <button onClick={carregarDados} className="btn-refresh">
          🔄 Atualizar
        </button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🛍️</div>
          <div className="stat-content">
            <h3>Produtos Ativos</h3>
            <p className="stat-number">{stats.produtos_ativos || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <h3>Estoque Baixo</h3>
            <p className="stat-number danger">{stats.produtos_estoque_baixo || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Vendas Hoje</h3>
            <p className="stat-number">{formatarMoeda(stats.total_vendas_hoje)}</p>
            <small>{stats.quantidade_vendas_hoje || 0} vendas</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>Vendas do Mês</h3>
            <p className="stat-number success">{formatarMoeda(stats.total_vendas_mes)}</p>
            <small>{stats.quantidade_vendas_mes || 0} vendas</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-content">
            <h3>Produto Top</h3>
            <p className="stat-text">{stats.produto_mais_vendido || 'N/A'}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>Categoria Top</h3>
            <p className="stat-text">{stats.categoria_mais_vendida || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="charts-grid">
        {/* Gráfico de Vendas */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>📈 Evolução das Vendas</h3>
          </div>
          <div className="chart-content">
            {vendasData.length > 0 ? (
              <Line data={vendasChartData} options={vendasChartOptions} />
            ) : (
              <div className="no-data">
                <p>📊 Nenhum dado de vendas encontrado</p>
              </div>
            )}
          </div>
        </div>

        {/* Gráfico de Produtos */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>🏆 Produtos Mais Vendidos</h3>
          </div>
          <div className="chart-content">
            {produtosData.length > 0 ? (
              <Bar data={produtosChartData} options={produtosChartOptions} />
            ) : (
              <div className="no-data">
                <p>📊 Nenhum dado de produtos encontrado</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer com informações */}
      <div className="dashboard-footer">
        <p>
          🕒 Última atualização: {new Date().toLocaleString('pt-BR')}
        </p>
      </div>
    </div>
  );
};

export default Dashboard;