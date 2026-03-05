.PHONY: dev backend web mobile setup-db

# Start backend + web together via Docker Compose
dev:
	docker-compose up --build

# Start only the backend (expects local PostgreSQL running)
backend:
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Start only the Next.js web app
web:
	cd web && npm run dev

# Start the Expo mobile app
mobile:
	cd mobile && npx expo start

# Create local PostgreSQL user + database (run once)
setup-db:
ifeq ($(OS),Windows_NT)
	powershell -ExecutionPolicy Bypass -File scripts/setup-local-db.ps1
else
	bash scripts/setup-local-db.sh
endif

# Install all dependencies
install:
	cd web && npm install
	cd mobile && npm install
