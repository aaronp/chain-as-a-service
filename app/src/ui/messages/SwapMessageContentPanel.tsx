import React from "react";
import { MessageContent } from "@/api/messages";

export default function SwapMessageContentPanel({ content }: { content: MessageContent }) {
    // TODO: Implement with real swap content UI
    return (
        <div className="p-4">
            <h2 className="font-bold text-lg mb-2">Swap Message</h2>
            <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">{JSON.stringify(content, null, 2)}</pre>
        </div>
    );
} 