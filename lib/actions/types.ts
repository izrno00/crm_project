// State returned by auth/account server actions and consumed with useActionState.
// Never put passwords in `values`: it is used to refill non-sensitive inputs.
export type ActionState = {
  ok: boolean;
  /** Form-level message (shown in an Alert or toast). */
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
} | null;

// Result of a button-style server action (Tech.md §2). The client shows `message` or `error` in a
// toast. Actions that redirect on success never return, so they only ever return the error case.
export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

// Result of sending a reply (Tech.md §9.2). `saved` tells the composer whether the reply now exists
// in the history (it was sent, or it failed and can be retried there). Only when nothing was saved
// does the composer keep the owner's text.
export type ReplyResult =
  | { ok: true; message: string }
  | { ok: false; saved: boolean; error: string };
