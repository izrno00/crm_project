# Flowdesk: Product Requirements Document

| | |
|---|---|
| Product | Flowdesk, a multi-business inquiry CRM |
| Document owner | Platform administrator (Ivan Zrno) |
| Status | Agreed for MVP development |
| Last updated | 2026-11-06 |
| Related documents | [Tech.md](Tech.md) (architecture and implementation), [DB.md](DB.md) (database schema) |

This document describes **what** Flowdesk does and **why**. It does not cover how it is built; see Tech.md and DB.md for that.

---

## 1. Overview

### 1.1 Problem
Small businesses usually receive website inquiries as plain emails. Those emails get lost among other mail, nobody knows which ones have been answered, and there is no shared history of the conversation with each customer.

### 1.2 Solution
Flowdesk is one central CRM application that many independent businesses use at the same time. Each business connects its own website contact form(s) to Flowdesk. When a visitor submits the form, the inquiry appears in that business's Flowdesk dashboard. The business owner can review it, reply to the customer by email directly from Flowdesk, and track which inquiries still need attention.

### 1.3 Core idea
> A visitor submits a form on a business's website → the inquiry appears in that business's Flowdesk dashboard → the owner replies from Flowdesk → the customer receives the reply by email → the reply is saved in the inquiry's history.

### 1.4 Product principles
- **Focused.** Flowdesk is about inquiry management, not a general-purpose CRM.
- **Simple and polished.** The interface is clean and intuitive, and should need no training.
- **One application for everyone.** A new business is onboarded by configuration, not by a new app, database or deployment.
- **Isolated data.** A business can never see or change another business's data. The database enforces this, not just the user interface.
- **Website-agnostic.** Any website that can send an HTTP request can connect, whether it is built with Next.js, WordPress, plain HTML or anything else.

---

## 2. Goals and success criteria

### 2.1 Goals
1. Businesses receive all website inquiries in one dashboard instead of their email inbox.
2. Owners can see at a glance what needs attention: new and overdue inquiries.
3. Owners can reply to customers by email without leaving Flowdesk, and keep a history of every reply.
4. The platform administrator can onboard a new business in minutes, without technical work per client beyond connecting the website form.

### 2.2 Success criteria for the MVP
- A website form submission appears in the correct business's dashboard within seconds.
- An owner can find any inquiry by name, email or subject, and filter by status.
- An owner can send a reply. The reply's result (sent or failed) is shown clearly, and a failed reply can be retried.
- Two businesses on the platform cannot access each other's data under any circumstances.
- The administrator can create a business, invite its owner and connect a website through the admin area alone.

### 2.3 Non-goals (MVP)
- Customers do not log in to Flowdesk.
- Customer email replies are not imported into Flowdesk yet (planned; see §11).
- No invoicing, payments, sales pipeline, marketing or analytics beyond the dashboard.
- No public self-registration for businesses (planned; see §11).

---

## 3. Users and roles

| Role | Who | Has a Flowdesk account? | Main capabilities |
|---|---|---|---|
| **Platform administrator** | The Flowdesk operator | Yes (admin access) | Create and configure businesses, invite owners, connect websites, configure sender identities, suspend or reactivate businesses |
| **Business owner** | One person per business (MVP) | Yes | Use the dashboard, manage inquiries, reply to customers, manage business, email and account settings |
| **Website visitor / customer** | Anyone submitting a business's contact form | No | Submit an inquiry; receive email replies |

Notes:
- The MVP assumes **one owner per business** and **one business per owner**. The product is designed so that a business can later have several team members, and a person can later belong to several businesses.
- The platform administrator **cannot** read a business's inquiries, customers or messages inside Flowdesk. Admin access covers account and configuration management only.

---

## 4. Key concepts (glossary)

| Term | Meaning |
|---|---|
| **Business** | An independent company using Flowdesk. It has its own settings, connected websites, customers, inquiries and messages. |
| **Owner** | The person who manages a business in Flowdesk. |
| **Connected website (source)** | A website or form that is allowed to send inquiries to a business. A business can have several. Each has its own **form key** and a list of allowed website addresses. |
| **Form key** | A public identifier placed in a website's form so Flowdesk knows which business and website an inquiry belongs to. It is not a password; security comes from the allowed-address check and the spam controls. |
| **Inquiry** | One form submission: name, email, subject, message, date and time, and which website it came from. |
| **Customer** | A person who has contacted a business, identified by email address. Inquiries from the same email to the same business are grouped under one customer. |
| **Message / reply** | An email sent by the owner to the customer from within Flowdesk, stored in the inquiry's communication history. |
| **Communication history (timeline)** | The chronological list of everything that happened on an inquiry: replies sent, failed sends, status changes, archiving. |
| **Sender identity** | The "From" name and address that customers see on replies, plus the reply-to address. |

---

## 5. Functional requirements

Requirement IDs are used for traceability in development and testing.

### 5.1 Website connection and inquiry intake

| ID | Requirement |
|---|---|
| INT-1 | Each business can have **one or more connected websites**. Each connected website has a name, a form key, a list of allowed website addresses, and an active/inactive state. |
| INT-2 | A connected website submits inquiries to Flowdesk with these fields, **all required**: **name**, **email**, **subject**, **message**. |
| INT-3 | Flowdesk accepts a submission only if the form key is valid, the connected website is active, the business is active, and the request comes from one of that website's **allowed addresses**. |
| INT-4 | Flowdesk always validates submissions on its side: required fields, a valid email format and maximum lengths. Invalid submissions are rejected with a clear error the website can show. |
| INT-5 | Flowdesk limits how many submissions it accepts in a short time period (per visitor and per website), and rejects oversized requests. |
| INT-6 | **Optional spam trap (honeypot):** a website may include a hidden field that humans never fill in. If the field is filled, Flowdesk silently discards the submission, but the visitor still sees a normal success result. Websites that do **not** include this field must still work normally. |
| INT-7 | A website can either show the result itself (for JavaScript-based forms), or have Flowdesk send the visitor back to a "thank you" page on the business's own website (for plain HTML forms). That page must be on one of the allowed addresses. |
| INT-8 | Each stored inquiry records **which connected website** it came from, and its submission date and time. |
| INT-9 | If the email address has contacted this business before, the new inquiry is linked to the **existing customer**; otherwise a new customer is created. |
| INT-10 | Visitors do **not** receive an automatic confirmation email in the MVP. |
| INT-11 | Owners can see, read-only, an **Integration guide** for each connected website. It contains a copy-paste HTML form and a JavaScript example with the form key filled in, plus a short privacy-notice line for the form. |
| INT-12 | Only the platform administrator can add connected websites, change allowed addresses, deactivate a website or replace its form key. |

### 5.2 Accounts, sign-in and onboarding

| ID | Requirement |
|---|---|
| AUTH-1 | There is **no public sign-up** in the MVP. The administrator creates the business and **invites the owner by email**. |
| AUTH-2 | The invitation email contains a link. On opening it, the owner sets their name and password and lands in their dashboard. |
| AUTH-3 | Owners sign in with **email and password**, and can sign out. |
| AUTH-4 | **Forgot password:** the owner enters their email, receives a reset link and sets a new password. |
| AUTH-5 | Sessions persist between visits. When a session expires, the owner is sent to the sign-in page and returned to where they were after signing in. |
| AUTH-6 | Owners can change their **name**, their **login email** and their **password**. A login email change must be confirmed from **both the current and the new address**. A password change asks for the **current password**, then the new password twice. |
| AUTH-7 | All account emails (invitation, password reset, email change) are **Flowdesk-branded** and come from a Flowdesk address. |
| AUTH-8 | All pages except the landing, sign-in, password and invitation pages require a signed-in user. |
| AUTH-9 | The design must allow adding **public self-registration later** without reworking onboarding. A self-registered business would start in a "pending" state until approved. |

### 5.3 Dashboard

The dashboard shows the owner, at a glance, what needs attention.

| ID | Requirement |
|---|---|
| DASH-1 | Four stat cards with **all-time** counts. Archived inquiries are excluded from every count. **Total inquiries** counts every inquiry. **New** counts unanswered inquiries received less than 48 hours ago. **Awaiting response** counts unanswered inquiries older than 48 hours. **Answered** counts inquiries that have at least one successfully sent reply, or that were manually marked as answered. |
| DASH-2 | An **activity chart**: inquiries received per day over the **last 30 days**. |
| DASH-3 | **Recent inquiries**: the 5 most recent inquiries, each linking to its detail page. |
| DASH-4 | **Needs attention**: unanswered inquiries, oldest first, with a link to the full list filtered to unanswered ones. |
| DASH-5 | **Recent activity feed**: the last ~10 events for the business (inquiry received, reply sent, reply failed, marked as answered, archived), each linking to its inquiry. |
| DASH-6 | Clicking a stat card opens the inquiry list filtered to that status. |
| DASH-7 | When the business has no inquiries yet, the dashboard shows a helpful empty state that points to the Integration guide. |

### 5.4 Inquiry list

| ID | Requirement |
|---|---|
| LIST-1 | A table of the business's inquiries showing status, customer name, customer email, subject, connected website (when the business has more than one) and received date/time. |
| LIST-2 | **Unread** inquiries (never opened) are visually highlighted. The number of unread inquiries is shown in the navigation. |
| LIST-3 | **Filter by status:** All (non-archived), Unanswered (New + Awaiting response), New, Awaiting response, Answered, Archived. |
| LIST-4 | **Search** by customer name, email or subject. |
| LIST-5 | **Sort** by received date, newest or oldest first (default: newest). |
| LIST-6 | **Pagination** at 20 inquiries per page. |
| LIST-7 | The current filter, search, sort and page are kept in the page address, so the browser Back button and shared links restore the same view. |
| LIST-8 | Archived inquiries appear only under the **Archived** filter. |

### 5.5 Inquiry detail

| ID | Requirement |
|---|---|
| DET-1 | Shows **customer information**: name and email, plus a list of **other inquiries from the same customer** (linking to them). |
| DET-2 | Shows the **original inquiry**: subject, message, submission date and time (in the business's timezone) and which website it came from. |
| DET-3 | Shows the **current status** (New / Awaiting response / Answered) and whether it is archived. |
| DET-4 | Shows the **communication history** as a timeline: replies sent (with Sent or Failed status), failed sends with the reason, manual status changes, archiving and restoring. |
| DET-5 | Contains a **reply composer** (see §5.6). |
| DET-6 | Opening an inquiry marks it as **read**. The owner can **mark it as unread** again. |
| DET-7 | Actions: **Mark as answered** / **Mark as unanswered** (see STAT-3), **Archive** / **Restore**, **Delete inquiry**, **Delete customer**. |
| DET-8 | **Delete inquiry** permanently removes the inquiry and its history, after a confirmation dialog. |
| DET-9 | **Delete customer** permanently removes the customer **and all of their inquiries and messages**, after a confirmation dialog that states what will be deleted. This supports privacy erasure requests. |

### 5.6 Replying to customers

| ID | Requirement |
|---|---|
| REP-1 | The owner writes a reply in a **plain-text** composer on the inquiry detail page and sends it. |
| REP-2 | The reply is emailed to the **customer's email address**. |
| REP-3 | **From:** the business's sender identity. By default this is the business's sender name with a Flowdesk-provided address (for example "Acme Plumbing" at an address on Flowdesk's mail domain). The administrator can switch a business to an address on **its own domain** once that domain is verified. |
| REP-4 | **Reply-to:** the business's reply-to address (by default the business email). When the customer replies, the reply goes to the business's normal inbox. |
| REP-5 | **Subject:** "Re: " followed by the original inquiry subject. |
| REP-6 | **Body:** the owner's text, then the business's **signature**, then the customer's **original message quoted** below. The email uses a simple, clean layout with the business name and logo. A plain-text version is included. |
| REP-7 | If the business has enabled **"BCC me on replies"**, a copy of every reply is sent to the business email. |
| REP-8 | After sending, the reply appears in the communication history with a clear status. **Sent** means the email provider accepted the email. **Failed** means it was not accepted; the reason is shown. "Sent" does not guarantee the email reached the inbox. Delivery tracking is out of scope for the MVP. |
| REP-9 | A failed reply has a **Retry** button that resends the same content. The history shows the latest result. |
| REP-10 | The first successfully sent reply makes the inquiry **Answered**. |
| REP-11 | The owner can send **multiple replies** (follow-ups) on the same inquiry; each is stored in the history. |
| REP-12 | Customer replies are **not** imported into Flowdesk in the MVP; they arrive in the business's normal inbox. The history therefore shows outgoing messages only. |
| REP-13 | The composer prevents sending an empty message and prevents double-sending from repeated clicks. |

### 5.7 Inquiry statuses and lifecycle

| ID | Requirement |
|---|---|
| STAT-1 | Status is **calculated automatically** from the time the inquiry was received and whether it has been answered. No scheduled background job is needed (see §6). |
| STAT-2 | The 48-hour threshold is **fixed** for all businesses and counts calendar hours (weekends included). |
| STAT-3 | **Mark as answered** sets an unanswered inquiry to Answered without sending an email, for example when it was handled by phone. The timeline records "Marked as answered manually". **Mark as unanswered** undoes this, but is only available when the inquiry was answered manually and has no successfully sent reply. |
| STAT-4 | **Archive** hides an inquiry from the default list and from all dashboard counts and charts, without deleting it. **Restore** brings it back. This is how spam and irrelevant inquiries are handled. |
| STAT-5 | **Read/unread** is tracked separately from status. Unread means the owner has not opened the inquiry yet. |

### 5.8 Notifications

| ID | Requirement |
|---|---|
| NOT-1 | When a new inquiry arrives, Flowdesk emails a **notification to the business email**. The email shows the customer's name, the subject and a short preview, and links to the inquiry in Flowdesk. |
| NOT-2 | Notifications are **on by default** and can be turned off in Business settings. |
| NOT-3 | A failed notification never causes the inquiry to be lost or rejected. |

### 5.9 Settings (business owner)

| Tab | Fields and behaviour |
|---|---|
| **Business** | Business name, business email, website, logo (optional image), timezone, and the "Email me about new inquiries" toggle. |
| **Email** | Sender name, sender address (**read-only**; managed by the administrator), reply-to address, signature (plain text; defaults to owner name and business name), "BCC me on replies" toggle (off by default). |
| **Integration** | Read-only list of connected websites: name, allowed addresses, form key, active/inactive. Each has copy-paste HTML and JavaScript examples and setup instructions. |
| **Account** | Owner name, login email (change with confirmation), password change. |

| ID | Requirement |
|---|---|
| SET-1 | An owner can view and change only **their own business's** settings. |
| SET-2 | All dates and times in the app and in emails are shown in the **business's timezone**. |
| SET-3 | Changes show a confirmation; invalid input shows a clear error next to the field. |

### 5.10 Platform administration

A minimal admin area, available only to platform administrators.

| ID | Requirement |
|---|---|
| ADM-1 | **Business list:** name, status (active / suspended / pending), owner, number of connected websites, creation date. |
| ADM-2 | **Create business:** business name, business email, website, timezone, owner name and owner email. This creates the business, generates its default sender identity, creates its first connected website from the website address, and **sends the owner invitation**. |
| ADM-3 | **Edit business configuration:** all business settings, plus the sender address and custom sending domain, which only the administrator can change. |
| ADM-4 | **Manage connected websites:** add, rename, edit allowed addresses, activate or deactivate, and **replace the form key** (the old key stops working immediately). |
| ADM-5 | **Resend the owner invitation** if it expired or was lost. |
| ADM-6 | **Suspend / reactivate** a business (see §5.11). |
| ADM-7 | The admin area does **not** show inquiries, customers or messages. Troubleshooting that needs customer data is done directly in the database console, outside Flowdesk. |

### 5.11 Business suspension

| ID | Requirement |
|---|---|
| SUS-1 | When a business is suspended, its owner cannot use Flowdesk. After signing in they see an "Account suspended" page with contact instructions. |
| SUS-2 | Inquiries sent to a suspended business are **rejected**. |
| SUS-3 | All data is **kept**. Reactivating restores full access immediately. |
| SUS-4 | Permanently removing a business is done by the administrator outside the MVP admin area. |

### 5.12 Privacy and data handling

| ID | Requirement |
|---|---|
| PRIV-1 | Each business's data is fully isolated from other businesses. |
| PRIV-2 | The provided form snippet includes a short privacy-notice line that the business can adapt and link to its own privacy policy. |
| PRIV-3 | Owners can permanently delete an inquiry, or a customer with all of their data (DET-8, DET-9). |
| PRIV-4 | Visitor IP addresses are not stored in readable form. Only an anonymised value is kept, for spam and rate-limit protection. |
| PRIV-5 | Visitor data is used only so the business can respond to the inquiry. Flowdesk does not share it between businesses or with third parties beyond the email provider needed to send replies. |
| PRIV-6 | Data retention is handled manually in the MVP: data is kept until deleted. |

---

## 6. Status rules

| Status | Rule | Shown in |
|---|---|---|
| **New** | Not answered **and** received less than 48 hours ago | List, detail, dashboard "New" |
| **Awaiting response** | Not answered **and** received 48 hours ago or more | List, detail, dashboard "Awaiting response" and "Needs attention" |
| **Answered** | At least one reply was successfully sent, **or** it was manually marked as answered | List, detail, dashboard "Answered" |

Flags that combine with any status:

| Flag | Meaning |
|---|---|
| **Unread** | Not yet opened by the owner |
| **Archived** | Hidden from the default list and from all dashboard numbers; visible under the Archived filter |

A failed reply does **not** make an inquiry Answered.

---

## 7. Key user flows

### 7.1 Onboarding a new business (administrator)
1. The administrator opens the admin area and selects **Create business**.
2. They enter the business details, owner name and email, and the business's website address.
3. Flowdesk creates the business, its sender identity and its first connected website (with a form key), then sends the owner an invitation email.
4. The administrator (or the business's web developer) adds the form snippet from the Integration guide to the business's website.
5. The owner opens the invitation link, sets their name and password, and lands on the dashboard.
6. A test submission on the website appears in the dashboard.

### 7.2 Inquiry to reply (owner)
1. A visitor submits the contact form on the business's website.
2. The inquiry appears in Flowdesk as **New** and **Unread**. The owner receives a notification email (if enabled).
3. The owner opens the inquiry (it becomes read), reviews it, writes a reply and clicks **Send**.
4. The reply appears in the history as **Sent**; the inquiry becomes **Answered**.
5. The customer receives the email from the business's sender identity. If they reply, their reply goes to the business's normal inbox.

### 7.3 Failed send and retry (owner)
1. The owner sends a reply, and the email provider rejects it.
2. The history shows the reply as **Failed** with the reason; the inquiry remains unanswered.
3. The owner clicks **Retry**. On success, the reply changes to **Sent** and the inquiry becomes **Answered**.

### 7.4 Password reset (owner)
1. On the sign-in page, the owner clicks **Forgot password** and enters their email.
2. They receive a Flowdesk-branded reset email, open the link and set a new password.
3. They are signed in and taken to the dashboard.

### 7.5 Handling spam (owner)
1. An irrelevant or spam inquiry appears.
2. The owner opens it and clicks **Archive**. It disappears from the list and from all numbers.
3. If it was archived by mistake, the owner finds it under the **Archived** filter and clicks **Restore**. To remove it for good, they click **Delete**.

### 7.6 Suspension (administrator)
1. The administrator suspends a business.
2. The owner's next page load shows "Account suspended"; the website's form submissions are rejected.
3. When the administrator reactivates the business, everything works again with all data intact.

---

## 8. Screens

| Screen | Who | Purpose |
|---|---|---|
| Landing page | Public | Short introduction to Flowdesk with a Sign in button |
| Sign in | Public | Email and password sign-in, link to Forgot password |
| Forgot password | Public | Request a reset link |
| Set new password | Via email link | Choose a new password |
| Accept invitation | Via email link | Set name and password for a new account (this replaces a public "Register" page in the MVP) |
| Account suspended | Owner of a suspended business | Explains the suspension, with contact instructions |
| Dashboard | Owner | Stats, chart, recent inquiries, needs attention, activity feed |
| Inquiries | Owner | Table with filter, search, sort and pagination |
| Inquiry detail | Owner | Customer info, original inquiry, status, history, reply composer, actions |
| Settings (Business, Email, Integration, Account tabs) | Owner | Manage business, email, integration info and account |
| Admin: businesses | Administrator | List of all businesses |
| Admin: create business | Administrator | Onboard a new business and invite its owner |
| Admin: business detail | Administrator | Edit configuration, connected websites, sender identity, status; resend invitation |

Navigation for owners is a sidebar with Dashboard, Inquiries (with unread count) and Settings, plus the account menu (with sign out) and a light/dark theme switch. On small screens the sidebar collapses into a menu.

---

## 9. Non-functional requirements

| Area | Requirement |
|---|---|
| **Data isolation** | Isolation between businesses is enforced by the database's access rules, so even a bug in the user interface cannot expose another business's data. |
| **Security** | All traffic is encrypted (HTTPS). Secret keys never reach the browser. The public intake is protected by allowed-address checks, validation, size limits and rate limits. Every action re-checks that the user may perform it. |
| **Reliability** | An accepted inquiry is always stored before any notification is attempted. A failure in email sending never loses an inquiry or a reply draft. Failed replies are kept and can be retried. |
| **Performance** | Pages feel instant to navigate. The inquiry list loads one page at a time and stays fast with thousands of inquiries per business. |
| **Responsive design** | Every screen works on mobile phones, tablets and desktops. |
| **Accessibility** | Keyboard navigation, visible focus, labelled form fields, error messages tied to fields, and sufficient colour contrast (target: WCAG 2.1 AA). |
| **Language** | The interface and all emails are in **English**. All interface text is kept in one place so translations can be added later. |
| **Theme** | Light and dark mode, with a switch. |
| **Time** | All dates and times follow the business's timezone. |
| **Branding** | The product is called **Flowdesk**. Emails to customers carry the business's identity (name, logo, signature); account emails carry Flowdesk's identity. |

---

## 10. MVP scope

### 10.1 In scope
- Invitation-based accounts, sign in / out, password reset, account settings
- Business accounts with full data isolation
- Multiple connected websites per business, with public intake, spam controls and an integration guide
- Customers grouped by email per business
- Dashboard: stat cards, 30-day chart, recent inquiries, needs attention, activity feed
- Inquiry list: status filter, search, sort, pagination, unread highlighting
- Inquiry detail: customer info, original inquiry, history, actions
- Email replies with business sender identity, signature, optional BCC, quoted original, Sent/Failed status and Retry
- Manual "mark as answered", archive/restore, delete inquiry, delete customer
- New-inquiry notification emails (toggle)
- Business, email, integration and account settings
- Minimal admin area: businesses, onboarding, connected websites, sender identity, suspension
- Responsive layout, light/dark mode, English UI

### 10.2 Out of scope (MVP)
- Customer replies imported into Flowdesk (inbound email sync)
- Automatic confirmation email to visitors
- Email delivery, bounce and open tracking
- Automatic retries of failed emails
- Rich-text replies, attachments, saved reply templates
- Customers page (customer directory)
- CSV export
- Configurable status thresholds or business-hours rules
- Multiple team members per business, roles and permissions UI
- Public self-registration
- Admin access to business customer data inside Flowdesk
- Automatic data-retention rules
- Invoicing and payments
- Languages other than English

---

## 11. Future roadmap

### 11.1 Confirmed: Invoicing
Businesses will be able to create and send invoices from their inquiry workflow:
- Create invoices linked to a customer and, optionally, an inquiry
- Add products/services, quantities, prices and taxes
- Generate downloadable PDF invoices
- Collect online payments through Stripe
- Email invoices and payment links to customers
- Track invoice status: Draft, Sent, Paid, Overdue, Cancelled
- Link payments to the relevant invoice, customer and business

*Designed for now:* customers are already stored as their own records per business, so invoices can attach to them directly.

### 11.2 Planned: Two-way email (customer replies in Flowdesk)
Customer replies sent from their normal email client will appear in the inquiry's communication history.

*Designed for now:* the history already distinguishes outgoing and incoming messages, every outgoing email carries threading information, and every inquiry has a unique reply reference. Turning this on later changes where replies are routed, not how data is stored.

### 11.3 Planned: Self-registration
Businesses sign up themselves and start in a "pending" state until approved or onboarded.

*Designed for now:* account creation and business creation are already separate steps that registration can reuse.

### 11.4 Potential
- **Multiple team members per business.** Already prepared: a person's access to a business is stored with a role, so employees can be added without restructuring.
- Internal notes on inquiries
- Inquiry priority levels
- File attachments
- Advanced analytics and reporting
- Automated email reminders for unanswered inquiries
- Custom inquiry forms and fields
- Subscription and billing management for Flowdesk itself
- Customers page / customer directory
- CSV export
- Email delivery and bounce tracking
- Automatic confirmation email to visitors
- Automatic data-retention rules
- Additional interface languages

---

## 12. Open items

| Item | Needed by | Notes |
|---|---|---|
| Buy a domain for Flowdesk | Before launch | Needed for the default sender addresses, account emails and the app address. Until then, development uses a test sender that only delivers to the developer's own email. |
| Verify the Flowdesk mail domain with the email provider | Before launch | One-time DNS setup |
| Privacy-notice wording for the form snippet | Before launch | Short generic line; each business links its own privacy policy |
| Support contact shown on the "Account suspended" page | Before launch | Email address of the administrator |
