# Thamarai Charitable Trust Foundation | தாமரை தொண்டு நிறுவன அறக்கட்டளை

A modern, responsive, and feature-rich web application built for the **Thamarai Charitable Trust Foundation**. This portal serves as a central hub for community engagement, offering public registrations, member portals, blood donation matching, donation processing, and a robust administrator control panel. All content is written in **Tamil (தமிழ்)**.

---

## 🌟 Key Features

### 1. Public Portal & Community Services
* **Membership Registration**: Public application form to register as a Member or Active Member, featuring automated uploads for profile photos and Government ID proofs.
* **Blood Donation Registry**: Public registration form for blood donors to sign up for voluntary emergency donation.
* **Blood Request Portal**: Urgent blood request submission form for patients, hospital location details, and units needed.
* **Donations Portal**: Donation intake form with real-time QR Code scanning and UPI details mapping.
* **Grievance (Problem) Reporting**: Public ticket filing system for community problems, providing auto-generated tracking numbers and category tags.
* **Events Page**: View upcoming and past events, with public registration support.

### 2. Member Portal
* **Secure Login**: Authentication system for approved members to access their dashboard.
* **Digital Member ID Card**: Dynamic, client-side generation and rendering of official membership ID cards with downloadable templates.

### 3. Admin Dashboard Control Panel
* **Applicant Screening**: View member registration queues, inspect uploaded Government proofs via signed secure links, and approve/reject applicants with automated EmailJS notifications.
* **ID Card Download**: Admin can instantly download any approved member's official ID card directly from the member management table via a dedicated per-row download button.
* **Service Tracking**: View, filter, and delete Blood Requests, Blood Donors, Grievance tickets, and Feedback messages.
* **CMS Content Manager**: Live updates for announcements, testimonials, image galleries, and YouTube video grids.
* **Real-time Analytics**: Quick statistics view for total members, pending approvals, and active requests.
* **Bilingual Excel Export**: One-click bulk exports of all database lists (Members, Donors, Requests, Donations, Grievances) to Excel/CSV with clean bilingual columns.

### 4. Legal Pages
* **Terms of Use** (`terms-of-use.html`): Full Tamil terms & conditions with a table of contents, acceptance notice, and structured article layout.
* **Privacy Policy** (`privacy-policy.html`): Full Tamil privacy policy covering data collection, usage, donor QR-based payment process, and user rights — with no cookie or third-party payment gateway clauses.

### 5. About Section
* **Founder Profile**: Dedicated section on the homepage featuring the founder's photo, biography, journey, and personal message.
* **Leader Profile**: Dedicated section below the founder featuring the trust leader's photo and biography, styled at a proportionally smaller size to reflect organisational hierarchy.

---

## 🛠️ Technology Stack

* **Frontend**: HTML5, Vanilla CSS3 (Custom Properties theme system), JavaScript (ES Modules).
* **Backend Database**: Firebase Firestore.
* **Authentication**: Firebase Authentication.
* **Storage**: Supabase Storage (used for storing photos, government proofs, signature assets, QR codes, and event images).
* **Security**: Firebase App Check (reCAPTCHA v3 verification).
* **Email Alerts**: EmailJS integration for admin alerts on new grievances/members and applicant approval/rejection emails.

---

## 📁 Directory Structure

```text
├── css/                       # Page-specific stylesheets
│   ├── admin.css              # Styling for admin login & dashboard panels
│   ├── responsive.css         # All media query breakpoints (global + per-page)
│   └── style.css              # Global styling, layout tokens, and component styles
├── images/                    # UI icons, default avatars, trust logo, member photos
├── js/                        # App logic
│   ├── firebase/              # Firebase configuration, Auth & Firestore services
│   ├── pages/                 # Page-specific handlers (login, dashboard, donations, etc.)
│   └── utils/                 # Email templates, validations, and helper utilities
├── index.html                 # Homepage (hero, founder, leader, about, events, gallery)
├── admin-login.html           # Admin Dashboard gate
├── admin-dashboard.html       # Admin Panel layout (member mgmt, ID card download, events, etc.)
├── member-login.html          # Member authentication gateway
├── id-card-template.html      # Member ID Card generator canvas
├── join-contact.html          # Member registration, grievances, and contact form
├── blood-donation.html        # Donor registration form
├── blood-request.html         # Blood requests filing form
├── donate.html                # Donation and QR Code gateway
├── events.html                # Event views and registration form
├── terms-of-use.html          # Full Tamil Terms & Conditions legal page
└── privacy-policy.html        # Full Tamil Privacy Policy legal page
```

