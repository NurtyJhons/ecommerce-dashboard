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
    path('admin/', admin.site.urls),
    
    path('api/', api_root, name='api_root'),
    
    # URLs do app dashboard (todas as rotas da API)
    path('api/', include('dashboard.urls')),
    
    path('api-auth/', include('rest_framework.urls')),
]

if settings.DEBUG:
    # Servir arquivos de media em desenvolvimento
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    
    try:
        import debug_toolbar
        urlpatterns = [
            path('__debug__/', include(debug_toolbar.urls)),
        ] + urlpatterns
    except ImportError:
        pass

admin.site.site_header = "E-commerce Dashboard - API Admin"
admin.site.site_title = "E-commerce API Admin"
admin.site.index_title = "Administração da API"
