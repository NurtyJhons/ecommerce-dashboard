from django.contrib import admin
from django.db.models import Sum, Count
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
import datetime

from .models import Categoria, Produto, Venda, RelatorioVendas


# =============================================
# CATEGORIA ADMIN
# =============================================

@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    """Administração de Categorias"""
    list_display = ['nome', 'produtos_count', 'ativo', 'criado_em']
    list_filter = ['ativo', 'criado_em']
    search_fields = ['nome', 'descricao']
    list_editable = ['ativo']
    ordering = ['nome']
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('nome', 'descricao')
        }),
        ('Configurações', {
            'fields': ('ativo',)
        }),
    )
    
    def produtos_count(self, obj):
        """Conta produtos ativos da categoria"""
        count = obj.produtos.filter(ativo=True).count()
        if count > 0:
            url = reverse('admin:dashboard_produto_changelist') + f'?categoria__id__exact={obj.id}'
            return format_html('<a href="{}">{} produtos</a>', url, count)
        return '0 produtos'
    produtos_count.short_description = 'Produtos'
    produtos_count.admin_order_field = 'produtos__count'


# =============================================
# PRODUTO ADMIN
# =============================================

class VendaInline(admin.TabularInline):
    """Inline para mostrar vendas do produto"""
    model = Venda
    extra = 0
    readonly_fields = ['valor_total', 'data_venda']
    fields = ['quantidade', 'preco_unitario', 'valor_total', 'data_venda', 'observacoes']
    
    def has_add_permission(self, request, obj=None):
        return False  # Não permitir adicionar vendas diretamente aqui


@admin.register(Produto)
class ProdutoAdmin(admin.ModelAdmin):
    """Administração de Produtos"""
    list_display = [
        'nome', 'categoria', 'preco_formatado', 'estoque_status', 
        'total_vendido', 'ativo', 'criado_em'
    ]
    list_filter = [
        'ativo', 'categoria', 'criado_em', 
        ('estoque', admin.EmptyFieldListFilter),
    ]
    search_fields = ['nome', 'descricao', 'categoria__nome']
    list_editable = ['ativo']
    ordering = ['-criado_em']
    
    fieldsets = (
        ('Informações do Produto', {
            'fields': ('nome', 'descricao', 'categoria')
        }),
        ('Preço e Estoque', {
            'fields': ('preco', 'estoque'),
            'classes': ('wide',)
        }),
        ('Configurações', {
            'fields': ('ativo',)
        }),
        ('Informações do Sistema', {
            'fields': ('criado_em', 'atualizado_em'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['criado_em', 'atualizado_em']
    inlines = [VendaInline]
    
    # Filtros personalizados
    def get_queryset(self, request):
        """Otimiza queries com select_related"""
        return super().get_queryset(request).select_related('categoria').annotate(
            vendas_count=Count('vendas'),
            vendas_total=Sum('vendas__quantidade')
        )
    
    def preco_formatado(self, obj):
        """Formata o preço com símbolo de moeda"""
        return f'R$ {obj.preco:,.2f}'.replace(',', 'X').replace('.', ',').replace('X', '.')
    preco_formatado.short_description = 'Preço'
    preco_formatado.admin_order_field = 'preco'
    
    def estoque_status(self, obj):
        """Mostra o status do estoque com cores"""
        if obj.estoque == 0:
            return format_html(
                '<span style="color: red; font-weight: bold;">SEM ESTOQUE</span>'
            )
        elif obj.estoque_baixo:
            return format_html(
                '<span style="color: orange; font-weight: bold;">{} (BAIXO)</span>',
                obj.estoque
            )
        else:
            return format_html(
                '<span style="color: green;">{}</span>',
                obj.estoque
            )
    estoque_status.short_description = 'Estoque'
    estoque_status.admin_order_field = 'estoque'
    
    def total_vendido(self, obj):
        """Mostra total vendido do produto"""
        total = obj.vendas_total or 0
        if total > 0:
            return format_html('<strong>{}</strong> unidades', total)
        return '0 unidades'
    total_vendido.short_description = 'Total Vendido'
    total_vendido.admin_order_field = 'vendas_total'
    
    # Actions personalizadas
    actions = ['marcar_ativo', 'marcar_inativo', 'ajustar_estoque']
    
    def marcar_ativo(self, request, queryset):
        """Marca produtos como ativos"""
        updated = queryset.update(ativo=True)
        self.message_user(request, f'{updated} produtos marcados como ativos.')
    marcar_ativo.short_description = "Marcar selecionados como ativos"
    
    def marcar_inativo(self, request, queryset):
        """Marca produtos como inativos"""
        updated = queryset.update(ativo=False)
        self.message_user(request, f'{updated} produtos marcados como inativos.')
    marcar_inativo.short_description = "Marcar selecionados como inativos"


# =============================================
# VENDA ADMIN
# =============================================

@admin.register(Venda)
class VendaAdmin(admin.ModelAdmin):
    """Administração de Vendas"""
    list_display = [
        'id', 'produto', 'categoria_produto', 'quantidade', 
        'preco_unitario_formatado', 'valor_total_formatado', 'data_venda'
    ]
    list_filter = [
        'data_venda', 'produto__categoria', 
        ('produto', admin.RelatedOnlyFieldListFilter),
    ]
    search_fields = ['produto__nome', 'produto__categoria__nome', 'observacoes']
    ordering = ['-data_venda']
    date_hierarchy = 'data_venda'
    
    fieldsets = (
        ('Informações da Venda', {
            'fields': ('produto', 'quantidade', 'preco_unitario')
        }),
        ('Valores Calculados', {
            'fields': ('valor_total',),
            'classes': ('collapse',)
        }),
        ('Observações', {
            'fields': ('observacoes',)
        }),
        ('Informações do Sistema', {
            'fields': ('data_venda',),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['valor_total', 'data_venda']
    
    def get_queryset(self, request):
        """Otimiza queries"""
        return super().get_queryset(request).select_related(
            'produto', 'produto__categoria'
        )
    
    def categoria_produto(self, obj):
        """Mostra a categoria do produto"""
        return obj.produto.categoria.nome
    categoria_produto.short_description = 'Categoria'
    categoria_produto.admin_order_field = 'produto__categoria__nome'
    
    def preco_unitario_formatado(self, obj):
        """Formata preço unitário"""
        return f'R$ {obj.preco_unitario:,.2f}'.replace(',', 'X').replace('.', ',').replace('X', '.')
    preco_unitario_formatado.short_description = 'Preço Unit.'
    preco_unitario_formatado.admin_order_field = 'preco_unitario'
    
    def valor_total_formatado(self, obj):
        """Formata valor total"""
        return f'R$ {obj.valor_total:,.2f}'.replace(',', 'X').replace('.', ',').replace('X', '.')
    valor_total_formatado.short_description = 'Valor Total'
    valor_total_formatado.admin_order_field = 'valor_total'
    
    # Actions personalizadas
    actions = ['exportar_vendas']
    
    def exportar_vendas(self, request, queryset):
        """Exporta vendas selecionadas (placeholder)"""
        count = queryset.count()
        self.message_user(request, f'Exportação de {count} vendas preparada.')
    exportar_vendas.short_description = "Exportar vendas selecionadas"


# =============================================
# RELATÓRIO VENDAS ADMIN
# =============================================

@admin.register(RelatorioVendas)
class RelatorioVendasAdmin(admin.ModelAdmin):
    """Administração de Relatórios de Vendas"""
    list_display = [
        'data', 'total_vendas_formatado', 'quantidade_vendas', 
        'produtos_vendidos', 'ticket_medio'
    ]
    list_filter = ['data']
    ordering = ['-data']
    date_hierarchy = 'data'
    
    def has_add_permission(self, request):
        """Não permite adicionar relatórios manualmente"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Não permite editar relatórios"""
        return False
    
    def total_vendas_formatado(self, obj):
        """Formata total de vendas"""
        return f'R$ {obj.total_vendas:,.2f}'.replace(',', 'X').replace('.', ',').replace('X', '.')
    total_vendas_formatado.short_description = 'Total Vendas'
    total_vendas_formatado.admin_order_field = 'total_vendas'
    
    def ticket_medio(self, obj):
        """Calcula ticket médio"""
        if obj.quantidade_vendas > 0:
            ticket = obj.total_vendas / obj.quantidade_vendas
            return f'R$ {ticket:,.2f}'.replace(',', 'X').replace('.', ',').replace('X', '.')
        return 'R$ 0,00'
    ticket_medio.short_description = 'Ticket Médio'


# =============================================
# CUSTOMIZAÇÕES DO ADMIN SITE
# =============================================

# Personalizar o admin site
admin.site.site_header = "E-commerce Dashboard"
admin.site.site_title = "E-commerce Admin"
admin.site.index_title = "Painel Administrativo"

# Adicionar CSS customizado (opcional)
class AdminConfig:
    """Configurações extras do admin"""
    
    class Media:
        css = {
            'all': ('admin/css/custom_admin.css',)
        }
        js = ('admin/js/custom_admin.js',)


# =============================================
# FILTROS PERSONALIZADOS
# =============================================

class EstoqueBaixoFilter(admin.SimpleListFilter):
    """Filtro para produtos com estoque baixo"""
    title = 'Status do Estoque'
    parameter_name = 'estoque_status'
    
    def lookups(self, request, model_admin):
        return (
            ('baixo', 'Estoque Baixo (< 10)'),
            ('zerado', 'Sem Estoque'),
            ('ok', 'Estoque OK'),
        )
    
    def queryset(self, request, queryset):
        if self.value() == 'baixo':
            return queryset.filter(estoque__lt=10, estoque__gt=0)
        if self.value() == 'zerado':
            return queryset.filter(estoque=0)
        if self.value() == 'ok':
            return queryset.filter(estoque__gte=10)


class VendasHojeFilter(admin.SimpleListFilter):
    """Filtro para vendas de hoje"""
    title = 'Período da Venda'
    parameter_name = 'periodo'
    
    def lookups(self, request, model_admin):
        return (
            ('hoje', 'Hoje'),
            ('semana', 'Esta Semana'),
            ('mes', 'Este Mês'),
        )
    
    def queryset(self, request, queryset):
        hoje = datetime.date.today()
        
        if self.value() == 'hoje':
            return queryset.filter(data_venda__date=hoje)
        if self.value() == 'semana':
            inicio_semana = hoje - datetime.timedelta(days=hoje.weekday())
            return queryset.filter(data_venda__date__gte=inicio_semana)
        if self.value() == 'mes':
            inicio_mes = hoje.replace(day=1)
            return queryset.filter(data_venda__date__gte=inicio_mes)


# Adicionar filtros personalizados aos models
ProdutoAdmin.list_filter.append(EstoqueBaixoFilter)
VendaAdmin.list_filter.append(VendasHojeFilter)