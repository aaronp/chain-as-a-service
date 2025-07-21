import React from "react";
import { MessageContent, StoredMessage } from "@/api/messages";

export default function NotificationMessageContentPanel({ msg, content }: { msg: StoredMessage, content: MessageContent }) {
    // TODO: Implement with real notification content UI
    return (
        <div className="p-4">
            <h2 className="font-bold text-lg mb-2">Notification</h2>
            <div className="text-sm mb-2">sent by {msg.senderAddress} on {new Date(msg.created).toLocaleString()}</div>
            <div className="text-sm">{(content as any).message}</div>
        </div>
    );
} 