
import { Static, t } from 'elysia';

export const ErrorResponseSchema = t.Object({
    error: t.String()
});
export type ErrorResponse = Static<typeof ErrorResponseSchema>;

export const isErrorResponse = (x: any): x is ErrorResponse => x && typeof x.error === 'string';
