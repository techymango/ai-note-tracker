
import ReactFlow, {
    Background,
    Controls,
    Panel,
    ReactFlowProvider,
    useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus } from 'lucide-react';
import { useStore } from '../lib/store';
import NoteNode from './NoteNode';
import AnalysisPanel from './AnalysisPanel';

const nodeTypes = {
    noteNode: NoteNode,
};

function CanvasContent() {
    const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode } = useStore();
    const { getZoom } = useReactFlow();

    const handleAddNode = () => {
        // Simple random offset for now or center of screen
        const zoom = getZoom();
        // Ideally we project center of screen, but for MVP:
        const x = Math.random() * (400 / zoom); // Adjust spread based on zoom
        const y = Math.random() * (400 / zoom);
        addNode({ x, y });
    };

    return (
        <div className="w-full h-full bg-zinc-950">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                className="bg-zinc-950"
            >
                <Background gap={20} size={1} color="#3f3f46" />
                <Controls className="bg-zinc-800 border-zinc-700 fill-zinc-400" />
                <AnalysisPanel />

                <Panel position="bottom-right">
                    <button
                        onClick={handleAddNode}
                        className="bg-blue-600 hover:bg-blue-500 text-white rounded-full p-4 shadow-2xl transition-transform hover:scale-110 active:scale-95 flex items-center gap-2"
                    >
                        <Plus size={24} />
                    </button>
                </Panel>
            </ReactFlow>
        </div>
    );
}

export default function CanvasTab() {
    return (
        <ReactFlowProvider>
            <CanvasContent />
        </ReactFlowProvider>
    );
}
