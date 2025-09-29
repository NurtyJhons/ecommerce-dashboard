from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Router para ViewSets da API
router = DefaultRouter()
router.register(r'categorias', views.CategoriaViewSet)
router.register(r'produtos', views.ProdutoViewSet, basename='produto')
router.register(r'vendas', views.VendaViewSet, basename='venda')

urlpatterns = [

    path('', include(router.urls)),
    
    # APIs para Dashboard e Gráficos
    path('dashboard/stats/', views.dashboard_stats_api, name='api_dashboard_stats'),
    path('dashboard/grafico-vendas/', views.grafico_vendas_api, name='api_grafico_vendas'),
    path('dashboard/grafico-produtos/', views.grafico_produtos_api, name='api_grafico_produtos'),
    path('dashboard/grafico-categorias/', views.grafico_categorias_api, name='api_grafico_categorias'),
    
    # Relatórios PDF
    path('relatorios/', views.relatorios_disponiveis_api, name='relatorios_disponiveis'),
    path('relatorios/vendas/pdf/', views.relatorio_vendas_pdf, name='relatorio_vendas_pdf'),
    path('relatorios/estoque/pdf/', views.relatorio_estoque_pdf, name='relatorio_estoque_pdf'),
    
    # Configurações da loja
    path('configuracoes/', views.configuracoes_loja_api, name='configuracoes_loja'),
    
    # ViaCEP
    path('cep/<str:cep>/', views.buscar_cep_api, name='buscar_cep'),
    path('teste-viacep/', views.teste_viacep_api, name='teste_viacep'),
]
