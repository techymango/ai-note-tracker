# AI Note-Taker

A mobile-first, local-first note-taking app powered by Perplexity AI.

## Features
- **Mobile-First UI**: Bottom tab navigation, dark theme, touch-optimized.
- **Local Persistence**: All data stored locally using IndexedDB.
- **AI Integration**: "Connect" notes to a Master Document using Perplexity Sonar Pro.
- **Context-Aware Chat**: Chat with your notes and master document.
- **Secure**: API Key stored in browser, not on any server.

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Create a `.env.local` file (optional, or set in UI Settings):
   ```
   VITE_PERPLEXITY_API_KEY=your_pplx_key_here
   ```

3. **Run Locally**
   ```bash
   npm run dev
   ```

## Tech Stack
- React 18 + TypeScript + Vite
- Tailwind CSS
- Zustand (State Management)
- IDB (IndexedDB Wrapper)
- Lucide React (Icons)

## Workflow
1. Create a Note in the **Notes** tab.
2. Tap **Connect** to have AI analyze it and update the **Master Document**.
3. View the consolidated knowledge in the **Doc** tab.
4. Ask questions in the **Chat** tab.
# ai_note_taker
# ai_note_taker
