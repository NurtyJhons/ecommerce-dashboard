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
]

# ==========================================
# ROTAS DISPONÍVEIS
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

FILTROS SUPORTADOS:
- /produtos/?ativo=true&categoria=1&busca=nome&estoque_baixo=true
- /vendas/?produto=1&categoria=2&data_inicio=2024-01-01&data_fim=2024-12-31
- /categorias/?ativo=true

FRONTEND REACT:
- Todas essas APIs são consumidas pelo frontend React em localhost:3000
- O React faz requisições HTTP para localhost:8000/api/
"""