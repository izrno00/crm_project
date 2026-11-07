// State returned by auth/account server actions and consumed with useActionState.
// Never put passwords in `values`: it is used to refill non-sensitive inputs.
export type ActionState = {
  ok: boolean;
  /** Form-level message (shown in an Alert or toast). */
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
} | null;
