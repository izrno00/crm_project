import "server-only";

// The current time, for server components that show ages ("waiting 3 days").
//
// With Cache Components, reading the clock is only allowed at request time. Call this only
// AFTER awaiting something request-specific (the session through lib/dal.ts, or a database
// query), never at the top of a component. Pass the result to the helpers in lib/format.ts,
// which stay pure so they can be unit-tested.
export const requestTime = () => Date.now();
