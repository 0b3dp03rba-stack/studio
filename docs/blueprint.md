# **App Name**: GmailKu

## Core Features:

- User Authentication & Roles: Secure user registration and login with email and password only (no verification), role assignment (User/Admin), minimum password length validation, and password confirmation. Includes pre-configured admin credentials.
- Gmail Submission & Batching: Users submit multiple Gmail credentials in 'email|password' format. The system validates input, prevents duplicates, and groups each submission into a distinct 'batch' for tracking.
- User Dashboard & Earnings: Display a dashboard with user-specific statistics (total submitted, pending, approved, rejected). Calculate user balance based solely on approved Gmails, using an editable rate (default 6000). Provides a history view of all submission batches with details on individual Gmail statuses.
- User Withdrawal System: Allow users to request withdrawals with preset or custom amounts (multiples of 1000, minimum 10000). Incorporates an admin fee (default 500) and enables users to select from available payment methods. Requests are pending admin approval and enforce strict balance checks to prevent negative balances.
- Admin Gmail Processing: Admins can view and process all user-submitted Gmails, grouped by batch. Features include approving or rejecting individual Gmail entries, and options to copy all non-rejected or only pending entries for administrative tasks. Ensures data consistency across all views.
- Admin Withdrawal Management: Provides administrators with a dashboard to review, approve, or reject user withdrawal requests. Approval triggers an automatic deduction from the user's balance, including the admin fee. Rejection returns the request to the user without deduction.
- Admin System Configuration & AI Content Tool: Allows administrators to configure application settings like Gmail rates, minimum withdrawal amounts, admin fees, payment methods (enable/disable), and the link for the floating action button. Includes an AI-powered tool to assist in drafting 'Rules' and 'Announcements' content for the platform, offering suggestions or generating initial drafts based on keywords or themes.

## Style Guidelines:

- Primary Color: A vibrant electric green, #69F425, to provide high contrast and embody the 'neon glow' effect on dark backgrounds.
- Background Color: A very dark, almost black hue with a subtle green tint, #131711, serving as a deep canvas for the neon accents.
- Accent Color: A bright neon cyan, #4DC3C3, used to create dynamic gradients and highlight interactive elements in conjunction with the primary green.
- Body and headline font: 'Inter', a modern, neutral sans-serif font, chosen for its excellent readability and contemporary feel, suitable for both titles and body text in a fintech-style application.
- Minimal and modern icons reflecting email, connection, and financial concepts, enhanced with neon green/teal glow effects for active states. Logo will be a minimal icon + 'GmailKu' text, consistently appearing across all pages with the theme-matching glow.
- Mobile-first, app-like interface with a fixed dark bottom navigation bar featuring active neon highlights. The header positions the 'GmailKu' logo and text to the top-left, with a logout button to the top-right. Features large 'balance cards' with gradient glows, and dark statistical cards with soft shadows. All UI elements will be rounded, with clean, generous spacing to align with a modern fintech aesthetic. A neon glowing floating action button will be placed at the bottom-right, distinct from the navigation.
- Implement smooth, subtle transitions across UI states. Key interactive and important elements will feature soft glow effects to emphasize their status or actions.