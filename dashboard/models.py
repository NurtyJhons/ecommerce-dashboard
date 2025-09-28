from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal


class Categoria(models.Model):
    """Modelo para categorias de produtos"""
    nome = models.CharField(max_length=100, unique=True)
    descricao = models.TextField(blank=True, null=True)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Categoria"
        verbose_name_plural = "Categorias"
        ordering = ['nome']
    
    def __str__(self):
        return self.nome


class Produto(models.Model):
    """Modelo para produtos do e-commerce"""
    nome = models.CharField(max_length=200)
    descricao = models.TextField(blank=True, null=True)
    preco = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    estoque = models.PositiveIntegerField(default=0)
    categoria = models.ForeignKey(
        Categoria, 
        on_delete=models.CASCADE, 
        related_name='produtos'
    )
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Produto"
        verbose_name_plural = "Produtos"
        ordering = ['-criado_em']
    
    def __str__(self):
        return f"{self.nome} - R$ {self.preco}"
    
    @property
    def estoque_baixo(self):
        """Verifica se o estoque está baixo (menor que 10)"""
        return self.estoque < 10
    
    @property
    def disponivel(self):
        """Verifica se o produto está disponível para venda"""
        return self.ativo and self.estoque > 0


class Venda(models.Model):
    """Modelo para registrar vendas"""
    produto = models.ForeignKey(
        Produto, 
        on_delete=models.CASCADE, 
        related_name='vendas'
    )
    quantidade = models.PositiveIntegerField(
        validators=[MinValueValidator(1)]
    )
    preco_unitario = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text="Preço do produto no momento da venda"
    )
    valor_total = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        editable=False  # Será calculado automaticamente
    )
    data_venda = models.DateTimeField(auto_now_add=True)
    observacoes = models.TextField(blank=True, null=True)
    
    class Meta:
        verbose_name = "Venda"
        verbose_name_plural = "Vendas"
        ordering = ['-data_venda']
    
    def __str__(self):
        return f"{self.produto.nome} - {self.quantidade}x - R$ {self.valor_total}"
    
    def save(self, *args, **kwargs):
        """Sobrescreve o método save para calcular o valor total e atualizar estoque"""
        # Se não foi definido o preço unitário, usar o preço atual do produto
        if not self.preco_unitario:
            self.preco_unitario = self.produto.preco
        
        # Calcula o valor total
        self.valor_total = self.preco_unitario * self.quantidade
        
        # Se é uma nova venda (não existe pk), atualiza o estoque
        if not self.pk:
            if self.produto.estoque < self.quantidade:
                raise ValueError(f"Estoque insuficiente. Disponível: {self.produto.estoque}")
            
            # Reduz o estoque do produto
            self.produto.estoque -= self.quantidade
            self.produto.save()
        
        super().save(*args, **kwargs)
    
    def delete(self, *args, **kwargs):
        """Sobrescreve o método delete para restaurar o estoque"""
        # Restaura o estoque quando a venda é excluída
        self.produto.estoque += self.quantidade
        self.produto.save()
        super().delete(*args, **kwargs)


class RelatorioVendas(models.Model):
    """Modelo para relatórios de vendas (view materializada)"""
    data = models.DateField()
    total_vendas = models.DecimalField(max_digits=15, decimal_places=2)
    quantidade_vendas = models.PositiveIntegerField()
    produtos_vendidos = models.PositiveIntegerField()
    
    class Meta:
        verbose_name = "Relatório de Vendas"
        verbose_name_plural = "Relatórios de Vendas"
        ordering = ['-data']
        
    def __str__(self):
        return f"Relatório {self.data} - R$ {self.total_vendas}"

class ConfiguracaoLoja(models.Model):
    # Dados da empresa
    nome_empresa = models.CharField(max_length=200)
    cnpj = models.CharField(max_length=18, blank=True)
    
    # Endereço (ViaCEP)
    cep = models.CharField(max_length=9)
    endereco = models.CharField(max_length=300)
    numero = models.CharField(max_length=10, blank=True)
    complemento = models.CharField(max_length=100, blank=True)
    bairro = models.CharField(max_length=100)
    cidade = models.CharField(max_length=100)
    uf = models.CharField(max_length=2)
    
    # Contato
    telefone = models.CharField(max_length=15, blank=True)
    email = models.EmailField(blank=True)
    
    # Metadados
    atualizado_em = models.DateTimeField(auto_now=True)