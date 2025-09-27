"""
URLs principais do projeto E-commerce Dashboard
Configurado para API + Frontend React separado
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

# View para API root
def api_root(request):
    """Endpoint raiz da API com informações básicas"""
    return JsonResponse({
        'projeto': 'E-commerce Dashboard API',
        'versao': '1.0',
        'frontend': 'React (http://localhost:3000)',
        'backend': 'Django REST API',
        'endpoints': {
            'admin': '/admin/',
            'api_root': '/api/',
            'produtos': '/api/produtos/',
            'vendas': '/api/vendas/',
            'categorias': '/api/categorias/',
            'dashboard': '/api/dashboard/',
        },
        'dashboard_apis': {
            'stats': '/api/dashboard/stats/',
            'grafico_vendas': '/api/dashboard/grafico-vendas/',
            'grafico_produtos': '/api/dashboard/grafico-produtos/',
            'grafico_categorias': '/api/dashboard/grafico-categorias/',
        },
        'documentacao': {
            'browsable_api': '/api/ (navegue pelas URLs)',
            'admin': '/admin/',
        }
    })

urlpatterns = [
    # ==========================================
    # ADMINISTRAÇÃO DJANGO
    # ==========================================
    path('admin/', admin.site.urls),
    
    # ==========================================
    # API ENDPOINTS
    # ==========================================
    # Root da API com informações
    path('api/', api_root, name='api_root'),
    
    # URLs do app dashboard (todas as rotas da API)
    path('api/', include('dashboard.urls')),
    
    # ==========================================
    # DJANGO REST FRAMEWORK
    # ==========================================
    # API browsable interface (para desenvolvimento)
    path('api-auth/', include('rest_framework.urls')),
]

# ==========================================
# CONFIGURAÇÕES PARA DESENVOLVIMENTO
# ==========================================
if settings.DEBUG:
    # Servir arquivos de media em desenvolvimento
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    
    # Adicionar Django Debug Toolbar se estiver instalado
    try:
        import debug_toolbar
        urlpatterns = [
            path('__debug__/', include(debug_toolbar.urls)),
        ] + urlpatterns
    except ImportError:
        pass

# ==========================================
# CUSTOMIZAÇÃO DO ADMIN
# ==========================================
admin.site.site_header = "E-commerce Dashboard - API Admin"
admin.site.site_title = "E-commerce API Admin"
admin.site.index_title = "Administração da API"

# ==========================================
# INFORMAÇÕES DA API
# ==========================================
"""
API Endpoints disponíveis:

ADMINISTRAÇÃO:
- /admin/ → Django Admin Interface

API ROOT:
- /api/ → Informações da API

RECURSOS PRINCIPAIS:
- GET/POST /api/produtos/ → CRUD Produtos
- GET/POST /api/vendas/ → CRUD Vendas  
- GET/POST /api/categorias/ → CRUD Categorias

DASHBOARD & ANALYTICS:
- GET /api/dashboard/stats/ → Estatísticas gerais
- GET /api/dashboard/grafico-vendas/?dias=30 → Dados para gráficos
- GET /api/dashboard/grafico-produtos/?limite=10 → Top produtos
- GET /api/dashboard/grafico-categorias/ → Vendas por categoria

FILTROS DISPONÍVEIS:
- /api/produtos/?ativo=true&categoria=1&busca=nome&estoque_baixo=true
- /api/vendas/?produto=1&categoria=2&data_inicio=2024-01-01&data_fim=2024-12-31

AÇÕES ESPECIAIS:
- GET /api/produtos/estoque_baixo/ → Produtos com estoque baixo

DESENVOLVIMENTO:
- /api-auth/ → Autenticação DRF
- /__debug__/ → Debug toolbar (se instalado)

FRONTEND REACT:
- http://localhost:3000 → Interface React
- Comunica com esta API via axios
"""