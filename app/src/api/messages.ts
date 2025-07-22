import { Elysia, Static, t } from 'elysia';

// Message content types
export const SwapContentSchema = t.Object({
    type: t.Literal('swap'),
    chainId: t.String({ description: "The chain ID of the swap" }),
    counterparty: t.Object({
        tokenContractAddress: t.String({ description: "The address of the ERC20 compatible contract" }),
        amount: t.String({ description: "The amount of tokens from this token contract address to swap" }),
        recipientAddress: t.String({ description: "The address of the recipient" }),
    }),
    sourceContractAddress: t.String({ description: "The address of the source ERC20 compatible contract" }),
    originAccountAddress: t.String({ description: "The originating address" }),
    amount: t.String({ description: "The amount of tokens from the source contract address to swap" }),
    swapContractAddress: t.String({ description: "The address of the swap contract" }),
});
export type SwapContent = Static<typeof SwapContentSchema>;

export const NotificationContentSchema = t.Object({
    type: t.Literal('notification'),
    message: t.String(),
});

export const MessageContentSchema = t.Union([
    SwapContentSchema,
    NotificationContentSchema
    // Add more content types here as needed
]);
export type MessageContent = Static<typeof MessageContentSchema>;

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
        countByAddress(address: string) {

            const all = messages.filter(m =>
                m.recipientAddress === address
            );
            const unread = all.filter(m => !m.read);
            return { unread: unread.length, all: all.length };
        },
        getUnreadByAddress(address: string) {
            return messages.filter(m =>
                m.recipientAddress === address && !m.read
            );
        },
        getAllByAddress(address: string) {
            return messages.filter(m =>
                m.recipientAddress === address
            );
        },
        getSentByAddress(address: string) {
            return messages.filter(m =>
                m.senderAddress === address
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
    .get('/count', ({ headers, store }) => {
        const address = headers.address;
        if (!address) {
            return new Response(JSON.stringify({ error: 'Address header is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        const { all, unread } = store.messageStore.countByAddress(address)
        return { total: all, unread };
    }, {
        response: { 200: t.Object({ total: t.Number(), unread: t.Number() }) },
        detail: {
            tags: ['messages'],
            description: 'Get count of messages for an address',
        },
    })
    .get('/sent', ({ headers, store }) => {
        const address = headers.address;
        if (!address) {
            return new Response(JSON.stringify({ error: 'Address header is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        return { messages: store.messageStore.getSentByAddress(address) };
    }, {
        response: { 200: MessagesListResponseSchema },
        detail: {
            tags: ['messages'],
            description: 'Get all messages sent by an address',
        },
    })
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
