import { openDB, type DBSchema } from 'idb';
import type { AppNode, MasterDocument, Settings } from '../types';
import type { Edge } from 'reactflow';

interface NoteTakerDB extends DBSchema {
    nodes: {
        key: string;
        value: AppNode;
    };
    edges: {
        key: string;
        value: Edge;
    };
    document: {
        key: string;
        value: MasterDocument & { id: string };
    };
    settings: {
        key: string;
        value: Settings & { id: string };
    };
}

const DB_NAME = 'ai-notetaker-db-v2'; // Bump version or name for clean slate

export const dbPromise = openDB<NoteTakerDB>(DB_NAME, 1, {
    upgrade(db) {
        db.createObjectStore('nodes', { keyPath: 'id' });
        db.createObjectStore('edges', { keyPath: 'id' });
        db.createObjectStore('document', { keyPath: 'id' });
        db.createObjectStore('settings', { keyPath: 'id' });
    },
});

export const db = {
    async getNodes(): Promise<AppNode[]> {
        return (await dbPromise).getAll('nodes');
    },
    async saveNode(node: AppNode) {
        return (await dbPromise).put('nodes', node);
    },
    async deleteNode(id: string) {
        return (await dbPromise).delete('nodes', id);
    },
    async getEdges(): Promise<Edge[]> {
        return (await dbPromise).getAll('edges');
    },
    async saveEdge(edge: Edge) {
        return (await dbPromise).put('edges', edge);
    },
    async saveEdges(edges: Edge[]) {
        const tx = (await dbPromise).transaction('edges', 'readwrite');
        await Promise.all(edges.map(e => tx.store.put(e)));
        await tx.done;
    },
    async getDocument(): Promise<MasterDocument | undefined> {
        return (await dbPromise).get('document', 'master');
    },
    async saveDocument(doc: MasterDocument) {
        const docWithId = { ...doc, id: 'master' };
        return (await dbPromise).put('document', docWithId);
    },
    async getSettings(): Promise<Settings | undefined> {
        return (await dbPromise).get('settings', 'global');
    },
    async saveSettings(settings: Settings) {
        const settingsWithId = { ...settings, id: 'global' };
        return (await dbPromise).put('settings', settingsWithId);
    }
};
