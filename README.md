#  Tritux RH — Guide de démarrage

## Structure du projet
```
tritux-rh/
├── docker-compose.yml        ← PostgreSQL + n8n
├── docker/
│   ├── init.sql              ← Création des tables
│   └── n8n-workflow-tritux.json  ← Workflow à importer dans n8n
├── templates/
│   └── templateTritux_.docx  ← Template CV officiel
├── backend/                  ← Spring Boot (port 9091)
├── frontend/                 ← React + Tailwind (port 3000)
└── python-service/           ← FastAPI + Docling (port 8001)
```

---

## ÉTAPE 1 — Démarrer Docker (PostgreSQL + n8n)

```bash
docker-compose up -d
```

Vérifier :
- PostgreSQL : accessible sur `localhost:5432`
- n8n : ouvrir http://localhost:5678
  - Login : `admin` / `Tritux@2025!`

---

## ÉTAPE 2 — Importer le workflow n8n

1. Ouvrir http://localhost:5678
2. Cliquer sur **"Workflows"** dans le menu gauche
3. Cliquer **"Import from file"** (ou le bouton `+` > Import)
4. Sélectionner le fichier : `docker/n8n-workflow-tritux.json`
5. Cliquer **Save** puis activer le workflow (toggle ON)
6. Cliquer sur le nœud "Webhook" pour copier l'URL du webhook
   → Elle doit ressembler à : `http://localhost:5678/webhook/extract-cv`

---

## ÉTAPE 3 — Service Python

```bash
cd python-service

# Créer environnement virtuel
python -m venv venv
venv\Scripts\activate        # Windows

# Installer les dépendances
pip install -r requirements.txt

# Lancer
uvicorn main:app --port 8001 --reload
```

Vérifier : http://localhost:8001/health → `{"status":"ok"}`

---

## ÉTAPE 4 — Backend Spring Boot

```bash
cd backend
mvnw.cmd spring-boot:run     # Windows
```

Vérifier : http://localhost:9091/api/templates

---

## ÉTAPE 5 — Frontend React

```bash
cd frontend
npm install
npm start
```

Ouvrir : http://localhost:3000

---

## Flux complet

```
[RH importe CV]
      ↓
Spring Boot (port 9091)
      ↓
Python/Docling (port 8001) — extrait le texte
      ↓
n8n (port 5678) — construit le prompt
      ↓
Groq API (LLama) — retourne JSON structuré
      ↓
Python valide (Pydantic)
      ↓
Spring Boot sauvegarde en PostgreSQL
      ↓
React affiche les blocs éditables
      ↓
[RH modifie / chatbot]
      ↓
Python remplit templateTritux_.docx
      ↓
[RH télécharge le CV brandé]
```

---

## Ports utilisés

| Service | Port |
|---|---|
| React Frontend | 3000 |
| Spring Boot | 9091 |
| Python FastAPI | 8001 |
| n8n | 5678 |
| PostgreSQL | 5432 |
