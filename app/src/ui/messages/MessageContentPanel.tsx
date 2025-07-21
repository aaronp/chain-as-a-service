import React from "react";
import { MessageContent, StoredMessage } from "@/api/messages";
import SwapMessageContentPanel from "./SwapMessageContentPanel";
import NotificationMessageContentPanel from "./NotificationMessageContentPanel";

export default function MessageContentPanel({ msg, content }: { msg: StoredMessage, content: MessageContent }) {
    if (content.type === "swap") {
        return <SwapMessageContentPanel content={content} />;
    }
    if (content.type === "notification") {
        return <NotificationMessageContentPanel msg={msg} content={content} />;
    }
    return (
        <div className="p-4 text-muted-foreground">Unknown message type</div>
    );
}
