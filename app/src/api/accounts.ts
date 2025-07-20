import { Elysia, Static, t } from 'elysia';

// Account schema for POST requests
export const AccountSchema = t.Object({
    name: t.String(), // account name
    address: t.String(), // account address
    publicKey: t.String(), // public key
    additionalData: t.Optional(t.Record(t.String(), t.Any())), // optional additional data
});
export type Account = Static<typeof AccountSchema>;

// Stored account with created and updated timestamps
export const StoredAccountSchema = t.Object({
    name: t.String(),
    address: t.String(),
    publicKey: t.String(),
    additionalData: t.Optional(t.Record(t.String(), t.Any())),
    created: t.Number(), // timestamp (ms since epoch)
    updated: t.Number(), // timestamp (ms since epoch)
});
export type StoredAccount = Static<typeof StoredAccountSchema>;

// Update account schema for PATCH requests
export const UpdateAccountSchema = t.Object({
    address: t.Optional(t.String()),
    publicKey: t.Optional(t.String()),
    additionalData: t.Optional(t.Record(t.String(), t.Any())),
});
export type UpdateAccount = Static<typeof UpdateAccountSchema>;

// Response for GET /accounts
export const AccountsListResponseSchema = t.Object({
    accounts: t.Array(StoredAccountSchema),
});
export type AccountsListResponse = Static<typeof AccountsListResponseSchema>;

// In-memory account registry store
export function makeAccountRegistryStore() {
    const accounts: StoredAccount[] = [];
    return {
        add(account: Account) {
            if (accounts.some(a => a.name === account.name)) {
                return null; // duplicate name
            }
            const now = Date.now();
            const stored: StoredAccount = {
                ...account,
                created: now,
                updated: now,
            };
            accounts.push(stored);
            return stored;
        },
        update(name: string, updates: UpdateAccount) {
            const account = accounts.find(a => a.name === name);
            if (!account) {
                return null; // account not found
            }
            const updated: StoredAccount = {
                ...account,
                ...updates,
                updated: Date.now(),
            };
            const index = accounts.findIndex(a => a.name === name);
            accounts[index] = updated;
            return updated;
        },
        list() {
            return accounts;
        },
        getByName(name: string) {
            return accounts.find(a => a.name === name);
        }
    };
}

export const accountContext = new Elysia({ name: 'accountContext' })
    .state('accountRegistry', makeAccountRegistryStore());

export const accountRoutes = new Elysia({
    name: 'Accounts',
    prefix: '/accounts',
    detail: {
        tags: ['accounts'],
        description: 'Account registry',
    },
})
    .use(accountContext)
    // List accounts
    .get('/', ({ store }) => {
        return { accounts: store.accountRegistry.list() };
    }, {
        response: { 200: AccountsListResponseSchema },
    })
    // Add an account
    .post('/', ({ body, store }) => {
        const stored = store.accountRegistry.add(body);
        if (!stored) {
            return new Response(JSON.stringify({ error: 'Account name already exists' }), {
                status: 409,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        return stored;
    }, {
        body: AccountSchema,
        response: { 200: StoredAccountSchema },
        detail: {
            tags: ['accounts'],
            description: 'Register a new account',
        },
    })
    // Update an account
    .patch('/:name', ({ params, body, store }) => {
        const updated = store.accountRegistry.update(params.name, body);
        if (!updated) {
            return new Response(JSON.stringify({ error: 'Account not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        return updated;
    }, {
        params: t.Object({
            name: t.String(),
        }),
        body: UpdateAccountSchema,
        response: { 200: StoredAccountSchema },
        detail: {
            tags: ['accounts'],
            description: 'Update an existing account',
        },
    });
