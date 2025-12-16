"use client";

import { useState, useEffect } from "react";
import { subscribeToMessages, deleteMessage } from "@/services/messages";
import { ContactMessage } from "@/types";
import { MessageSquare, Trash2, Mail, Clock, Search } from "lucide-react";

export default function MessagesPage() {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const unsubscribe = subscribeToMessages((msgs) => {
            setMessages(msgs);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this message?")) {
            await deleteMessage(id);
        }
    };

    const filteredMessages = messages.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase()) ||
        m.subject.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="text-white">Loading messages...</div>;

    return (
        <div className="max-w-6xl mx-auto text-white">
            <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                        <MessageSquare className="text-blue-500" /> Inbox
                    </h1>
                    <p className="text-gray-400">View and manage messages from the contact form.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search messages..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none w-64"
                    />
                </div>
            </div>

            {filteredMessages.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10 border-dashed">
                    <Mail size={48} className="mx-auto mb-4 text-gray-600" />
                    <h3 className="text-gray-500 font-bold">No messages found</h3>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredMessages.map((msg) => (
                        <div key={msg.id} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/[0.07] transition-colors group relative">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-white">{msg.subject}</h3>
                                    <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                                        <span className="flex items-center gap-1"><Mail size={14} /> {msg.email}</span>
                                        <span className="flex items-center gap-1"><Clock size={14} /> {msg.timestamp ? new Date(msg.timestamp.seconds * 1000).toLocaleDateString() : "Unknown Date"}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(msg.id!)}
                                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    title="Delete Message"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="bg-black/20 rounded-lg p-4 text-gray-300 whitespace-pre-wrap font-sans text-sm leading-relaxed border border-white/5">
                                {msg.message}
                            </div>

                            <div className="mt-4 text-xs font-bold text-blue-400">
                                From: {msg.name}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
