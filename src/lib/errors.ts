// Postgres's unique_violation code — see the unique indexes in the
// migrations for items/groups names. The database is the real source of
// truth for uniqueness (another tab, or your partner, could win a race the
// client-side check can't see); this just turns that error into something
// readable instead of the raw constraint-violation message.
const UNIQUE_VIOLATION = '23505'

export function friendlyError(
  error: { code?: string; message: string },
  duplicateMessage: string,
): string {
  return error.code === UNIQUE_VIOLATION ? duplicateMessage : error.message
}
