"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, deleteDoc, doc, query, limit, onSnapshot } from "firebase/firestore";
import { Trash2, X, RefreshCw, Eye, AlertTriangle, Loader2 } from "lucide-react";

interface CollectionManagerProps {
    collectionName: string;
    onClose: () => void;
}

export default function CollectionManager({ collectionName, onClose }: CollectionManagerProps) {
    const [docs, setDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        const q = query(collection(db, collectionName), limit(50));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
            setDocs(data);
            setLoading(false);
        }, (error) => {
            console.error("Error loading docs:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [collectionName]);

    const handleDelete = async (id: string) => {
        if (!confirm(`Are you SURE you want to delete document ${id} from ${collectionName}? This cannot be undone.`)) return;

        setDeletingId(id);
        try {
            await deleteDoc(doc(db, collectionName, id));
            setDocs(docs.filter(d => d.id !== id));
        } catch (error: any) {
            console.error("Delete failed:", error);
            alert("Delete failed: " + error.message);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="bg-gray-900 border border-white/10 rounded-2xl overflow-hidden flex flex-col h-[600px] animate-in slide-in-from-bottom-5">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/40">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold font-mono text-blue-400">/{collectionName}</h2>
                    <span className="text-gray-500 text-sm">({docs.length} docs visible)</span>
                </div>
                <div className="flex items-center gap-2">

                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                        title="Close"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex">
                {/* List View */}
                <div className={`flex-1 overflow-y-auto ${selectedDoc ? 'hidden md:block md:w-1/2 border-r border-white/10' : 'w-full'}`}>
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            <Loader2 className="animate-spin mr-2" /> Loading data...
                        </div>
                    ) : docs.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-500 italic">
                            Collection is empty
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white/5 text-xs uppercase text-gray-400 font-mono sticky top-0">
                                <tr>
                                    <th className="p-3">Document ID</th>
                                    <th className="p-3">Summary</th>
                                    <th className="p-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 font-mono text-sm">
                                {docs.map((doc) => (
                                    <tr
                                        key={doc.id}
                                        className={`hover:bg-blue-500/5 transition-colors cursor-pointer ${selectedDoc?.id === doc.id ? 'bg-blue-500/10' : ''}`}
                                        onClick={() => setSelectedDoc(doc)}
                                    >
                                        <td className="p-3 text-blue-300 truncate max-w-[150px]">{doc.id}</td>
                                        <td className="p-3 text-gray-400 truncate max-w-[200px]">
                                            {/* Try to find a readable field */}
                                            {doc.name || doc.title || doc.email || doc.displayName || JSON.stringify(doc).slice(0, 30) + "..."}
                                        </td>
                                        <td className="p-3 text-right">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                                                className="text-gray-500 hover:text-red-500 p-1 transition-colors"
                                                disabled={deletingId === doc.id}
                                            >
                                                {deletingId === doc.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Inspect View */}
                {selectedDoc && (
                    <div className="w-full md:w-1/2 bg-black/20 overflow-y-auto p-4 absolute md:static inset-0 z-10 md:z-0 flex flex-col">
                        <div className="flex justify-between items-center mb-4 md:hidden">
                            <h3 className="font-bold text-gray-300">Document Details</h3>
                            <button onClick={() => setSelectedDoc(null)} className="text-gray-400"><X size={20} /></button>
                        </div>
                        <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap bg-black/50 p-4 rounded-lg border border-white/5 flex-1 overflow-auto">
                            {JSON.stringify(selectedDoc, null, 2)}
                        </pre>
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={() => handleDelete(selectedDoc.id)}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors font-mono text-sm"
                            >
                                <Trash2 size={16} /> Delete Document
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-2 border-t border-white/10 bg-yellow-500/5 text-yellow-500/70 text-xs flex items-center justify-center gap-2">
                <AlertTriangle size={12} /> Changes here are immediate and irreversible. Proceed with caution.
            </div>
        </div>
    );
}
