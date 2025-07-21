import React, { useEffect, useState } from "react";
import { useAccount } from "../account/AccountContext";
import { client } from "@/api/client";
import { StoredMessage, MessageContent } from "@/api/messages";
import { Button } from "../components/ui/button";

// Message content panels (stub for now)
function SwapMessageContentPanel({ content }: { content: MessageContent }) {
    // TODO: Implement with real swap content UI
    return (
        <div className="p-4">
            <h2 className="font-bold text-lg mb-2">Swap Message</h2>
            <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">{JSON.stringify(content, null, 2)}</pre>
        </div>
    );
}

function NotificationMessageContentPanel({ content }: { content: MessageContent }) {
    // TODO: Implement with real notification content UI
    return (
        <div className="p-4">
            <h2 className="font-bold text-lg mb-2">Notification</h2>
            <div className="text-sm">{(content as any).message}</div>
        </div>
    );
}

function MessageContentPanel({ content }: { content: MessageContent }) {
    if (content.type === "swap") {
        return <SwapMessageContentPanel content={content} />;
    }
    if (content.type === "notification") {
        return <NotificationMessageContentPanel content={content} />;
    }
    return (
        <div className="p-4 text-muted-foreground">Unknown message type</div>
    );
}

export default function Messages() {
    const { currentAccount } = useAccount();
    const [messages, setMessages] = useState<StoredMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
    const [markingRead, setMarkingRead] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

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

    const selectedMessage = messages.find((m) => m.messageId === selectedMessageId) || null;

    return (
        <div className="flex h-full min-h-[500px] border rounded-lg overflow-hidden bg-card">
            {/* Left pane: message list */}
            <div className="w-1/3 min-w-[260px] max-w-[400px] border-r bg-background overflow-y-auto">
                <div className="p-4 border-b font-semibold text-lg">Messages</div>
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
                    <MessageContentPanel content={selectedMessage.content} />
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        Select a message to view details
                    </div>
                )}
            </div>
        </div>
    );
}
