# ✂️ Guaribada — Salão de Cabelo Agendamentos

Aplicativo completo para o Salão Guaribada (Carmo, RJ) com agendamento de serviços, integração via WhatsApp e painel administrativo.

---

## 📁 Estrutura do Projeto

```
guaribada/
├── frontend/               # React + Vite + TailwindCSS
│   └── src/
│       ├── context/        # Estado global (auth, navegação, remarcação)
│       ├── screens/        # Telas: Login, Home, Booking, Admin...
│       ├── components/     # Navbar, etc.
│       └── utils/
│           ├── constants.js  # Status labels/colors centralizados
│           ├── format.js     # maskPhone e outros formatadores
│           └── whatsapp.js   # Gerador de link WhatsApp
└── backend/                # Node.js + Express + MongoDB
    ├── models/             # User, Service, Booking
    ├── routes/             # auth, services, bookings
    └── middleware/         # JWT auth (authenticate + optionalAuthenticate)
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

Depois, no painel Admin → clique **"Padrões"** para criar os serviços iniciais (corte, escova, coloração, etc.).

---

## 🔧 Variáveis de Ambiente

### backend/.env

| Variável | Descrição |
|---|---|
| `PORT` | Porta da API (padrão: 4000) |
| `MONGODB_URI` | String de conexão MongoDB |
| `JWT_SECRET` | Segredo JWT (mude em produção!) |
| `FRONTEND_URL` | URL do frontend (para CORS) |
| `WHATSAPP_PHONE` | Número do WhatsApp da Guaribada (com DDI, sem +) |

### frontend/.env

| Variável | Descrição |
|---|---|
| `VITE_API_URL` | URL base da API (ex: `https://seu-backend.railway.app/api`) |
| `VITE_WHATSAPP_PHONE` | Número do WhatsApp para notificações (com DDI, sem +) |

> Em desenvolvimento o Vite redireciona `/api` automaticamente para `localhost:4000` via proxy.

---

## 📱 Funcionalidades

### Cliente
- ✅ Cadastro e login com email/senha
- ✅ **Agendamento sem cadastro** (modo convidado — nome e telefone)
- ✅ Escolha de serviço (com preço e duração)
- ✅ Seleção de data (próximos 14 dias, sem domingos)
- ✅ Horários disponíveis em tempo real (bloqueio automático)
- ✅ Suporte a **2 cadeiras simultâneas** por horário
- ✅ Confirmação via WhatsApp com mensagem pré-preenchida
- ✅ Histórico de agendamentos
- ✅ **Remarcação de agendamentos**
- ✅ Cancelamento de agendamentos
- ✅ Botão "Agendar novamente"

### Admin
- ✅ Dashboard com estatísticas (hoje, pendentes, concluídos, receita)
- ✅ Listagem de todos os agendamentos
- ✅ Filtro por data e status
- ✅ Atualização de status em tempo real
- ✅ **Criar agendamento diretamente pelo painel** (para atendimento presencial)
- ✅ Identificação visual de agendamentos de convidados
- ✅ CRUD completo de serviços
- ✅ Seed de serviços padrão (idempotente — não duplica)

### Segurança
- ✅ Rate limiting na rota de autenticação (20 req/15min)
- ✅ Validação de conflito de horários no servidor (previne race condition)
- ✅ Middleware `optionalAuthenticate` para rotas mistas (logado + convidado)
- ✅ Alerta no startup se `JWT_SECRET` não estiver definido

---

## 📦 Deploy Gratuito

### Backend → Railway.app
1. Crie conta em [railway.app](https://railway.app)
2. Novo projeto → **Deploy from GitHub**
3. Selecione o repositório e configure a pasta raiz como `backend`
4. Adicione as variáveis de ambiente (painel → Variables)
5. Adicione um banco MongoDB (plugin Railway ou MongoDB Atlas)

### Frontend → Vercel
1. Crie conta em [vercel.com](https://vercel.com)
2. Import GitHub repo → pasta `frontend`
3. **Build command:** `npm run build`
4. **Output dir:** `dist`
5. Adicione as variáveis de ambiente no painel Vercel:
   - `VITE_API_URL` → URL do seu backend Railway + `/api`
   - `VITE_WHATSAPP_PHONE` → número do WhatsApp (ex: `5524999999999`)

---

## 🛣️ API Endpoints

### Auth
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/register` | Cadastrar |
| POST | `/api/auth/login` | Login |
| GET  | `/api/auth/me` | Dados do usuário logado |

> Rotas de auth possuem rate limit: 20 requisições por 15 minutos.

### Services
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET    | `/api/services` | Pública | Listar serviços ativos |
| POST   | `/api/services` | Admin | Criar serviço |
| PUT    | `/api/services/:id` | Admin | Editar serviço |
| DELETE | `/api/services/:id` | Admin | Desativar serviço |
| POST   | `/api/services/seed` | Admin | Criar serviços padrão |

### Bookings
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET    | `/api/bookings/available-slots` | Pública | Horários disponíveis |
| POST   | `/api/bookings` | Opcional (convidado ou logado) | Criar agendamento |
| GET    | `/api/bookings/my` | Logado | Meus agendamentos |
| GET    | `/api/bookings` | Admin | Todos os agendamentos |
| GET    | `/api/bookings/dashboard` | Admin | Estatísticas do painel |
| PATCH  | `/api/bookings/:id/status` | Admin | Atualizar status |
| PATCH  | `/api/bookings/:id/reschedule` | Logado | **Remarcar agendamento** |
| DELETE | `/api/bookings/:id` | Logado | Cancelar agendamento |

---

## 🏗️ Decisões de Arquitetura

### Duas Cadeiras Simultâneas
`MAX_PER_SLOT = 2` no backend. A função `getOccupiedMinutes()` retorna um objeto de contagens por minuto, e `hasTimeConflict()` só bloqueia o horário quando `count >= MAX_PER_SLOT`. Isso permite dois atendimentos em paralelo no mesmo horário.

### Agendamento sem Cadastro
O middleware `optionalAuthenticate` verifica o JWT mas não bloqueia se ausente — a rota de criação de agendamento funciona para ambos. Convidados fornecem nome e telefone no frontend; o backend salva no campo `guest` do modelo Booking.

### Remarcação
O endpoint `PATCH /:id/reschedule` exclui o próprio agendamento da verificação de conflito (`excludeId`), permitindo manter o mesmo horário ou trocar sem falso positivo. O status é resetado para `pending`.

### Validação de Corrida (Race Condition)
A verificação de disponibilidade de slot acontece **no servidor** no momento da criação, não apenas no frontend. Dois usuários tentando o mesmo horário simultaneamente resultam em um erro para o segundo.

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
- 📦 Venda de produtos (shampoo, condicionador) na plataforma
- 🎁 Programa de fidelidade (10º corte grátis)
- 📢 Destaque na busca local (anúncios no app)

---

## 🏗️ Preparado para Escalar

- Estrutura modular de rotas e models
- JWT stateless (fácil de escalar horizontalmente)
- MongoDB schema com índices otimizados (nome único em serviços)
- Separação client/admin no frontend
- Roles de usuário extensíveis (client, admin, employee)
- Constants e utilitários centralizados no frontend

---

Feito com ❤️ para o Salão Guaribada — Carmo, RJ ✂️✨
