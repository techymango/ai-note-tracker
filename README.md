# AI Thinking Companion (formerly AI Note-Taker)

A local-first, privacy-focused "Thinking Companion" that helps you synthesize, explore, and evolve your ideas using AI. It goes beyond simple note storage to actively connect dots and surface insights.

## 🚀 Key Features

### 🧠 AI Insight Modes
Instead of just "chatting", apply specific lenses to your notes:
- **SUMMARY**: Weaves selected notes into a coherent narrative.
- **CONTRADICTIONS**: Finds conflicting facts or tension points.
- **KNOWLEDGE GAPS**: Identifies what's missing and suggests questions.
- **MENTAL MODELS**: Proposes frameworks (e.g., First Principles) to explain your ideas.
- **ACTION ITEMS**: Extracts concrete next steps.
- **CONNECT**: Synthesizes notes into a structured **Master Document**.

### 🎮 Interactive Context Control
- **Selection-Based Analysis**: Select specific notes on the canvas to scope the AI's analysis.
- **Master Document**: A living document that evolves as you connect more notes.

### 🗺️ Visual Knowledge Graph
- **Canvas View**: Visualize your notes as nodes on an infinite canvas.
- **Spatial Organization**: Drag and arrange notes to group related concepts.

### 🔒 Privacy & Local-First
- **Client-Side Storage**: All notes and data live in your browser's IndexedDB.
- **Direct API Calls**: Your API key stays on your device and calls Perplexity directly. No middleman servers.

---

## 🏗️ Architecture & Codebase

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Lucide React (Icons)
- **State Management**: Zustand (Global Store)
- **Visualization**: React Flow (Graph Canvas)
- **AI Integration**: Perplexity API (`sonar-pro` model)
- **Persistence**: `idb` (IndexedDB Wrapper)

### Key Directories
- **`src/components/`**: UI Components.
    - `CanvasTab.tsx`: The main graph view context.
    - `AnalysisPanel.tsx`: The floating AI brain panel.
    - `NotesTab.tsx` / `ChatTab.tsx`: Feature-specific views.
- **`src/lib/`**: Core logic.
    - `store.ts`: Central Zustand store. Manages `nodes`, `edges`, `document`, and `settings`.
    - `db.ts`: IndexedDB database layer for saving/loading data.
    - `llm/`: AI logic.
        - `perplexity.ts`: Handles API calls to Perplexity.
        - `prompts.ts`: System prompts for different AI modes.

### Data Flow
1.  **User Input** → Creates a `Note` (Draft).
2.  **Selection** → User selects notes on Canvas or List.
3.  **AI Analysis** (`AnalysisPanel`) →
    *   Reads selected notes.
    *   Selects Prompt Template based on Mode (`prompts.ts`).
    *   Calls Perplexity API (`perplexity.ts`).
4.  **Result** →
    *   *Insight*: displayed in the panel.
    *   *Connect*: updates the `MasterDocument` in `store`.

## 🛠️ Setup

1.  **Install**: `npm install`
2.  **Run**: `npm run dev`
3.  **Configure**: Open the **Settings** tab and enter your Perplexity API Key.
