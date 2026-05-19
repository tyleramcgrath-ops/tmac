# Centris AI Assist

A live AI assistant prototype for Centris Info.

## What it does

- Gives agents the best thing to say
- Creates Spanish versions
- Creates CRM notes
- Explains why the response works
- Gives next steps
- Supports sales, QA, reporting, training, and knowledge base workflows

## Local setup

1. Install dependencies:

npm install

2. Create `.env.local`:

OPENAI_API_KEY=your_openai_api_key_here

3. Run locally:

npm run dev

4. Open:

http://localhost:3000

## Deploy on Vercel

1. Push to GitHub.
2. Import the repo into Vercel.
3. Add this environment variable in Vercel Project Settings:

OPENAI_API_KEY

4. Redeploy.

## Embed on WordPress

Use this iframe:

<iframe
  src="https://your-vercel-url.vercel.app"
  width="100%"
  height="1200"
  style="border:0; width:100%; min-height:1200px; border-radius:24px; overflow:hidden;"
></iframe>

## Safety note

Do not enter private customer data, payment information, medical details, or sensitive account information into the demo unless the app has proper compliance, storage, access control, and client approval.
