// All user-facing copy lives here so the UI can be translated later (Tech.md §12).

export const en = {
  brand: "Flowdesk",

  validation: {
    emailRequired: "Enter your email address.",
    emailInvalid: "Enter a valid email address.",
    passwordRequired: "Enter your password.",
    passwordTooShort: "Use at least 8 characters.",
    passwordTooLong: "Use at most 72 characters.",
    passwordNeedsLetter: "Include at least one letter.",
    passwordNeedsDigit: "Include at least one number.",
    passwordMismatch: "The passwords don't match.",
    currentPasswordRequired: "Enter your current password.",
    nameRequired: "Enter your name.",
    nameTooLong: "Use at most 200 characters.",
    emailUnchanged: "That is already your login email.",
    passwordUnchanged: "Choose a password that is different from your current one.",
  },

  auth: {
    login: {
      title: "Sign in",
      description: "Use your email and password to open your dashboard.",
      email: "Email",
      password: "Password",
      submit: "Sign in",
      forgot: "Forgot password?",
      invalidCredentials: "Incorrect email or password.",
      rateLimited: "Too many attempts. Wait a few minutes and try again.",
      generic: "Something went wrong. Please try again.",
      errors: {
        link_invalid:
          "That link is invalid or has expired. Request a new one, or ask your administrator to resend your invitation.",
        no_business:
          "Your account isn't linked to a business yet. Contact your administrator.",
      },
    },
    forgot: {
      title: "Forgot your password?",
      description: "Enter your email and we'll send you a link to set a new one.",
      email: "Email",
      submit: "Send reset link",
      back: "Back to sign in",
      sent: "If an account exists for that email, we sent a link to reset the password.",
    },
    updatePassword: {
      title: "Set a new password",
      description: "Choose a new password for your account.",
      password: "New password",
      confirm: "Confirm new password",
      submit: "Update password",
      hint: "At least 8 characters, with letters and numbers.",
    },
    acceptInvite: {
      title: "Welcome to Flowdesk",
      description: "Set your name and a password to finish creating your account.",
      name: "Full name",
      password: "Password",
      confirm: "Confirm password",
      submit: "Create account",
      hint: "At least 8 characters, with letters and numbers.",
    },
    signOut: "Sign out",
    loading: "Loading…",
    sessionExpired: "Your session has expired. Sign in again to continue.",
  },

  notices: {
    password_updated: "Your password was updated.",
    email_change_partial:
      "Almost done: confirm the link we sent to your other address to finish changing your email.",
    email_changed: "Your login email was changed.",
  },

  account: {
    title: "Account",
    description: "Manage your name, login email and password.",
    name: {
      title: "Name",
      description: "This name is shown in the app and used in your reply signature.",
      label: "Full name",
      submit: "Save name",
      saved: "Your name was saved.",
    },
    email: {
      title: "Login email",
      description:
        "You sign in with this address. To change it, confirm the link we send to both your current and your new address.",
      current: "Current email",
      label: "New email",
      submit: "Change email",
      sent: "We sent a confirmation link to your current and your new address. Open both to finish the change.",
      pending: (email: string) => `Change to ${email} is waiting for confirmation from both addresses.`,
    },
    password: {
      title: "Password",
      description: "Choose a new password. You'll need your current one.",
      current: "Current password",
      new: "New password",
      confirm: "Confirm new password",
      submit: "Change password",
      saved: "Your password was changed.",
      currentWrong: "That isn't your current password.",
    },
    errors: {
      generic: "Something went wrong. Please try again.",
      rateLimited: "Too many attempts. Wait a few minutes and try again.",
      emailTaken: "That email can't be used.",
    },
  },

  placeholder: {
    dashboardTitle: "Dashboard",
    dashboardBody: (name: string, business: string) => `Signed in as ${name} · ${business}`,
    adminTitle: "Admin",
    adminBody: "The admin area is coming soon.",
    nav: { dashboard: "Dashboard", account: "Account", admin: "Admin" },
  },
} as const;
