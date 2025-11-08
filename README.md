Nirvana Ai

Your personal assistant that runs 100% locally

## Prerequsites

- Local Ollama instance
- `llama3.1:8b` model
- `embeddinggemma` embedding model

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

## Test API

```
curl -X POST -H "Content-Type: application/json" -d '{"message": "Who is the President of the United States?"}' http://localhost:3000/api/chat
```
