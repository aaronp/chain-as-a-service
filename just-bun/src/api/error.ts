
import { Static, t } from 'elysia';

export const ErrorResponseSchema = t.Object({
    error: t.String()
});
export type ErrorResponse = Static<typeof ErrorResponseSchema>;
