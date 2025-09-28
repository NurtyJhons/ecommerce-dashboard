from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# =============================================
# ROTAS DA API (Django Rest Framework)
# =============================================

# Router para ViewSets da API
router = DefaultRouter()
router.register(r'categorias', views.CategoriaViewSet)
router.register(r'produtos', views.ProdutoViewSet, basename='produto')
router.register(r'vendas', views.VendaViewSet, basename='venda')

# =============================================
# URLs DO APP DASHBOARD (APENAS API)
# =============================================

urlpatterns = [
    # ==========================================
    # API REST - CRUD ENDPOINTS
    # ==========================================
    
    # Inclui todas as rotas do DRF Router
    # /api/categorias/, /api/produtos/, /api/vendas/
    path('', include(router.urls)),
    
    # ==========================================
    # API DASHBOARD & GRÁFICOS
    # ==========================================
    
    # APIs para Dashboard e Gráficos
    path('dashboard/stats/', views.dashboard_stats_api, name='api_dashboard_stats'),
    path('dashboard/grafico-vendas/', views.grafico_vendas_api, name='api_grafico_vendas'),
    path('dashboard/grafico-produtos/', views.grafico_produtos_api, name='api_grafico_produtos'),
    path('dashboard/grafico-categorias/', views.grafico_categorias_api, name='api_grafico_categorias'),
    
    # ==========================================
    # API RELATÓRIOS
    # ==========================================
    
    # Relatórios PDF
    path('relatorios/', views.relatorios_disponiveis_api, name='relatorios_disponiveis'),
    path('relatorios/vendas/pdf/', views.relatorio_vendas_pdf, name='relatorio_vendas_pdf'),
    path('relatorios/estoque/pdf/', views.relatorio_estoque_pdf, name='relatorio_estoque_pdf'),
    
    # ==========================================
    # API CONFIGURAÇÕES & VIACEP
    # ==========================================
    
    # Configurações da loja
    path('configuracoes/', views.configuracoes_loja_api, name='configuracoes_loja'),
    
    # ViaCEP Integration
    path('cep/<str:cep>/', views.buscar_cep_api, name='buscar_cep'),
    path('teste-viacep/', views.teste_viacep_api, name='teste_viacep'),
]

# ==========================================
# ROTAS DISPONÍVEIS - DOCUMENTAÇÃO
# ==========================================

"""
API Endpoints configurados:

CRUD RESOURCES:
- GET/POST /categorias/ → Listar/Criar categorias
- GET/PUT/PATCH/DELETE /categorias/{id}/ → Detalhes categoria
- GET/POST /produtos/ → Listar/Criar produtos  
- GET/PUT/PATCH/DELETE /produtos/{id}/ → Detalhes produto
- GET/POST /vendas/ → Listar/Criar vendas
- GET/PUT/PATCH/DELETE /vendas/{id}/ → Detalhes venda

ACTIONS ESPECIAIS:
- GET /produtos/estoque_baixo/ → Produtos com estoque baixo

DASHBOARD APIs:
- GET /dashboard/stats/ → Estatísticas gerais do sistema
- GET /dashboard/grafico-vendas/?dias=30 → Dados para gráfico de vendas
- GET /dashboard/grafico-produtos/?limite=10 → Top produtos mais vendidos  
- GET /dashboard/grafico-categorias/ → Vendas agrupadas por categoria

RELATÓRIOS APIs:
- GET /relatorios/ → Lista de relatórios disponíveis
- GET /relatorios/vendas/pdf/ → Gerar PDF de vendas
- GET /relatorios/estoque/pdf/ → Gerar PDF de estoque

CONFIGURAÇÕES APIs:
- GET /configuracoes/ → Obter configurações da loja
- PUT /configuracoes/ → Atualizar configurações da loja

VIACEP APIs:
- GET /cep/{cep}/ → Buscar endereço por CEP (ex: /cep/01310-100/)
- GET /teste-viacep/ → Testar integração ViaCEP

FILTROS SUPORTADOS:
- /produtos/?ativo=true&categoria=1&busca=nome&estoque_baixo=true
- /vendas/?produto=1&categoria=2&data_inicio=2024-01-01&data_fim=2024-12-31
- /categorias/?ativo=true

FRONTEND REACT:
- Todas essas APIs são consumidas pelo frontend React em localhost:3000
- O React faz requisições HTTP para localhost:8000/api/
"""