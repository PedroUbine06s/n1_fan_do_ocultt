# n1_fan_do_ocultt

## 🐳 Setup com Docker (Recomendado)

### Requisitos

- Docker
- Docker Compose

### Quick Start

1. Configure o arquivo `.env`:
```bash
cp .env.example .env
# Edite o .env com suas credenciais
```

2. Rode com Docker Compose:
```bash
docker-compose up -d
```

3. Verifique os logs:
```bash
docker-compose logs -f app
```


4. Acesse os endpoints:
- 🏥 Health: `http://localhost:3000/api/health`
- 📊 Stats: `http://localhost:3000/api/stats/summary`
- 📜 Histórico: `http://localhost:3000/api/stats/history`
- 📱 Recipients: `http://localhost:3000/api/recipients`

### Gerenciar números de recipients (WhatsApp)

**Listar todos:**
```bash
curl http://localhost:3000/api/recipients
```

**Adicionar:**
```bash
curl -X POST http://localhost:3000/api/recipients \
   -H 'Content-Type: application/json' \
   -d '{"phone": "5511999999999", "name": "Fulano"}'
```

**Remover:**
```bash
curl -X DELETE http://localhost:3000/api/recipients/5511999999999
```

### O que é criado automaticamente:

✅ PostgreSQL rodando em background
✅ Banco de dados criado (`occult_day`)
✅ Todas as tabelas criadas via Prisma
✅ Aplicação conectada ao banco
✅ Health checks ativados
✅ Dados persistidos em volumes Docker

### Comandos úteis

```bash
# Parar os containers
docker-compose down

# Visualizar logs em tempo real
docker-compose logs -f app

# Acessar o PostgreSQL
docker-compose exec postgres psql -U postgres -d occult_day

# Reiniciar tudo
docker-compose down && docker-compose up -d
```

## � Arquitetura Docker

### Containers

1. **postgres** (PostgreSQL 16-alpine)
   - Porta: 5432
   - Usuário: postgres
   - Senha: postgres
   - DB: occult_day
   - Volume: `postgres_data` (persistência)

2. **app** (Node.js 20-slim)
   - Porta: 3000
   - Executa migrações automaticamente
   - Dependência: aguarda PostgreSQL estar healthy
   - Health check a cada 30s

### Fluxo de inicialização

```
1. PostgreSQL inicia
2. PostgreSQL passa no health check
3. App inicia
4. docker-entrypoint.sh executa migrações
5. Aplicação começa a rodar
```

### Volume de dados

Os dados do PostgreSQL são salvos em um Docker Volume chamado `postgres_data`, garantindo que:
- ✅ Dados persistem entre restarts
- ✅ Dados persistem entre `docker-compose down/up`
- ✅ Backup fácil do volume

---

## Setup Manual

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e configure:

```
# Riot / invocador
OCCULT_DAY_GAME_NAME=seu-nome
OCCULT_DAY_TAG_LINE=seu-tag
RIOT_KEY=RGAPI-xxx
RIOT_API_BASE_URL=https://br1.api.riotgames.com
RIOT_REGIONAL_URL=https://americas.api.riotgames.com

# Cron
CRON_INTERVAL=*/2 * * * *

# WAPI (WhatsApp)
WAPI_INSTANCE_ID=SEU_ID
WAPI_BEARER_TOKEN=SEU_TOKEN
WAPI_DEFAULT_PHONE=5511999999999

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/occult_day
```

### 3. Acessar banco de dados
    Via dbeaver acessar:
   **postgres**
   - Porta: 5432
   - Usuário: postgres
   - Senha: postgres
   - DB: occult_day

#### Executar migrações

```bash
npx prisma migrate dev --name init
```

### 4. Rodar em desenvolvimento

```bash
npm run dev
```

## O que acontece no startup

✅ Verifica conexão com PostgreSQL
✅ Cria tabelas automaticamente (se não existirem)
✅ Inicia o cron de monitoramento
✅ Dados das partidas são persistidos no BD

## Endpoints disponíveis

- `GET /api/health` — Status da aplicação
- `POST /api/notifications/test` — Testar envio de notificação
- `GET /api/stats/history?limit=10` — Histórico de partidas
- `GET /api/stats/summary` — Estatísticas gerais (W/L, KDA, etc.)

## Estrutura do projeto

```
src/
├── app.ts                 # Express app
├── server.ts              # Inicialização (startup)
├── controllers/           # Controladores de rotas
├── cron/                  # Jobs agendados
├── middlewares/           # Middlewares Express
├── routes/                # Definição de rotas
└── services/              # Lógica de negócio
    ├── db-init.service.ts # Inicialização do banco
    ├── database.service.ts # Operações no banco
    ├── notification.service.ts # Envio de notificações
    ├── riotApi.service.ts  # API do Riot
    └── tracker.service.ts  # Rastreamento de rank
```

## Notas

- ✅ Dados persistem entre restarts (PostgreSQL)
- ✅ Notificações são enviadas automaticamente após cada partida
- ✅ Stats e histórico sempre disponíveis
- 🔐 Não comite o arquivo `.env` (use `.env.example` como referência)
