# 🛒 E-commerce Dashboard

Sistema completo de gerenciamento de e-commerce com **Django REST API** + **React Frontend**.

## 🎯 Funcionalidades

### ✅ Backend (Django)
- **API REST completa** com Django Rest Framework
- **CRUD** de Produtos, Vendas e Categorias
- **Controle automático de estoque**
- **Dashboard com estatísticas**
- **Interface administrativa otimizada**
- **Validações e filtros avançados**

### ✅ Frontend (React)
- **Interface moderna e responsiva**
- **Gráficos interativos** com Chart.js
- **Navegação com React Router**
- **Formulários com validação**
- **Estados de loading e error**

### ✅ Funcionalidades Especiais
- **Formatação brasileira** (R$, datas)
- **Filtros em tempo real**
- **Paginação automática**
- **Alertas de estoque baixo**
- **Mobile-first design**

## 🏗️ Arquitetura

```
ecommerce-dashboard/
├── backend/                    # Django API
│   ├── ecommerce_dashboard/    # Projeto principal
│   ├── dashboard/              # App principal
│   ├── requirements.txt        # Dependências Python
│   └── manage.py
└── frontend/                   # React App
    ├── src/
    │   ├── components/         # Componentes React
    │   ├── services/           # API calls
    │   └── App.js
    ├── package.json            # Dependências Node
    └── public/
```

## 🚀 Setup Rápido

### 📋 Pré-requisitos
- Python 3.8+
- Node.js 16+
- Git

### 🔧 Instalação

#### 1. Clone o repositório
```bash
git clone https://github.com/NurtyJhons/ecommerce-dashboard.git
cd ecommerce-dashboard
```

#### 2. Setup Backend (Django)
```bash
# Criar ambiente virtual
python -m venv venv

# Ativar ambiente virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Executar migrações
python manage.py makemigrations
python manage.py migrate

# Criar superusuário
python manage.py createsuperuser

# Rodar servidor Django
python manage.py runserver
```

#### 3. Setup Frontend (React)
```bash
# Em outro terminal, navegar para frontend
cd ecommerce-dashboard-frontend

# Instalar dependências
npm install

# Rodar servidor React
npm start
```

### 🌐 Acessar aplicação
- **Frontend React**: http://localhost:3000
- **API Django**: http://localhost:8000/api/
- **Admin Django**: http://localhost:8000/admin/

## 📊 APIs Disponíveis

### 🔗 Endpoints Principais
```
GET/POST   /api/produtos/          # CRUD Produtos
GET/POST   /api/vendas/            # CRUD Vendas
GET/POST   /api/categorias/        # CRUD Categorias
```

### 📈 Dashboard APIs
```
GET /api/dashboard/stats/                    # Estatísticas gerais
GET /api/dashboard/grafico-vendas/?dias=30   # Dados para gráficos
GET /api/dashboard/grafico-produtos/?limite=10  # Top produtos
GET /api/dashboard/grafico-categorias/       # Vendas por categoria
```

### 🔍 Filtros Disponíveis
```
/api/produtos/?ativo=true&categoria=1&busca=nome&estoque_baixo=true
/api/vendas/?produto=1&data_inicio=2024-01-01&data_fim=2024-12-31
```

## 🗃️ Modelos de Dados

### 📦 Produto
```python
- nome: CharField
- descricao: TextField
- preco: DecimalField
- estoque: PositiveIntegerField
- categoria: ForeignKey
- ativo: BooleanField
```

### 💰 Venda
```python
- produto: ForeignKey
- quantidade: PositiveIntegerField
- preco_unitario: DecimalField
- valor_total: DecimalField (calculado)
- data_venda: DateTimeField
```

### 🏷️ Categoria
```python
- nome: CharField
- descricao: TextField
- ativo: BooleanField
```

## 🎨 Screenshots

### Dashboard Principal
![Dashboard](docs/screenshots/dashboard.png)

### Gestão de Produtos
![Produtos](docs/screenshots/produtos.png)

### Registro de Vendas
![Vendas](docs/screenshots/vendas.png)

## 🔧 Tecnologias

### Backend
- **Django 4.2+**
- **Django REST Framework**
- **PostgreSQL** 
- **django-cors-headers**

### Frontend
- **React 18+**
- **React Router**
- **Chart.js**
- **Axios**
- **CSS Grid/Flexbox**

## 📝 TODO / Roadmap

### 🔄 Próximas funcionalidades
- [ ] **Relatórios em PDF**
- [ ] **Integração com APIs de terceiros**
- [ ] **Sistema de autenticação**
- [ ] **Notificações em tempo real**
- [ ] **Deploy automatizado**

### 🎯 Melhorias
- [ ] **Testes unitários**
- [ ] **Documentação API (Swagger)**
- [ ] **Cache com Redis**
- [ ] **Backup automatizado**

## 🤝 Contribuição

1. **Fork** o projeto
2. **Crie** uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. **Commit** suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. **Push** para a branch (`git push origin feature/nova-funcionalidade`)
5. **Abra** um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Seu Nome**
- GitHub: [@seu-usuario](https://github.com/seu-usuario)
- LinkedIn: [João Vitor](https://www.linkedin.com/in/joaocoelhot/)
- Email: joaovitortargueta@gmail.com

## 🙏 Agradecimentos

- **Django** pela framework incrível
- **React** pela biblioteca reativa
- **Chart.js** pelos gráficos interativos
- **Comunidade open source** pelo suporte