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
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { dashboardAPI } from '../../services/api';
import './VendasChart.css';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const VendasChart = ({ 
  tipo = 'line',           // 'line' ou 'bar'
  periodo = 30,            // dias para mostrar
  altura = 400,            // altura do gráfico
  titulo = 'Vendas',       // título customizável
  mostrarLegenda = true,   // mostrar/ocultar legenda
  animado = true,          // animações
  cores = null             // cores customizadas
}) => {
  const [dados, setDados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tipoAtual, setTipoAtual] = useState(tipo);
  const [periodoAtual, setPeriodoAtual] = useState(periodo);

  // Carregar dados quando o componente monta ou parâmetros mudam
  useEffect(() => {
    carregarDados();
  }, [periodoAtual]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await dashboardAPI.graficoVendas(periodoAtual);
      setDados(response.data);
      
    } catch (err) {
      setError('Erro ao carregar dados de vendas');
      console.error('Erro no VendasChart:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cores padrão para os gráficos
  const coresPadrao = {
    vendas: {
      border: 'rgb(75, 192, 192)',
      background: 'rgba(75, 192, 192, 0.2)',
      fill: 'rgba(75, 192, 192, 0.1)',
    },
    quantidade: {
      border: 'rgb(255, 99, 132)',
      background: 'rgba(255, 99, 132, 0.2)',
      fill: 'rgba(255, 99, 132, 0.1)',
    }
  };

  // Configuração dos dados do gráfico
  const chartData = {
    labels: dados.map(item => {
      const date = new Date(item.data);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit'
      });
    }),
    datasets: [
      {
        label: 'Valor das Vendas (R$)',
        data: dados.map(item => parseFloat(item.total_vendas) || 0),
        borderColor: cores?.vendas?.border || coresPadrao.vendas.border,
        backgroundColor: tipoAtual === 'bar' 
          ? cores?.vendas?.background || coresPadrao.vendas.background
          : cores?.vendas?.fill || coresPadrao.vendas.fill,
        tension: 0.4,
        fill: tipoAtual === 'line',
        yAxisID: 'y',
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 3,
      },
      {
        label: 'Quantidade de Vendas',
        data: dados.map(item => item.quantidade_vendas || 0),
        borderColor: cores?.quantidade?.border || coresPadrao.quantidade.border,
        backgroundColor: tipoAtual === 'bar'
          ? cores?.quantidade?.background || coresPadrao.quantidade.background
          : cores?.quantidade?.fill || coresPadrao.quantidade.fill,
        tension: 0.4,
        fill: tipoAtual === 'line',
        yAxisID: 'y1',
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 3,
      },
    ],
  };

  // Opções do gráfico
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: animado ? {
      duration: 1000,
      easing: 'easeInOutQuart',
    } : false,
    plugins: {
      legend: {
        display: mostrarLegenda,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          }
        }
      },
      title: {
        display: !!titulo,
        text: titulo,
        font: {
          size: 16,
          weight: 'bold',
          family: "'Inter', sans-serif",
        },
        padding: 20,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            
            if (label.includes('R$')) {
              return `${label}: ${formatarMoeda(value)}`;
            } else {
              return `${label}: ${value} vendas`;
            }
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: 11,
          }
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Valor (R$)',
          font: {
            size: 12,
            weight: 'bold',
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function(value) {
            return formatarMoeda(value);
          },
          font: {
            size: 11,
          }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Quantidade',
          font: {
            size: 12,
            weight: 'bold',
          }
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          font: {
            size: 11,
          }
        }
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
  };

  // Formatação de moeda brasileira
  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valor || 0);
  };

  // Calcular estatísticas dos dados
  const calcularEstatisticas = () => {
    if (dados.length === 0) return null;

    const totalVendas = dados.reduce((acc, item) => acc + parseFloat(item.total_vendas || 0), 0);
    const totalQuantidade = dados.reduce((acc, item) => acc + (item.quantidade_vendas || 0), 0);
    const mediaVendas = totalVendas / dados.length;
    const ticketMedio = totalQuantidade > 0 ? totalVendas / totalQuantidade : 0;

    return {
      totalVendas,
      totalQuantidade,
      mediaVendas,
      ticketMedio,
      diasComDados: dados.filter(item => item.quantidade_vendas > 0).length
    };
  };

  const stats = calcularEstatisticas();

  if (loading) {
    return (
      <div className="vendas-chart-container">
        <div className="chart-loading">
          <div className="chart-spinner"></div>
          <p>Carregando gráfico de vendas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vendas-chart-container">
        <div className="chart-error">
          <h4>❌ {error}</h4>
          <button onClick={carregarDados} className="btn-retry-chart">
            🔄 Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (dados.length === 0) {
    return (
      <div className="vendas-chart-container">
        <div className="chart-no-data">
          <h4>📊 Sem dados de vendas</h4>
          <p>Nenhuma venda encontrada para o período selecionado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="vendas-chart-container">
      {/* Controles do Gráfico */}
      <div className="chart-controls">
        <div className="chart-controls-left">
          <select 
            value={periodoAtual} 
            onChange={(e) => setPeriodoAtual(Number(e.target.value))}
            className="select-periodo"
          >
            <option value={7}>Últimos 7 dias</option>
            <option value={15}>Últimos 15 dias</option>
            <option value={30}>Últimos 30 dias</option>
            <option value={60}>Últimos 60 dias</option>
            <option value={90}>Últimos 90 dias</option>
          </select>
        </div>

        <div className="chart-controls-right">
          <button
            className={`btn-chart-type ${tipoAtual === 'line' ? 'active' : ''}`}
            onClick={() => setTipoAtual('line')}
          >
            📈 Linha
          </button>
          <button
            className={`btn-chart-type ${tipoAtual === 'bar' ? 'active' : ''}`}
            onClick={() => setTipoAtual('bar')}
          >
            📊 Barras
          </button>
        </div>
      </div>

      {/* Estatísticas Resumidas */}
      {stats && (
        <div className="chart-stats">
          <div className="stat-item">
            <span className="stat-label">Total:</span>
            <span className="stat-value">{formatarMoeda(stats.totalVendas)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Vendas:</span>
            <span className="stat-value">{stats.totalQuantidade}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Média/dia:</span>
            <span className="stat-value">{formatarMoeda(stats.mediaVendas)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Ticket médio:</span>
            <span className="stat-value">{formatarMoeda(stats.ticketMedio)}</span>
          </div>
        </div>
      )}

      {/* Gráfico */}
      <div className="chart-wrapper" style={{ height: `${altura}px` }}>
        {tipoAtual === 'line' ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <Bar data={chartData} options={chartOptions} />
        )}
      </div>

      {/* Footer do gráfico */}
      <div className="chart-footer">
        <p>
          📅 Período: {periodoAtual} dias • 
          📊 {stats?.diasComDados || 0} dias com vendas • 
          🕒 Atualizado: {new Date().toLocaleTimeString('pt-BR')}
        </p>
      </div>
    </div>
  );
};

export default VendasChart;