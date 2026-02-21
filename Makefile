.help:
	@echo "n1_fan_do_ocultt - Makefile"
	@echo ""
	@echo "Comandos disponíveis:"
	@echo "  make up           - Inicia os containers"
	@echo "  make down         - Para os containers"
	@echo "  make logs         - Mostra logs em tempo real"
	@echo "  make restart      - Reinicia os containers"
	@echo "  make build        - Rebuilda a imagem Docker"
	@echo "  make psql         - Acessa PostgreSQL direto"
	@echo "  make clean        - Remove containers, volumes e imagens"
	@echo ""

help: .help

up:
	docker-compose up -d
	@echo "✅ Containers iniciados!"
	@echo "📊 Acesse: http://localhost:3000/api/health"

down:
	docker-compose down
	@echo "✅ Containers parados"

logs:
	docker-compose logs -f app

restart:
	docker-compose down
	docker-compose up -d
	@echo "✅ Containers reiniciados!"

build:
	docker-compose build
	@echo "✅ Imagem reconstruída"

psql:
	docker-compose exec postgres psql -U postgres -d occult_day

clean:
	docker-compose down -v
	@echo "✅ Containers e volumes removidos"

.PHONY: help up down logs restart build psql clean
