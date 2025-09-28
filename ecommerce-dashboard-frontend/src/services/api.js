import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  }
});

// =============================================
// PRODUTOS API
// =============================================

export const produtosAPI = {
  listar: (params = '') => api.get(`/produtos/${params}`),
  criar: (data) => api.post('/produtos/', data),
  buscar: (id) => api.get(`/produtos/${id}/`),
  atualizar: (id, data) => api.put(`/produtos/${id}/`, data),
  deletar: (id) => api.delete(`/produtos/${id}/`),
  estoqueBaixo: () => api.get('/produtos/estoque_baixo/'),
};

// =============================================
// VENDAS API
// =============================================

export const vendasAPI = {
  listar: (params = '') => api.get(`/vendas/${params}`),
  criar: (data) => api.post('/vendas/', data),
  buscar: (id) => api.get(`/vendas/${id}/`),
  atualizar: (id, data) => api.put(`/vendas/${id}/`, data),
  deletar: (id) => api.delete(`/vendas/${id}/`),
};

// =============================================
// CATEGORIAS API
// =============================================

export const categoriasAPI = {
  listar: (params = '') => api.get(`/categorias/${params}`),
  criar: (data) => api.post('/categorias/', data),
  buscar: (id) => api.get(`/categorias/${id}/`),
  atualizar: (id, data) => api.put(`/categorias/${id}/`, data),
  deletar: (id) => api.delete(`/categorias/${id}/`),
};

// =============================================
// DASHBOARD API
// =============================================

export const dashboardAPI = {
  stats: () => api.get('/dashboard/stats/'),
  graficoVendas: (dias = 30) => api.get(`/dashboard/grafico-vendas/?dias=${dias}`),
  graficoProdutos: (limite = 10) => api.get(`/dashboard/grafico-produtos/?limite=${limite}`),
  graficoCategorias: () => api.get('/dashboard/grafico-categorias/'),
};

// =============================================
// RELATÓRIOS API
// =============================================

export const relatoriosAPI = {
  // Listar relatórios disponíveis
  listar: () => api.get('/relatorios/'),
  
  // Gerar PDFs (retorna blob para download)
  gerarVendasPDF: (filtros = {}) => {
    const params = new URLSearchParams(filtros).toString();
    return api.get(`/relatorios/vendas/pdf/?${params}`, {
      responseType: 'blob', // Importante para PDFs
    });
  },
  
  gerarEstoquePDF: (filtros = {}) => {
    const params = new URLSearchParams(filtros).toString();
    return api.get(`/relatorios/estoque/pdf/?${params}`, {
      responseType: 'blob',
    });
  },
};

// =============================================
// UTILITY FUNCTIONS PARA PDFs
// =============================================

export const downloadPDF = (blob, filename) => {
  /**
   * Função utilitária para fazer download de PDFs
   * @param {Blob} blob - Blob do PDF retornado pela API
   * @param {string} filename - Nome do arquivo para download
   */
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// =============================================
// INTERCEPTORS PARA TRATAMENTO DE ERROS
// =============================================

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Adicionar token de autenticação se necessário
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Tratamento global de erros
    if (error.response?.status === 401) {
      // Redirecionar para login se necessário
      // window.location.href = '/login';
    } else if (error.response?.status === 404) {
      console.error('Recurso não encontrado');
    } else if (error.response?.status >= 500) {
      console.error('Erro interno do servidor');
    }
    
    return Promise.reject(error);
  }
);

export default api;