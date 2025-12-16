# SHL Assessment Recommendation System

This repository contains a small Next.js app that demonstrates an assessment recommendation prototype. The UI calls server API routes that (in production) would scrape an assessment catalog, build embeddings, and run an AI-based recommender.

This workspace includes a small seeded dataset so you can run the app locally without downloading heavy models or scraping the SHL site.

## Quick start

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

## First-time setup (optional)

- The repository already contains small sample files under `data/` so the UI will return recommendations without doing a full scrape or model download.
- To re-run the full pipeline (scrape + embed generation), use the "Initialize System" button in the UI which triggers the `/api/scrape` endpoint. Note: network access and runtime resources are required for scraping and running the embedding model.

## Environment variables

- `GEMINI_API_KEY` — optional API key used by the recommender when calling Google Generative AI. If unset, the recommender will still function using the seeded embeddings (local fallback).

## Files of interest

- `app/page.tsx` — main UI for entering queries and viewing recommendations.
- `app/api/scrape.js` — endpoint to scrape assessments and create embeddings.
- `app/api/recommend.js` — endpoint used by the UI to get recommendations.
- `lib/scraper.js`, `lib/embeddings.js`, `lib/recommender.js` — core logic for scraping, embeddings and recommendation.
- `data/assessments.json`, `data/embeddings.json` — seeded data included for local testing.

## Notes

- The seeded embeddings are small synthetic vectors to allow local testing of the similarity search and UI flow. For production-quality matching, replace with real embeddings produced by a model like `@xenova/transformers` or an embedding API.
- If you plan to run the full pipeline, ensure you have sufficient memory and network access — model loading can be resource intensive.
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
