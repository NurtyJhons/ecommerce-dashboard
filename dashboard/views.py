from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages
from django.http import JsonResponse, HttpResponse 
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import datetime, timedelta
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.core.paginator import Paginator
from django.template.loader import render_to_string
from weasyprint import HTML, CSS
import os

from .models import Categoria, Produto, Venda, RelatorioVendas
from .serializers import (
    CategoriaSerializer, ProdutoListSerializer, ProdutoDetailSerializer,
    VendaListSerializer, VendaDetailSerializer, RelatorioVendasSerializer,
    DashboardStatsSerializer, GraficoVendasSerializer, GraficoProdutosSerializer,
    GraficoCategoriaSerializer
)


# =============================================
# VIEWS PARA TEMPLATES (Frontend HTML)
# =============================================

def dashboard_view(request):
    """Página principal do dashboard"""
    hoje = timezone.now().date()
    inicio_mes = hoje.replace(day=1)
    
    # Estatísticas básicas
    stats = {
        'total_produtos': Produto.objects.filter(ativo=True).count(),
        'produtos_estoque_baixo': Produto.objects.filter(ativo=True, estoque__lt=10).count(),
        'vendas_hoje': Venda.objects.filter(data_venda__date=hoje).count(),
        'valor_hoje': Venda.objects.filter(data_venda__date=hoje).aggregate(
            total=Sum('valor_total'))['total'] or 0,
        'vendas_mes': Venda.objects.filter(data_venda__date__gte=inicio_mes).count(),
        'valor_mes': Venda.objects.filter(data_venda__date__gte=inicio_mes).aggregate(
            total=Sum('valor_total'))['total'] or 0,
    }
    
    # Produtos com estoque baixo
    produtos_estoque_baixo = Produto.objects.filter(
        ativo=True, estoque__lt=10
    ).order_by('estoque')[:5]
    
    # Vendas recentes
    vendas_recentes = Venda.objects.select_related('produto', 'produto__categoria').order_by('-data_venda')[:10]
    
    context = {
        'stats': stats,
        'produtos_estoque_baixo': produtos_estoque_baixo,
        'vendas_recentes': vendas_recentes,
    }
    
    return render(request, 'dashboard/dashboard.html', context)


def produtos_lista_view(request):
    """Lista de produtos com filtros"""
    produtos = Produto.objects.select_related('categoria').filter(ativo=True)
    
    # Filtros
    categoria_id = request.GET.get('categoria')
    busca = request.GET.get('busca')
    estoque_baixo = request.GET.get('estoque_baixo')
    
    if categoria_id:
        produtos = produtos.filter(categoria_id=categoria_id)
    
    if busca:
        produtos = produtos.filter(
            Q(nome__icontains=busca) | Q(descricao__icontains=busca)
        )
    
    if estoque_baixo:
        produtos = produtos.filter(estoque__lt=10)
    
    produtos = produtos.order_by('-criado_em')
    
    # Paginação
    paginator = Paginator(produtos, 15)
    page = request.GET.get('page')
    produtos_page = paginator.get_page(page)
    
    # Categorias para o filtro
    categorias = Categoria.objects.filter(ativo=True).order_by('nome')
    
    context = {
        'produtos': produtos_page,
        'categorias': categorias,
        'filtros': {
            'categoria': categoria_id,
            'busca': busca,
            'estoque_baixo': estoque_baixo,
        }
    }
    
    return render(request, 'dashboard/produtos_lista.html', context)


def produto_cadastro_view(request, produto_id=None):
    """Cadastro/edição de produto"""
    produto = get_object_or_404(Produto, id=produto_id) if produto_id else None
    categorias = Categoria.objects.filter(ativo=True).order_by('nome')
    
    if request.method == 'POST':
        try:
            nome = request.POST.get('nome')
            descricao = request.POST.get('descricao', '')
            preco = float(request.POST.get('preco'))
            estoque = int(request.POST.get('estoque'))
            categoria_id = request.POST.get('categoria')
            
            categoria = get_object_or_404(Categoria, id=categoria_id)
            
            if produto:
                # Atualizar produto existente
                produto.nome = nome
                produto.descricao = descricao
                produto.preco = preco
                produto.estoque = estoque
                produto.categoria = categoria
                produto.save()
                messages.success(request, 'Produto atualizado com sucesso!')
            else:
                # Criar novo produto
                produto = Produto.objects.create(
                    nome=nome,
                    descricao=descricao,
                    preco=preco,
                    estoque=estoque,
                    categoria=categoria
                )
                messages.success(request, 'Produto cadastrado com sucesso!')
            
            return redirect('produtos_lista')
            
        except Exception as e:
            messages.error(request, f'Erro ao salvar produto: {str(e)}')
    
    context = {
        'produto': produto,
        'categorias': categorias,
    }
    
    return render(request, 'dashboard/produtos_cadastro.html', context)


def vendas_lista_view(request):
    """Lista de vendas com filtros"""
    vendas = Venda.objects.select_related('produto', 'produto__categoria')
    
    # Filtros
    produto_id = request.GET.get('produto')
    categoria_id = request.GET.get('categoria')
    data_inicio = request.GET.get('data_inicio')
    data_fim = request.GET.get('data_fim')
    
    if produto_id:
        vendas = vendas.filter(produto_id=produto_id)
    
    if categoria_id:
        vendas = vendas.filter(produto__categoria_id=categoria_id)
    
    if data_inicio:
        vendas = vendas.filter(data_venda__date__gte=data_inicio)
    
    if data_fim:
        vendas = vendas.filter(data_venda__date__lte=data_fim)
    
    vendas = vendas.order_by('-data_venda')
    
    # Paginação
    paginator = Paginator(vendas, 15)
    page = request.GET.get('page')
    vendas_page = paginator.get_page(page)
    
    # Dados para filtros
    produtos = Produto.objects.filter(ativo=True).order_by('nome')
    categorias = Categoria.objects.filter(ativo=True).order_by('nome')
    
    # Totais
    total_valor = vendas.aggregate(total=Sum('valor_total'))['total'] or 0
    total_quantidade = vendas.aggregate(total=Sum('quantidade'))['total'] or 0
    
    context = {
        'vendas': vendas_page,
        'produtos': produtos,
        'categorias': categorias,
        'total_valor': total_valor,
        'total_quantidade': total_quantidade,
        'filtros': {
            'produto': produto_id,
            'categoria': categoria_id,
            'data_inicio': data_inicio,
            'data_fim': data_fim,
        }
    }
    
    return render(request, 'dashboard/vendas_lista.html', context)


def venda_cadastro_view(request, venda_id=None):
    """Cadastro/edição de venda"""
    venda = get_object_or_404(Venda, id=venda_id) if venda_id else None
    produtos = Produto.objects.filter(ativo=True, estoque__gt=0).order_by('nome')
    
    if request.method == 'POST':
        try:
            produto_id = request.POST.get('produto')
            quantidade = int(request.POST.get('quantidade'))
            preco_unitario = request.POST.get('preco_unitario')
            observacoes = request.POST.get('observacoes', '')
            
            produto = get_object_or_404(Produto, id=produto_id)
            
            # Se não informou preço unitário, usar o preço atual do produto
            if not preco_unitario:
                preco_unitario = produto.preco
            else:
                preco_unitario = float(preco_unitario)
            
            if venda:
                # Editar venda existente (restaura estoque anterior)
                produto_anterior = venda.produto
                produto_anterior.estoque += venda.quantidade
                produto_anterior.save()
                
                venda.produto = produto
                venda.quantidade = quantidade
                venda.preco_unitario = preco_unitario
                venda.observacoes = observacoes
                venda.save()
                messages.success(request, 'Venda atualizada com sucesso!')
            else:
                # Nova venda
                if produto.estoque < quantidade:
                    raise ValueError(f'Estoque insuficiente. Disponível: {produto.estoque}')
                
                venda = Venda.objects.create(
                    produto=produto,
                    quantidade=quantidade,
                    preco_unitario=preco_unitario,
                    observacoes=observacoes
                )
                messages.success(request, 'Venda registrada com sucesso!')
            
            return redirect('vendas_lista')
            
        except Exception as e:
            messages.error(request, f'Erro ao registrar venda: {str(e)}')
    
    context = {
        'venda': venda,
        'produtos': produtos,
    }
    
    return render(request, 'dashboard/vendas_cadastro.html', context)


# =============================================
# API VIEWSETS (Django Rest Framework)
# =============================================

class CategoriaViewSet(viewsets.ModelViewSet):
    """ViewSet para CRUD de Categorias"""
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        queryset = Categoria.objects.all()
        ativo = self.request.query_params.get('ativo')
        if ativo is not None:
            queryset = queryset.filter(ativo=ativo.lower() == 'true')
        return queryset.order_by('nome')


class ProdutoViewSet(viewsets.ModelViewSet):
    """ViewSet para CRUD de Produtos"""
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        queryset = Produto.objects.select_related('categoria')
        
        # Filtros
        ativo = self.request.query_params.get('ativo')
        categoria = self.request.query_params.get('categoria')
        estoque_baixo = self.request.query_params.get('estoque_baixo')
        busca = self.request.query_params.get('busca')
        
        if ativo is not None:
            queryset = queryset.filter(ativo=ativo.lower() == 'true')
        
        if categoria:
            queryset = queryset.filter(categoria_id=categoria)
        
        if estoque_baixo and estoque_baixo.lower() == 'true':
            queryset = queryset.filter(estoque__lt=10)
        
        if busca:
            queryset = queryset.filter(
                Q(nome__icontains=busca) | Q(descricao__icontains=busca)
            )
        
        return queryset.order_by('-criado_em')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProdutoListSerializer
        return ProdutoDetailSerializer
    
    @action(detail=False, methods=['get'])
    def estoque_baixo(self, request):
        """Retorna produtos com estoque baixo"""
        produtos = self.get_queryset().filter(estoque__lt=10)
        serializer = self.get_serializer(produtos, many=True)
        return Response(serializer.data)


class VendaViewSet(viewsets.ModelViewSet):
    """ViewSet para CRUD de Vendas"""
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        queryset = Venda.objects.select_related('produto', 'produto__categoria')
        
        # Filtros
        produto = self.request.query_params.get('produto')
        categoria = self.request.query_params.get('categoria')
        data_inicio = self.request.query_params.get('data_inicio')
        data_fim = self.request.query_params.get('data_fim')
        
        if produto:
            queryset = queryset.filter(produto_id=produto)
        
        if categoria:
            queryset = queryset.filter(produto__categoria_id=categoria)
        
        if data_inicio:
            queryset = queryset.filter(data_venda__date__gte=data_inicio)
        
        if data_fim:
            queryset = queryset.filter(data_venda__date__lte=data_fim)
        
        return queryset.order_by('-data_venda')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return VendaListSerializer
        return VendaDetailSerializer


# =============================================
# VIEWS AJAX AUXILIARES
# =============================================

@api_view(['GET'])
def ajax_produto_detalhes(request, produto_id):
    """Retorna detalhes do produto via AJAX"""
    try:
        produto = get_object_or_404(Produto, id=produto_id)
        data = {
            'id': produto.id,
            'nome': produto.nome,
            'preco': float(produto.preco),
            'estoque': produto.estoque,
            'categoria': produto.categoria.nome,
            'disponivel': produto.disponivel,
            'estoque_baixo': produto.estoque_baixo,
        }
        return JsonResponse(data)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@api_view(['GET'])
def ajax_produtos_buscar(request):
    """Busca produtos via AJAX para autocomplete"""
    busca = request.GET.get('q', '')
    if len(busca) < 2:
        return JsonResponse({'produtos': []})
    
    produtos = Produto.objects.filter(
        nome__icontains=busca,
        ativo=True
    ).values('id', 'nome', 'preco', 'estoque')[:10]
    
    return JsonResponse({'produtos': list(produtos)})


@api_view(['POST'])
def ajax_verificar_estoque(request):
    """Verifica estoque disponível via AJAX"""
    try:
        produto_id = request.data.get('produto_id')
        quantidade = int(request.data.get('quantidade', 0))
        
        produto = get_object_or_404(Produto, id=produto_id)
        
        data = {
            'disponivel': produto.estoque >= quantidade,
            'estoque_atual': produto.estoque,
            'produto_nome': produto.nome,
            'preco': float(produto.preco),
        }
        
        if produto.estoque < quantidade:
            data['erro'] = f'Estoque insuficiente. Disponível: {produto.estoque}'
        
        return JsonResponse(data)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


# =============================================
# API VIEWS PARA DASHBOARD E GRÁFICOS
# =============================================

@api_view(['GET'])
def dashboard_stats_api(request):
    """API para estatísticas do dashboard"""
    hoje = timezone.now().date()
    inicio_mes = hoje.replace(day=1)
    
    # Estatísticas básicas
    total_produtos = Produto.objects.filter(ativo=True).count()
    produtos_ativos = Produto.objects.filter(ativo=True).count()
    produtos_estoque_baixo = Produto.objects.filter(ativo=True, estoque__lt=10).count()
    
    # Vendas hoje
    vendas_hoje = Venda.objects.filter(data_venda__date=hoje).aggregate(
        total=Sum('valor_total'),
        quantidade=Count('id')
    )
    
    # Vendas do mês
    vendas_mes = Venda.objects.filter(data_venda__date__gte=inicio_mes).aggregate(
        total=Sum('valor_total'),
        quantidade=Count('id')
    )
    
    # Produto mais vendido
    produto_mais_vendido = Venda.objects.values('produto__nome').annotate(
        total=Sum('quantidade')
    ).order_by('-total').first()
    
    # Categoria mais vendida
    categoria_mais_vendida = Venda.objects.values('produto__categoria__nome').annotate(
        total=Sum('quantidade')
    ).order_by('-total').first()
    
    stats = {
        'total_produtos': total_produtos,
        'produtos_ativos': produtos_ativos,
        'produtos_estoque_baixo': produtos_estoque_baixo,
        'total_vendas_hoje': vendas_hoje['total'] or 0,
        'total_vendas_mes': vendas_mes['total'] or 0,
        'quantidade_vendas_hoje': vendas_hoje['quantidade'] or 0,
        'quantidade_vendas_mes': vendas_mes['quantidade'] or 0,
        'produto_mais_vendido': produto_mais_vendido['produto__nome'] if produto_mais_vendido else 'N/A',
        'categoria_mais_vendida': categoria_mais_vendida['produto__categoria__nome'] if categoria_mais_vendida else 'N/A',
    }
    
    serializer = DashboardStatsSerializer(stats)
    return Response(serializer.data)


@api_view(['GET'])
def grafico_vendas_api(request):
    """API para dados do gráfico de vendas"""
    dias = int(request.GET.get('dias', 30))
    data_inicio = timezone.now().date() - timedelta(days=dias)
    
    vendas_por_data = Venda.objects.filter(
        data_venda__date__gte=data_inicio
    ).extra(
        select={'data': 'DATE(data_venda)'}
    ).values('data').annotate(
        total_vendas=Sum('valor_total'),
        quantidade_vendas=Count('id')
    ).order_by('data')
    
    serializer = GraficoVendasSerializer(vendas_por_data, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def grafico_produtos_api(request):
    """API para dados do gráfico de produtos mais vendidos"""
    limite = int(request.GET.get('limite', 10))
    
    produtos_vendidos = Venda.objects.values(
        'produto__nome',
        'produto__categoria__nome'
    ).annotate(
        total_vendido=Sum('quantidade'),
        valor_total=Sum('valor_total'),
        estoque_atual=Sum('produto__estoque')
    ).order_by('-total_vendido')[:limite]
    
    # Renomear campos para o serializer
    dados_formatados = []
    for item in produtos_vendidos:
        dados_formatados.append({
            'nome': item['produto__nome'],
            'categoria': item['produto__categoria__nome'],
            'total_vendido': item['total_vendido'],
            'valor_total': item['valor_total'],
            'estoque_atual': item['estoque_atual']
        })
    
    serializer = GraficoProdutosSerializer(dados_formatados, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def grafico_categorias_api(request):
    """API para dados do gráfico por categorias"""
    categorias_vendas = Venda.objects.values(
        'produto__categoria__nome'
    ).annotate(
        total_produtos=Count('produto', distinct=True),
        total_vendas=Sum('valor_total'),
        quantidade_vendida=Sum('quantidade')
    ).order_by('-total_vendas')
    
    # Renomear campos para o serializer
    dados_formatados = []
    for item in categorias_vendas:
        dados_formatados.append({
            'categoria': item['produto__categoria__nome'],
            'total_produtos': item['total_produtos'],
            'total_vendas': item['total_vendas'],
            'quantidade_vendida': item['quantidade_vendida']
        })
    
    serializer = GraficoCategoriaSerializer(dados_formatados, many=True)
    return Response(serializer.data)

# =============================================
# RELATÓRIO DE VENDAS PDF (WEASYPRINT)
# =============================================

@api_view(['GET'])
def relatorio_vendas_pdf(request):
    """Gera relatório de vendas em PDF usando WeasyPrint"""
    try:
        # Parâmetros de filtro
        data_inicio = request.GET.get('data_inicio')
        data_fim = request.GET.get('data_fim')
        categoria_id = request.GET.get('categoria')
        produto_id = request.GET.get('produto')
        
        # Filtros padrão (últimos 30 dias se não especificado)
        if not data_inicio:
            data_inicio = (timezone.now().date() - timedelta(days=30)).strftime('%Y-%m-%d')
        if not data_fim:
            data_fim = timezone.now().date().strftime('%Y-%m-%d')
        
        # Query base
        vendas = Venda.objects.select_related('produto', 'produto__categoria').filter(
            data_venda__date__gte=data_inicio,
            data_venda__date__lte=data_fim
        )
        
        # Aplicar filtros
        if categoria_id:
            vendas = vendas.filter(produto__categoria_id=categoria_id)
        if produto_id:
            vendas = vendas.filter(produto_id=produto_id)
        
        vendas = vendas.order_by('-data_venda')
        
        # Calcular totais
        totais = vendas.aggregate(
            total_valor=Sum('valor_total'),
            total_quantidade=Sum('quantidade'),
            total_vendas=Count('id')
        )
        
        # Top produtos
        top_produtos = vendas.values(
            'produto__nome', 'produto__categoria__nome'
        ).annotate(
            total_vendido=Sum('quantidade'),
            valor_total=Sum('valor_total')
        ).order_by('-valor_total')[:10]
        
        # Preparar contexto
        context = {
            'vendas': vendas,
            'totais': totais,
            'top_produtos': top_produtos,
            'data_inicio': data_inicio,
            'data_fim': data_fim,
            'data_geracao': timezone.now(),
            'filtros': {
                'categoria_id': categoria_id,
                'produto_id': produto_id,
            }
        }
        
        # HTML simples inline (sem template por enquanto)
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Relatório de Vendas</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; }}
                .header {{ text-align: center; margin-bottom: 30px; }}
                .titulo {{ color: #2c3e50; font-size: 24px; font-weight: bold; }}
                .periodo {{ color: #7f8c8d; margin: 10px 0; }}
                .resumo {{ background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }}
                .resumo h3 {{ color: #495057; margin-top: 0; }}
                .stat {{ display: inline-block; margin: 10px 20px; text-align: center; }}
                .stat-valor {{ font-size: 18px; font-weight: bold; color: #28a745; }}
                .stat-label {{ font-size: 12px; color: #6c757d; }}
                table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
                th, td {{ border: 1px solid #dee2e6; padding: 8px; text-align: left; }}
                th {{ background-color: #e9ecef; font-weight: bold; }}
                .text-right {{ text-align: right; }}
                .text-center {{ text-align: center; }}
            </style>
        </head>
        <body>
            <div class="header">
                <div class="titulo">🛒 Relatório de Vendas</div>
                <div class="periodo">Período: {data_inicio} até {data_fim}</div>
                <div class="periodo">Gerado em: {timezone.now().strftime('%d/%m/%Y %H:%M')}</div>
            </div>
            
            <div class="resumo">
                <h3>Resumo Executivo</h3>
                <div class="stat">
                    <div class="stat-valor">{totais['total_vendas'] or 0}</div>
                    <div class="stat-label">Total Vendas</div>
                </div>
                <div class="stat">
                    <div class="stat-valor">R$ {(totais['total_valor'] or 0):,.2f}</div>
                    <div class="stat-label">Faturamento</div>
                </div>
                <div class="stat">
                    <div class="stat-valor">{totais['total_quantidade'] or 0}</div>
                    <div class="stat-label">Itens Vendidos</div>
                </div>
                <div class="stat">
                    <div class="stat-valor">R$ {((totais['total_valor'] or 0) / max(totais['total_vendas'] or 1, 1)):,.2f}</div>
                    <div class="stat-label">Ticket Médio</div>
                </div>
            </div>
            
            <h3>Detalhes das Vendas</h3>
            <table>
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Produto</th>
                        <th>Categoria</th>
                        <th class="text-center">Qtd</th>
                        <th class="text-right">Preço Unit.</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
        """
        
        # Adicionar linhas das vendas
        for venda in vendas[:100]:  # Limitar a 100 vendas
            html_content += f"""
                    <tr>
                        <td>{venda.data_venda.strftime('%d/%m/%Y')}</td>
                        <td>{venda.produto.nome}</td>
                        <td>{venda.produto.categoria.nome}</td>
                        <td class="text-center">{venda.quantidade}</td>
                        <td class="text-right">R$ {venda.preco_unitario:,.2f}</td>
                        <td class="text-right">R$ {venda.valor_total:,.2f}</td>
                    </tr>
            """
        
        html_content += """
                </tbody>
            </table>
        </body>
        </html>
        """
        
        # Gerar PDF com WeasyPrint
        html = HTML(string=html_content)
        pdf = html.write_pdf()
        
        # Resposta HTTP
        response = HttpResponse(pdf, content_type='application/pdf')
        filename = f'relatorio_vendas_{data_inicio}_{data_fim}.pdf'
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
        
    except Exception as e:
        return Response({
            'error': f'Erro ao gerar relatório: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =============================================
# RELATÓRIO DE ESTOQUE PDF (WEASYPRINT)
# =============================================

@api_view(['GET'])
def relatorio_estoque_pdf(request):
    """Gera relatório de estoque em PDF usando WeasyPrint"""
    try:
        # Parâmetros
        apenas_baixo = request.GET.get('apenas_baixo', 'false').lower() == 'true'
        categoria_id = request.GET.get('categoria')
        
        # Query base
        produtos = Produto.objects.select_related('categoria').filter(ativo=True)
        
        # Filtros
        if apenas_baixo:
            produtos = produtos.filter(estoque__lt=10)
        if categoria_id:
            produtos = produtos.filter(categoria_id=categoria_id)
        
        produtos = produtos.order_by('estoque', 'nome')
        
        # Estatísticas
        stats = {
            'total_produtos': produtos.count(),
            'produtos_sem_estoque': produtos.filter(estoque=0).count(),
            'produtos_estoque_baixo': produtos.filter(estoque__lt=10, estoque__gt=0).count(),
            'produtos_ok': produtos.filter(estoque__gte=10).count(),
        }
        
        # HTML para estoque
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Relatório de Estoque</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; }}
                .header {{ text-align: center; margin-bottom: 30px; }}
                .titulo {{ color: #2c3e50; font-size: 24px; font-weight: bold; }}
                .data {{ color: #7f8c8d; margin: 10px 0; }}
                .resumo {{ background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }}
                .stat {{ display: inline-block; margin: 10px 20px; text-align: center; }}
                .stat-valor {{ font-size: 18px; font-weight: bold; }}
                .stat-label {{ font-size: 12px; color: #6c757d; }}
                .ok {{ color: #28a745; }}
                .baixo {{ color: #ffc107; }}
                .sem {{ color: #dc3545; }}
                table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
                th, td {{ border: 1px solid #dee2e6; padding: 8px; text-align: left; }}
                th {{ background-color: #e9ecef; font-weight: bold; }}
                .text-right {{ text-align: right; }}
                .text-center {{ text-align: center; }}
            </style>
        </head>
        <body>
            <div class="header">
                <div class="titulo">📦 Relatório de Estoque</div>
                <div class="data">Gerado em: {timezone.now().strftime('%d/%m/%Y %H:%M')}</div>
            </div>
            
            <div class="resumo">
                <h3>Resumo do Estoque</h3>
                <div class="stat">
                    <div class="stat-valor">{stats['total_produtos']}</div>
                    <div class="stat-label">Total Produtos</div>
                </div>
                <div class="stat ok">
                    <div class="stat-valor">{stats['produtos_ok']}</div>
                    <div class="stat-label">Estoque OK</div>
                </div>
                <div class="stat baixo">
                    <div class="stat-valor">{stats['produtos_estoque_baixo']}</div>
                    <div class="stat-label">Estoque Baixo</div>
                </div>
                <div class="stat sem">
                    <div class="stat-valor">{stats['produtos_sem_estoque']}</div>
                    <div class="stat-label">Sem Estoque</div>
                </div>
            </div>
            
            <h3>Produtos</h3>
            <table>
                <thead>
                    <tr>
                        <th>Produto</th>
                        <th>Categoria</th>
                        <th class="text-right">Preço</th>
                        <th class="text-center">Estoque</th>
                        <th class="text-center">Status</th>
                    </tr>
                </thead>
                <tbody>
        """
        
        # Adicionar produtos
        for produto in produtos:
            if produto.estoque == 0:
                status_class = 'sem'
                status_text = 'SEM ESTOQUE'
            elif produto.estoque < 10:
                status_class = 'baixo'
                status_text = 'BAIXO'
            else:
                status_class = 'ok'
                status_text = 'OK'
                
            html_content += f"""
                    <tr>
                        <td>{produto.nome}</td>
                        <td>{produto.categoria.nome}</td>
                        <td class="text-right">R$ {produto.preco:,.2f}</td>
                        <td class="text-center">{produto.estoque}</td>
                        <td class="text-center {status_class}">{status_text}</td>
                    </tr>
            """
        
        html_content += """
                </tbody>
            </table>
        </body>
        </html>
        """
        
        # Gerar PDF
        html = HTML(string=html_content)
        pdf = html.write_pdf()
        
        response = HttpResponse(pdf, content_type='application/pdf')
        filename = f'relatorio_estoque_{timezone.now().strftime("%Y%m%d_%H%M%S")}.pdf'
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
        
    except Exception as e:
        return Response({
            'error': f'Erro ao gerar relatório de estoque: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =============================================
# LISTA DE RELATÓRIOS DISPONÍVEIS
# =============================================

@api_view(['GET'])
def relatorios_disponiveis_api(request):
    """Lista todos os relatórios disponíveis"""
    relatorios = [
        {
            'id': 'vendas',
            'nome': 'Relatório de Vendas',
            'descricao': 'Vendas por período com filtros e estatísticas',
            'parametros': ['data_inicio', 'data_fim', 'categoria', 'produto'],
            'url': '/api/relatorios/vendas/pdf/'
        },
        {
            'id': 'estoque',
            'nome': 'Relatório de Estoque',
            'descricao': 'Status do estoque por produto e categoria',
            'parametros': ['apenas_baixo', 'categoria'],
            'url': '/api/relatorios/estoque/pdf/'
        }
    ]
    
    return Response(relatorios)