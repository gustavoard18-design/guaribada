# 🚗 Guaribada — Lava-Jato Agendamentos

Aplicativo completo para o Lava-Jato Guaribada (Carmo, RJ) com agendamento de serviços, integração via WhatsApp e painel administrativo.

---

## 📁 Estrutura do Projeto

```
guaribada/
├── frontend/          # React + Vite + TailwindCSS
│   └── src/
│       ├── context/   # Gerenciamento de estado global (auth, navegação)
│       ├── screens/   # Telas: Login, Home, Booking, Admin...
│       ├── components/# Navbar, etc.
│       └── utils/     # WhatsApp link generator
└── backend/           # Node.js + Express + MongoDB
    ├── models/        # User, Service, Booking
    ├── routes/        # auth, services, bookings
    └── middleware/    # JWT auth
```

---

## 🚀 Rodando Localmente

### Pré-requisitos
- Node.js 18+
- MongoDB (local ou Atlas)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edite o .env com suas configurações
npm run dev
```

O servidor sobe em `http://localhost:4000`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

O app abre em `http://localhost:5173`

### 3. Criar Admin + Serviços padrão

Após rodar, registre uma conta e atualize o role no MongoDB:
```js
db.users.updateOne({ email: "admin@guaribada.com" }, { $set: { role: "admin" } })
```

Depois, no painel Admin → clique **"Padrões"** para criar os 5 serviços iniciais.

---

## 🔧 Variáveis de Ambiente (backend/.env)

| Variável | Descrição |
|---|---|
| `PORT` | Porta da API (padrão: 4000) |
| `MONGODB_URI` | String de conexão MongoDB |
| `JWT_SECRET` | Segredo JWT (mude em produção!) |
| `FRONTEND_URL` | URL do frontend (para CORS) |
| `WHATSAPP_PHONE` | Número do WhatsApp da Guaribada (com DDI, sem +) |

---

## 📱 Funcionalidades

### Cliente
- ✅ Cadastro e login com email/senha
- ✅ Escolha de serviço (com preço e duração)
- ✅ Seleção de data (próximos 14 dias, sem domingos)
- ✅ Horários disponíveis em tempo real (bloqueio automático)
- ✅ Dados do veículo (opcional)
- ✅ Confirmação via WhatsApp com mensagem pré-preenchida
- ✅ Histórico de agendamentos
- ✅ Cancelamento de agendamentos
- ✅ Botão "Agendar novamente"

### Admin
- ✅ Dashboard com estatísticas (hoje, pendentes, concluídos, receita)
- ✅ Listagem de todos os agendamentos
- ✅ Filtro por data e status
- ✅ Atualização de status em tempo real
- ✅ CRUD completo de serviços
- ✅ Seed de serviços padrão

---

## 📦 Deploy Gratuito

### Backend → Railway.app
1. Crie conta em [railway.app](https://railway.app)
2. Novo projeto → Deploy from GitHub
3. Adicione as variáveis de ambiente
4. Adicione um MongoDB (plugin ou Atlas)

### Frontend → Vercel
1. Crie conta em [vercel.com](https://vercel.com)
2. Import GitHub repo → pasta `frontend`
3. Build command: `npm run build`
4. Output dir: `dist`
5. Adicione variável: `VITE_WHATSAPP_PHONE=552499999999`

---

## 🛣️ API Endpoints

### Auth
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/register` | Cadastrar |
| POST | `/api/auth/login` | Login |
| GET  | `/api/auth/me` | Dados do usuário |

### Services
| Método | Rota | Descrição |
|---|---|---|
| GET    | `/api/services` | Listar serviços |
| POST   | `/api/services` | Criar (admin) |
| PUT    | `/api/services/:id` | Editar (admin) |
| DELETE | `/api/services/:id` | Desativar (admin) |

### Bookings
| Método | Rota | Descrição |
|---|---|---|
| POST   | `/api/bookings` | Criar agendamento |
| GET    | `/api/bookings/my` | Meus agendamentos |
| GET    | `/api/bookings` | Todos (admin) |
| GET    | `/api/bookings/dashboard` | Stats (admin) |
| GET    | `/api/bookings/available-slots` | Horários livres |
| PATCH  | `/api/bookings/:id/status` | Atualizar status |
| DELETE | `/api/bookings/:id` | Cancelar |

---

## 💡 Melhorias Futuras

### Curto Prazo
- 📲 Notificações push (PWA + Firebase)
- 📧 E-mail de confirmação (Nodemailer)
- 🔐 Login com Google (OAuth)
- 🗓️ Integração Google Calendar

### Médio Prazo
- 💳 Pagamento online (Stripe ou Mercado Pago)
- 👥 Multi-funcionários (cada um com agenda própria)
- 📊 Relatórios avançados (gráficos mensais)
- 🤖 Bot WhatsApp real (Baileys ou Evolution API)
- ⭐ Sistema de avaliações

### Monetização
- 💰 Plano mensal para outros lava-jatos (SaaS B2B)
- 💳 Taxa por transação via pagamento integrado
- 📦 Venda de produtos (cera, aspirador) na plataforma
- 🎁 Programa de fidelidade (10ª lavagem grátis)
- 📢 Destaque na busca local (anúncios no app)

---

## 🏗️ Preparado para Escalar

- Estrutura modular de rotas e models
- JWT stateless (fácil de escalar horizontalmente)
- MongoDB schema com índices otimizados
- Separação client/admin no frontend
- Roles de usuário extensíveis (client, admin, employee)

---

Feito com ❤️ para o Lava-Jato Guaribada — Carmo, RJ 🚗✨
