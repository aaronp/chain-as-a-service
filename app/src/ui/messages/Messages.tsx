import React, { useEffect, useState } from "react";
import { useAccount } from "../account/AccountContext";
import { client } from "@/api/client";
import { StoredMessage, MessageContent } from "@/api/messages";
import { Button } from "../components/ui/button";
import MessageContentPanel from "./MessageContentPanel";
import { Pencil } from "lucide-react";
import ChooseAccount from "../account/ChooseAccount";
import { StoredAccount } from "@/api/accounts";

export default function Messages() {
    const { currentAccount } = useAccount();
    const [messages, setMessages] = useState<StoredMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
    const [markingRead, setMarkingRead] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    // New message modal state
    const [showNewMessage, setShowNewMessage] = useState(false);
    const [recipient, setRecipient] = useState<StoredAccount | null>(null);
    const [body, setBody] = useState("");
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);

    useEffect(() => {
        if (!currentAccount) return;
        setLoading(true);
        setError(null);
        client()
            .messages(currentAccount)
            .getAll()
            .then((result) => {
                if (Array.isArray(result)) {
                    setMessages(result);
                } else {
                    setError(result.error || "Failed to fetch messages");
                }
            })
            .finally(() => setLoading(false));
    }, [currentAccount]);

    const handleMarkAsRead = async (messageId: string) => {
        if (!currentAccount) return;
        setMarkingRead(messageId);
        try {
            const result = await client().messages(currentAccount).markAsRead(messageId);
            if ((result as any).error) {
                setError((result as any).error);
            } else {
                setMessages((msgs) =>
                    msgs.map((m) => (m.messageId === messageId ? (result as StoredMessage) : m))
                );
            }
        } finally {
            setMarkingRead(null);
        }
    };

    const handleNewMessage = () => {
        setShowNewMessage(true);
        setRecipient(null);
        setBody("");
        setSendError(null);
    };

    const handleSend = async () => {
        if (!currentAccount || !recipient || !body.trim()) return;
        setSending(true);
        setSendError(null);
        try {
            const result = await client().messages(currentAccount).send(recipient.address, {
                type: "notification",
                message: body.trim(),
            });
            if ((result as any).error) {
                setSendError((result as any).error);
            } else {
                setShowNewMessage(false);
                setRecipient(null);
                setBody("");
                // Optionally refresh messages
                setMessages((msgs) => Array.isArray(result) ? result : msgs);
            }
        } catch (e: any) {
            setSendError(e.message || "Failed to send message");
        } finally {
            setSending(false);
        }
    };

    const selectedMessage = messages.find((m) => m.messageId === selectedMessageId) || null;

    return (
        <div className="flex h-full min-h-[500px] border rounded-lg overflow-hidden bg-card">
            {/* Left pane: message list */}
            <div className="w-1/3 min-w-[260px] max-w-[400px] border-r bg-background overflow-y-auto">
                <div className="p-4 border-b font-semibold text-lg flex items-center justify-between">
                    <span>Messages</span>
                    <Button size="icon" variant="outline" className="ml-2 rounded-full" onClick={handleNewMessage}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                </div>
                {loading ? (
                    <div className="p-4 text-muted-foreground">Loading...</div>
                ) : error ? (
                    <div className="p-4 text-red-600">{error}</div>
                ) : (
                    <table className="w-full text-sm">
                        <tbody>
                            {messages.length === 0 && (
                                <tr>
                                    <td className="p-4 text-muted-foreground">No messages</td>
                                </tr>
                            )}
                            {messages.map((msg) => {
                                const isSelected = msg.messageId === selectedMessageId;
                                const isUnread = !msg.read;
                                return (
                                    <tr
                                        key={msg.messageId}
                                        className={
                                            "group cursor-pointer border-b last:border-b-0 transition " +
                                            (isSelected ? "bg-accent" : "hover:bg-muted/50")
                                        }
                                        onClick={() => setSelectedMessageId(msg.messageId)}
                                    >
                                        <td className="relative p-3 align-middle w-2">
                                            {isUnread && (
                                                <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2" />
                                            )}
                                        </td>
                                        <td className="p-3 align-middle w-full">
                                            <div className="font-medium truncate">
                                                {msg.content.type === "swap"
                                                    ? "Swap Request"
                                                    : msg.content.type === "notification"
                                                        ? "Notification"
                                                        : "Message"}
                                            </div>
                                            <div className="text-xs text-muted-foreground truncate">
                                                {msg.content.type === "notification"
                                                    ? (msg.content as any).message
                                                    : msg.content.type === "swap"
                                                        ? `Swap ${msg.content.amount} from ${msg.senderAddress.slice(0, 6)}...`
                                                        : ""}
                                            </div>
                                        </td>
                                        <td className="p-3 align-middle text-right">
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                                {isUnread && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={markingRead === msg.messageId}
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            handleMarkAsRead(msg.messageId);
                                                        }}
                                                    >
                                                        {markingRead === msg.messageId ? "..." : "Mark as read"}
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
            {/* Right pane: message content */}
            <div className="flex-1 min-w-0 bg-background">
                {selectedMessage ? (
                    <MessageContentPanel msg={selectedMessage} content={selectedMessage.content} />
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        Select a message to view details
                    </div>
                )}
            </div>
            {/* New Message Modal */}
            {showNewMessage && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
                    <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-lg p-6 w-full max-w-md border">
                        <h2 className="text-xl font-semibold mb-4">New Message</h2>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">To</label>
                            <ChooseAccount onAccountSelected={setRecipient} />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Message</label>
                            <textarea
                                className="w-full border border-input rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground min-h-[80px]"
                                value={body}
                                onChange={e => setBody(e.target.value)}
                                placeholder="Type your message..."
                                disabled={sending}
                            />
                        </div>
                        {sendError && <div className="text-red-600 mb-2 text-sm">{sendError}</div>}
                        <div className="flex justify-end gap-2">
                            <Button variant="secondary" onClick={() => setShowNewMessage(false)} disabled={sending}>Cancel</Button>
                            <Button variant="outline" onClick={handleSend} disabled={sending || !recipient || !body.trim()}>
                                {sending ? "Sending..." : "Send"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
