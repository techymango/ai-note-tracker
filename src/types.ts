import type { Node } from 'reactflow';

export interface Note {
    id: string;
    content: string;
    tags: string[];
    status: 'draft' | 'connected';
    createdAt: number;
    updatedAt: number;
}

export interface DocumentSection {
    id: string;
    title: string;
    content: string;
}

export interface MasterDocument {
    sections: DocumentSection[];
    lastUpdated: number;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
}

export interface Settings {
    apiKey: string;
    model: string;
    theme: 'dark';
}

// Node Data Structure
export interface NoteNodeData {
    title?: string;
    content: string;
    tags: string[];
    status: 'draft' | 'connected';
    chatHistory: ChatMessage[];
    createdAt: number;
    updatedAt: number;
    isMinimized?: boolean;
    isExpanded?: boolean;
    isTitleManual?: boolean;
}

export type AppNode = Node<NoteNodeData>;


