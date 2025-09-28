from rest_framework import serializers
from django.db import transaction
from decimal import Decimal
from .models import Categoria, Produto, Venda, RelatorioVendas, ConfiguracaoLoja

class CategoriaSerializer(serializers.ModelSerializer):
    """Serializer para o modelo Categoria"""
    produtos_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Categoria
        fields = ['id', 'nome', 'descricao', 'ativo', 'criado_em', 'produtos_count']
        read_only_fields = ['id', 'criado_em', 'produtos_count']
    
    def get_produtos_count(self, obj):
        """Retorna o número de produtos ativos da categoria"""
        return obj.produtos.filter(ativo=True).count()


class ProdutoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagem de produtos"""
    categoria_nome = serializers.CharField(source='categoria.nome', read_only=True)
    estoque_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Produto
        fields = [
            'id', 'nome', 'preco', 'estoque', 'categoria_nome', 
            'estoque_status', 'ativo', 'criado_em'
        ]
    
    def get_estoque_status(self, obj):
        """Retorna o status do estoque"""
        if obj.estoque == 0:
            return 'sem_estoque'
        elif obj.estoque_baixo:
            return 'estoque_baixo'
        else:
            return 'ok'


class ProdutoDetailSerializer(serializers.ModelSerializer):
    """Serializer completo para detalhes do produto"""
    categoria_nome = serializers.CharField(source='categoria.nome', read_only=True)
    categoria = serializers.PrimaryKeyRelatedField(queryset=Categoria.objects.filter(ativo=True))
    total_vendido = serializers.SerializerMethodField()
    vendas_recentes = serializers.SerializerMethodField()
    
    class Meta:
        model = Produto
        fields = [
            'id', 'nome', 'descricao', 'preco', 'estoque', 
            'categoria', 'categoria_nome', 'ativo', 'criado_em', 
            'atualizado_em', 'total_vendido', 'vendas_recentes',
            'estoque_baixo', 'disponivel'
        ]
        read_only_fields = [
            'id', 'criado_em', 'atualizado_em', 'total_vendido',
            'vendas_recentes', 'estoque_baixo', 'disponivel'
        ]
    
    def get_total_vendido(self, obj):
        """Retorna a quantidade total vendida do produto"""
        return sum(venda.quantidade for venda in obj.vendas.all())
    
    def get_vendas_recentes(self, obj):
        """Retorna as 5 vendas mais recentes do produto"""
        vendas = obj.vendas.all()[:5]
        return VendaListSerializer(vendas, many=True).data
    
    def validate_preco(self, value):
        """Valida se o preço é positivo"""
        if value <= 0:
            raise serializers.ValidationError("O preço deve ser maior que zero.")
        return value
    
    def validate_estoque(self, value):
        """Valida se o estoque não é negativo"""
        if value < 0:
            raise serializers.ValidationError("O estoque não pode ser negativo.")
        return value


class VendaListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagem de vendas"""
    produto_nome = serializers.CharField(source='produto.nome', read_only=True)
    categoria_nome = serializers.CharField(source='produto.categoria.nome', read_only=True)
    
    class Meta:
        model = Venda
        fields = [
            'id', 'produto_nome', 'categoria_nome', 'quantidade',
            'preco_unitario', 'valor_total', 'data_venda'
        ]


class VendaDetailSerializer(serializers.ModelSerializer):
    """Serializer completo para detalhes da venda"""
    produto_nome = serializers.CharField(source='produto.nome', read_only=True)
    produto_estoque = serializers.IntegerField(source='produto.estoque', read_only=True)
    
    class Meta:
        model = Venda
        fields = [
            'id', 'produto', 'produto_nome', 'produto_estoque',
            'quantidade', 'preco_unitario', 'valor_total', 
            'data_venda', 'observacoes'
        ]
        read_only_fields = ['id', 'valor_total', 'data_venda']
    
    def validate(self, attrs):
        """Validações customizadas para a venda"""
        produto = attrs.get('produto')
        quantidade = attrs.get('quantidade')
        
        # Verifica se o produto está ativo
        if not produto.ativo:
            raise serializers.ValidationError(
                "Não é possível vender um produto inativo."
            )
        
        # Verifica estoque disponível
        if produto.estoque < quantidade:
            raise serializers.ValidationError(
                f"Estoque insuficiente. Disponível: {produto.estoque} unidades."
            )
        
        # Se não foi informado o preço unitário, usar o preço atual do produto
        if not attrs.get('preco_unitario'):
            attrs['preco_unitario'] = produto.preco
        
        return attrs
    
    @transaction.atomic
    def create(self, validated_data):
        """Cria uma nova venda com controle de estoque"""
        return super().create(validated_data)
    
    @transaction.atomic
    def update(self, instance, validated_data):
        """Atualiza uma venda existente"""
        # Para atualizações, primeiro restaura o estoque da venda original
        produto_original = instance.produto
        quantidade_original = instance.quantidade
        
        # Restaura o estoque
        produto_original.estoque += quantidade_original
        produto_original.save()
        
        # Aplica as mudanças
        instance = super().update(instance, validated_data)
        
        return instance


class RelatorioVendasSerializer(serializers.ModelSerializer):
    """Serializer para relatórios de vendas"""
    
    class Meta:
        model = RelatorioVendas
        fields = ['data', 'total_vendas', 'quantidade_vendas', 'produtos_vendidos']


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer para estatísticas do dashboard"""
    total_produtos = serializers.IntegerField()
    produtos_ativos = serializers.IntegerField()
    produtos_estoque_baixo = serializers.IntegerField()
    total_vendas_hoje = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_vendas_mes = serializers.DecimalField(max_digits=15, decimal_places=2)
    quantidade_vendas_hoje = serializers.IntegerField()
    quantidade_vendas_mes = serializers.IntegerField()
    produto_mais_vendido = serializers.CharField()
    categoria_mais_vendida = serializers.CharField()


class GraficoVendasSerializer(serializers.Serializer):
    """Serializer para dados dos gráficos de vendas"""
    data = serializers.DateField()
    total_vendas = serializers.DecimalField(max_digits=15, decimal_places=2)
    quantidade_vendas = serializers.IntegerField()


class GraficoProdutosSerializer(serializers.Serializer):
    """Serializer para dados dos gráficos de produtos"""
    nome = serializers.CharField()
    categoria = serializers.CharField()
    total_vendido = serializers.IntegerField()
    valor_total = serializers.DecimalField(max_digits=15, decimal_places=2)
    estoque_atual = serializers.IntegerField()


class GraficoCategoriaSerializer(serializers.Serializer):
    """Serializer para dados dos gráficos por categoria"""
    categoria = serializers.CharField()
    total_produtos = serializers.IntegerField()
    total_vendas = serializers.DecimalField(max_digits=15, decimal_places=2)
    quantidade_vendida = serializers.IntegerField()

class ConfiguracaoLojaSerializer(serializers.ModelSerializer):
    """Serializer para configurações da loja"""
    
    class Meta:
        model = ConfiguracaoLoja
        fields = [
            'id', 'nome_empresa', 'cnpj', 'cep', 'endereco', 'numero',
            'complemento', 'bairro', 'cidade', 'uf', 'telefone', 'email',
            'atualizado_em'
        ]
        read_only_fields = ['id', 'atualizado_em']
    
    def validate_cep(self, value):
        """Valida formato do CEP"""
        import re
        # Remove tudo que não é número
        cep_limpo = re.sub(r'\D', '', value)
        
        if len(cep_limpo) != 8:
            raise serializers.ValidationError("CEP deve ter 8 dígitos")
        
        # Retorna CEP formatado
        return f"{cep_limpo[:5]}-{cep_limpo[5:]}"
    
    def validate_cnpj(self, value):
        """Validação básica do CNPJ"""
        if value:
            import re
            # Remove tudo que não é número
            cnpj_limpo = re.sub(r'\D', '', value)
            
            if len(cnpj_limpo) != 14:
                raise serializers.ValidationError("CNPJ deve ter 14 dígitos")
            
            # Retorna CNPJ formatado
            return f"{cnpj_limpo[:2]}.{cnpj_limpo[2:5]}.{cnpj_limpo[5:8]}/{cnpj_limpo[8:12]}-{cnpj_limpo[12:]}"
        
        return value
    
    def validate(self, attrs):
        """Validações gerais"""
        # Campos obrigatórios
        required_fields = ['nome_empresa', 'cep', 'endereco', 'cidade', 'uf']
        for field in required_fields:
            if not attrs.get(field):
                raise serializers.ValidationError(f"Campo {field} é obrigatório")
        
        return attrs