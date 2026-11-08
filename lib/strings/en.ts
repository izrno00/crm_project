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
    replyRequired: "Write a reply first.",
    replyTooLong: (max: number) => `Use at most ${max.toLocaleString("en-GB")} characters.`,
    senderNameRequired: "Enter a sender name.",
    senderNameTooLong: "Use at most 200 characters.",
    replyToInvalid: "Enter a valid email address, or leave this empty.",
    signatureTooLong: (max: number) => `Use at most ${max.toLocaleString("en-GB")} characters.`,
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
    inquiry_deleted: "Inquiry deleted.",
    customer_deleted: "Customer and all of their inquiries deleted.",
    inquiry_marked_unread: "Marked as unread.",
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

  nav: {
    dashboard: "Dashboard",
    inquiries: "Inquiries",
    settings: "Settings",
    toggleTheme: "Toggle theme",
    openMenu: "Account menu",
    signedInAs: "Signed in as",
    mainNavigation: "Main navigation",
  },

  status: {
    new: "New",
    awaiting: "Awaiting response",
    answered: "Answered",
  },

  time: {
    justNow: "just now",
    minutes: (n: number) => (n === 1 ? "1 minute" : `${n} minutes`),
    hours: (n: number) => (n === 1 ? "1 hour" : `${n} hours`),
    days: (n: number) => (n === 1 ? "1 day" : `${n} days`),
    ago: (age: string) => `${age} ago`,
  },

  // Public intake API (Tech.md §7). These messages are shown to website visitors.
  intake: {
    errors: {
      invalid_body: "We couldn't read that submission.",
      validation_failed: "Some fields are missing or invalid.",
      invalid_form_key: "This form isn't set up to accept messages.",
      origin_not_allowed: "This website isn't allowed to send messages through this form.",
      payload_too_large: "That submission is too large.",
      unsupported_media_type: "That content type isn't supported.",
      rate_limited: "Too many submissions. Please wait a few minutes and try again.",
      server_error: "Something went wrong on our side. Please try again later.",
    },
    fields: {
      nameRequired: "Enter your name.",
      nameTooLong: "Use at most 200 characters.",
      nameInvalid: "Remove line breaks and special characters.",
      emailRequired: "Enter your email address.",
      emailInvalid: "Enter a valid email address.",
      emailTooLong: "Use at most 254 characters.",
      subjectRequired: "Enter a subject.",
      subjectTooLong: "Use at most 200 characters.",
      subjectInvalid: "Remove line breaks from the subject.",
      messageRequired: "Enter a message.",
      messageTooLong: "Use at most 5000 characters.",
      messageInvalid: "Remove special characters from the message.",
    },
  },

  // Fallback page for plain HTML forms with no redirect page of their own (PRD INT-7).
  formResult: {
    successTitle: "Thank you!",
    successBody: "Your message was sent. The business will get back to you by email.",
    errorTitle: "We couldn't send your message",
    fieldsIntro: "Please check these fields:",
    fieldLabels: {
      name: "Name",
      email: "Email",
      subject: "Subject",
      message: "Message",
    },
    unknownError: "Something went wrong. Please go back and try again.",
    back: "Go back",
  },

  dashboard: {
    title: "Dashboard",
    welcome: (business: string) => `Here's what's happening at ${business}.`,
    unread: "Unread",
    stats: {
      total: { label: "Total inquiries", hint: "All time, archived excluded" },
      new: { label: "New", hint: "Unanswered, under 48 hours old" },
      awaiting: { label: "Awaiting response", hint: "Unanswered for 48 hours or more" },
      answered: { label: "Answered", hint: "Replied to or marked as answered" },
    },
    chart: {
      title: "Activity",
      description: "Inquiries received per day over the last 30 days",
      series: "Inquiries",
      summary: (total: number) =>
        total === 1 ? "1 inquiry in the last 30 days" : `${total} inquiries in the last 30 days`,
    },
    recent: {
      title: "Recent inquiries",
      description: "The 5 most recent to arrive",
      empty: "No inquiries to show.",
      viewAll: "View all inquiries",
    },
    attention: {
      title: "Needs attention",
      description: "Unanswered inquiries, oldest first",
      empty: "You're all caught up. Every inquiry has an answer.",
      viewAll: "View all unanswered",
      waiting: (age: string) => `Waiting ${age}`,
    },
    feed: {
      title: "Recent activity",
      description: "The latest events across your inquiries",
      empty: "Activity will appear here as inquiries come in.",
      unknownCustomer: "a customer",
      events: {
        received: (name: string) => `New inquiry from ${name}`,
        reply_sent: (name: string) => `Reply sent to ${name}`,
        reply_failed: (name: string) => `Reply to ${name} failed to send`,
        marked_answered: (name: string) => `Marked ${name}'s inquiry as answered`,
        marked_unanswered: (name: string) => `Marked ${name}'s inquiry as unanswered`,
        archived: (name: string) => `Archived ${name}'s inquiry`,
        restored: (name: string) => `Restored ${name}'s inquiry`,
      },
    },
    empty: {
      title: "No inquiries yet",
      description:
        "Inquiries appear here as soon as someone submits the contact form on your connected website. Once your form is connected, send a test message to see it arrive.",
    },
    loadError: "We couldn't load this section. Refresh the page to try again.",
  },

  appError: {
    title: "Something went wrong",
    description: "We couldn't load this page. Try again, and if it keeps happening, contact your administrator.",
    retry: "Try again",
  },

  inquiries: {
    listTitle: "Inquiries",
    detailTitle: "Inquiry",
    backToInquiries: "Back to inquiries",

    // The detail page (PRD §5.5, Tech.md §11.4).
    detail: {
      back: "Inquiries",
      backLabel: "Back to the list of inquiries",
      archivedBadge: "Archived",
      notFound: {
        title: "Inquiry not found",
        description:
          "This inquiry doesn't exist or has been deleted. Check the link, or go back to your inquiries.",
      },
      banner: {
        title: "This inquiry is archived",
        description:
          "It is hidden from your inquiry list and from the dashboard numbers. Restore it to change its status.",
      },
      actions: {
        label: "Inquiry actions",
        more: "More actions",
        markAnswered: "Mark as answered",
        markUnanswered: "Mark as unanswered",
        markUnread: "Mark as unread",
        archive: "Archive",
        restore: "Restore",
        deleteInquiry: "Delete inquiry",
        deleteCustomer: "Delete customer",
        working: "Working…",
      },
      toasts: {
        answered: "Marked as answered.",
        unanswered: "Marked as unanswered.",
        archived: "Inquiry archived.",
        restored: "Inquiry restored.",
        replySent: "Reply sent.",
        replyFailed: (reason: string) => `Reply not sent. ${reason}`,
      },
      errors: {
        generic: "Something went wrong. Please try again.",
        notFound: "This inquiry no longer exists.",
        alreadyAnswered: "This inquiry was already answered.",
        cannotUnanswer:
          "This can't be undone because the inquiry was answered with an email reply.",
        alreadyArchived: "This inquiry was already archived.",
        notArchived: "This inquiry isn't archived.",
        alreadyReplied: "This inquiry already has a reply.",
        archivedReadOnly: "This inquiry is archived. Restore it first.",
        cannotRetry: "This reply can't be sent again right now. Reload the page to see its status.",
      },
      deleteInquiryDialog: {
        title: "Delete this inquiry?",
        description: (replies: number) =>
          `This permanently deletes the inquiry and its history${
            replies > 0 ? `, including ${replies === 1 ? "1 reply" : `${replies} replies`}` : ""
          }. This can't be undone.`,
        confirm: "Delete inquiry",
        cancel: "Cancel",
      },
      deleteCustomerDialog: {
        title: (name: string) => `Delete ${name || "this customer"}?`,
        description: (email: string, inquiries: number, replies: number) =>
          `This permanently deletes ${email} and everything linked to them: ${
            inquiries === 1 ? "1 inquiry" : `${inquiries} inquiries`
          } and ${replies === 1 ? "1 reply" : `${replies} replies`}. This can't be undone.`,
        confirm: "Delete customer",
        cancel: "Cancel",
      },
      composer: {
        heading: "Reply",
        to: "To",
        from: "From",
        subject: "Subject",
        label: "Your reply",
        placeholder: (name: string) => `Write your reply to ${name || "the customer"}…`,
        counter: (length: number, max: number) =>
          `${length.toLocaleString("en-GB")} / ${max.toLocaleString("en-GB")}`,
        signatureNote: "Added below your reply, followed by the customer's original message:",
        shortcut: "Ctrl + Enter to send",
        send: "Send reply",
        sending: "Sending…",
      },
      original: {
        heading: "Original message",
        from: (name: string) => `From ${name}`,
      },
      timeline: {
        label: "Communication history",
        reply: "Your reply",
        showFullEmail: "Show full email",
        hideFullEmail: "Hide full email",
        failedWith: (reason: string) => `Failed: ${reason}`,
        failedUnknownReason: "Failed",
        states: {
          sent: "Sent",
          failed: "Failed",
          sending: "Sending…",
          unknown: "Unknown",
        },
        unknownHelp: "This reply may not have been sent. Check before trying again.",
        retry: "Retry",
        retrying: "Sending…",
        events: {
          marked_answered: "Marked as answered manually",
          marked_unanswered: "Marked as unanswered",
          archived: "Archived",
          restored: "Restored",
        },
      },
      customer: {
        heading: "Customer",
        email: "Email",
      },
      info: {
        heading: "Details",
        status: "Status",
        received: "Received",
        website: "Website",
        unknownWebsite: "—",
      },
    },

    unread: "Unread",
    filters: {
      label: "Filter by status",
      all: "All",
      unanswered: "Unanswered",
      new: "New",
      awaiting: "Awaiting response",
      answered: "Answered",
      archived: "Archived",
    },
    search: {
      label: "Search inquiries",
      placeholder: "Search by name, email or subject",
      clear: "Clear search",
    },
    sort: {
      label: "Sort by received date",
      desc: "Newest first",
      asc: "Oldest first",
    },
    columns: {
      status: "Status",
      customer: "Customer",
      subject: "Subject",
      website: "Website",
      received: "Received",
    },
    tableCaption: "Your inquiries, with their status, customer, subject and when they were received",
    unknownWebsite: "—",
    summary: (from: number, to: number, total: number) =>
      total === 1
        ? "Showing 1 inquiry"
        : `Showing ${from.toLocaleString("en-GB")}–${to.toLocaleString("en-GB")} of ${total.toLocaleString("en-GB")}`,
    pagination: {
      label: "Pagination",
      previous: "Previous",
      next: "Next",
      goToPage: (page: number) => `Go to page ${page}`,
      pageOf: (page: number, pageCount: number) => `Page ${page} of ${pageCount}`,
    },
    empty: {
      searchTitle: (query: string) => `No results for “${query}”`,
      searchDescription:
        "Nothing matches in the current view. Check the spelling or try a different name, email or subject.",
      clearSearch: "Clear search",
      filterTitle: "No inquiries here",
      filterDescription: (filter: string) => `You have no inquiries under “${filter}”.`,
      showAll: "Show all inquiries",
    },
  },

  // Plain-language reasons for a reply the email provider did not accept (PRD REP-8). The
  // provider's own error text is stored for support but never shown (Tech.md §9.1).
  sendErrors: {
    testing:
      "Flowdesk can't send to this address yet because email sending is still being set up. Contact your administrator.",
    sender: "The sender address isn't ready for sending yet. Contact your administrator, then retry.",
    recipient: "The customer's email address was rejected. Check that it's correct.",
    rateLimited: "Too many emails were sent at once. Wait a minute, then retry.",
    quota: "The email sending limit has been reached. Contact your administrator.",
    config: "Email sending isn't set up correctly. Contact your administrator.",
    unavailable: "The email provider couldn't be reached. Please retry.",
    rejected:
      "The email provider didn't accept this email. Retry, or contact your administrator if it keeps failing.",
  },

  settings: {
    title: "Settings",
    description: "Manage your account and how your replies to customers are sent.",
    tabs: {
      label: "Settings sections",
      account: "Account",
      email: "Email",
    },
    email: {
      title: "Email",
      cardTitle: "Replies to customers",
      cardDescription:
        "How your replies look to customers, and where their answers go.",
      senderName: "Sender name",
      senderNameHelp: "Customers see this name as the sender of your replies.",
      senderAddress: "Sender address",
      senderAddressHelp: "Managed by your Flowdesk administrator.",
      replyTo: "Reply-to address",
      replyToHelp: (email: string) =>
        `When a customer answers your reply, it goes here. Leave empty to use your business email (${email}).`,
      signature: "Signature",
      signatureHelp: "Added below every reply. Leave empty to use the default shown here.",
      bcc: "BCC me on replies",
      bccHelp: (email: string) => `Send a copy of every reply to ${email}.`,
      submit: "Save email settings",
      saved: "Email settings saved.",
      errors: {
        generic: "Something went wrong. Please try again.",
      },
    },
  },

  emails: {
    reply: {
      quoteHeader: (date: string, name: string) => `On ${date}, ${name} wrote:`,
    },
    newInquiry: {
      subject: (subject: string) => `New inquiry: ${subject}`,
      preview: (name: string) => `${name} sent you a message through your website.`,
      heading: "You have a new inquiry",
      from: "From",
      subjectLabel: "Subject",
      website: "Website",
      received: "Received",
      open: "Open in Flowdesk",
      footer: (business: string) =>
        `You're receiving this because new-inquiry notifications are turned on for ${business}.`,
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
