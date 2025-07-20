import { Elysia, Static, t } from 'elysia';

// Message content types
export const SwapContentSchema = t.Object({
    type: t.Literal('swap'),
    counterparty: t.Object({
        tokenContractAddress: t.String(),
        amount: t.String(),
        recipientAddress: t.String(),
    }),
    sourceContractAddress: t.String(),
    amount: t.String(),
});

export const MessageContentSchema = t.Union([
    SwapContentSchema,
    // Add more content types here as needed
]);

// Message schema for POST requests
export const MessageSchema = t.Object({
    senderAddress: t.String(),
    recipientAddress: t.String(),
    content: MessageContentSchema,
});
export type Message = Static<typeof MessageSchema>;

// Stored message with timestamps
export const StoredMessageSchema = t.Object({
    messageId: t.String(),
    senderAddress: t.String(),
    recipientAddress: t.String(),
    content: MessageContentSchema,
    created: t.Number(), // timestamp (ms since epoch)
    read: t.Optional(t.Number()), // timestamp when read (ms since epoch), undefined if unread
});
export type StoredMessage = Static<typeof StoredMessageSchema>;

// Response for GET /messages
export const MessagesListResponseSchema = t.Object({
    messages: t.Array(StoredMessageSchema),
});
export type MessagesListResponse = Static<typeof MessagesListResponseSchema>;

// Response for POST /messages
export const CreateMessageResponseSchema = t.Object({
    messageId: t.String(),
});
export type CreateMessageResponse = Static<typeof CreateMessageResponseSchema>;

// In-memory message store
export function makeMessageStore() {
    const messages: StoredMessage[] = [];
    let nextMessageId = 1;

    return {
        create(message: Message) {
            const messageId = `msg_${nextMessageId++}`;
            const now = Date.now();
            const stored: StoredMessage = {
                messageId,
                ...message,
                created: now,
            };
            messages.push(stored);
            return { messageId };
        },
        markAsRead(messageId: string) {
            const message = messages.find(m => m.messageId === messageId);
            if (!message) {
                return null; // message not found
            }
            const updated: StoredMessage = {
                ...message,
                read: Date.now(),
            };
            const index = messages.findIndex(m => m.messageId === messageId);
            messages[index] = updated;
            return updated;
        },
        delete(messageId: string) {
            const index = messages.findIndex(m => m.messageId === messageId);
            if (index === -1) {
                return false; // message not found
            }
            messages.splice(index, 1);
            return true;
        },
        getUnreadByAddress(address: string) {
            return messages.filter(m =>
                m.recipientAddress === address && !m.read
            );
        },
        getAllByAddress(address: string) {
            return messages.filter(m =>
                m.senderAddress === address || m.recipientAddress === address
            );
        },
        getById(messageId: string) {
            return messages.find(m => m.messageId === messageId);
        }
    };
}

export const messageContext = new Elysia({ name: 'messageContext' })
    .state('messageStore', makeMessageStore());

export const messageRoutes = new Elysia({
    name: 'Messages',
    prefix: '/messages',
    detail: {
        tags: ['messages'],
        description: 'Message management',
    },
})
    .use(messageContext)
    // Get all messages for an address
    .get('/', ({ headers, store }) => {
        const address = headers.address;
        if (!address) {
            return new Response(JSON.stringify({ error: 'Address header is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        return { messages: store.messageStore.getAllByAddress(address) };
    }, {
        response: { 200: MessagesListResponseSchema },
        detail: {
            tags: ['messages'],
            description: 'Get all messages for an address',
        },
    })
    // Get unread messages for an address
    .get('/unread', ({ headers, store }) => {
        const address = headers.address;
        if (!address) {
            return new Response(JSON.stringify({ error: 'Address header is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        return { messages: store.messageStore.getUnreadByAddress(address) };
    }, {
        response: { 200: MessagesListResponseSchema },
        detail: {
            tags: ['messages'],
            description: 'Get unread messages for an address',
        },
    })
    // Create a new message
    .post('/', ({ body, store }) => {
        return store.messageStore.create(body);
    }, {
        body: MessageSchema,
        response: { 200: CreateMessageResponseSchema },
        detail: {
            tags: ['messages'],
            description: 'Create a new message',
        },
    })
    // Mark message as read
    .post('/mark-read/:messageId', ({ params, store }) => {
        const updated = store.messageStore.markAsRead(params.messageId);
        if (!updated) {
            return new Response(JSON.stringify({ error: 'Message not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        return updated;
    }, {
        params: t.Object({
            messageId: t.String(),
        }),
        response: { 200: StoredMessageSchema },
        detail: {
            tags: ['messages'],
            description: 'Mark a message as read',
        },
    })
    // Delete a message
    .delete('/:messageId', ({ params, store }) => {
        const deleted = store.messageStore.delete(params.messageId);
        if (!deleted) {
            return new Response(JSON.stringify({ error: 'Message not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        return { success: true };
    }, {
        params: t.Object({
            messageId: t.String(),
        }),
        response: { 200: t.Object({ success: t.Boolean() }) },
        detail: {
            tags: ['messages'],
            description: 'Delete a message',
        },
    });
