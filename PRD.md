# PRD: CampusFix for NIT Hamirpur

**Status:** Draft for campus review  
**Product:** Private campus issue reporting and resolution platform  
**Initial campus:** National Institute of Technology Hamirpur (NITH), Hamirpur, Himachal Pradesh 177005  
**MVP users:** Students, staff reporters, authorized campus staff, administrators

## Problem

Campus problems such as leaks, damaged infrastructure, sanitation issues, unsafe pathways, and malfunctioning equipment are reported through separate channels. Reports can be missed or duplicated, urgent cases may not reach the right team, and reporters have limited visibility into progress.

CampusFix gives NITH users one private place to report an issue, routes reports to authorized campus staff, supports staff triage and resolution, and lets reporters follow their own reports.

## Goals

- Provide a NITH-specific, mobile-friendly report form and campus location picker.
- Let students and staff report issues with a required description and location, plus an optional photo.
- Suggest a category, priority, and possible duplicates using AI-assisted processing.
- Let authorized NITH staff review, assign, update, and resolve reports within their permitted areas.
- Let reporters view only their own reports and receive in-app status notifications.
- Maintain an auditable record of staff decisions and AI suggestions.

## Users and access

| User | Permissions |
|---|---|
| Student or staff reporter | Submit reports; view their own reports, current status, and notifications. |
| Authorized campus staff | View and manage reports in explicitly assigned campus areas/teams; update assignment, status, category, and priority; review and link duplicate reports. |
| Administrator | Manage campus location directory, category list, and staff role/area access. |

Authentication is through NITH-approved campus SSO if available. NITH IT must confirm the provider, account provisioning, and how staff permissions are granted. A campus email address alone must not grant staff access.

## NIT Hamirpur location directory

Locations are organized as a hierarchy: **NIT Hamirpur Campus → named campus area/building → optional reporter-entered detail** (for example, floor, room, gate, or nearby landmark). Staff access is granted against these areas or their service teams.

Initial seeded locations are based on NITH public pages and require campus confirmation before launch:

- **Hostels:** Kailash Boys Hostel, Himgiri Boys Hostel, Udaygiri Boys Hostel, Neelkanth Boys Hostel, Dhauladhar Boys Hostel, Vindhyachal Boys Hostel, Shivalik Boys Hostel, Ambika Girls Hostel, Parvati Girls Hostel, Mani-Mahesh Girls Hostel, Aravali Girls Hostel, Satpura Hostel, and Himadri Boys Hostel.
- **Academic and administrative buildings:** Admin Block, Civil Department, Mechanical Department, Electrical Department, Computer Department, Computer Centre, New Computer Centre, E-Classroom, Architecture Department, Electronics and Communication Engineering Department, Applied Science Department, Modern Lecture Hall, Central Block (IRC), and Estate Office/Bank/Post Office/Construction Section.
- **Facilities and outdoor areas:** Central Workshop, Auditorium, Open Air Theatre (OAT), Central Library, Health Centre, Guest House, Canteen, Student Activity Centre (SAC), Ground and Stadium, Gate No. 1, Gate No. 2, and Substations I–III.

Exact map coordinates, room-level naming, current hostel status, and operational area ownership are not established by this initial directory. Administrators can correct, deactivate, and extend it. The report form must allow a location detail and provide a “location not listed” path for administrators to review.

## Core workflow

1. A signed-in NITH user chooses a campus location, enters a description, and optionally attaches a photo.
2. The system saves the report as **New** before any AI work begins.
3. Background processing proposes a category and priority (**Low, Medium, High, Urgent**), flags uncertainty, and suggests possible duplicates.
4. Authorized staff review reports in an area-scoped dashboard, correct AI suggestions as needed, and assign the work.
5. Staff update status through **New → Assigned → In progress → Resolved**; a resolved report can be **Reopened** if the issue persists.
6. The reporter can view their own report and receives an in-app notification when its status changes.
7. Assigned staff receive an in-app notification when a report is assigned to them.

## Functional requirements

### Reporting and photos

- Description and campus location are required; an optional photo may be attached.
- Reports are private to the reporter and authorized staff.
- The app validates text, file type, and file size on the server. Photo limits and supported formats must be approved by NITH.
- Report editing, withdrawal, and deletion behavior remain to be decided.

### AI-assisted triage

- Propose one active administrator-managed category, one of four priorities, and an uncertainty/review flag.
- Save proposals separately from final staff-selected category and priority.
- Never prevent submission if the AI provider is slow or unavailable.
- Staff remain responsible for final decisions, especially urgent reports.
- Category taxonomy, priority policy, confidence threshold, AI provider/data terms, and accuracy targets require NITH approval.

### Duplicate review

- Suggest possible matches using report text, category, campus area, and recency.
- Show match candidates only to authorized staff; require staff confirmation before creating a duplicate link.
- Keep linked reports independently visible to their respective reporters and preserve their individual status/history.
- Report merging and reporter-facing duplicate messaging are out of MVP until policy is decided.

### Staff dashboard and resolution

- Show only reports within the staff member’s authorized areas/team.
- Support manual assignment and staff editing of category, priority, and status.
- Record each change with actor and timestamp.
- Enforce approved status transitions server-side. Whether direct transitions or mandatory resolution notes are allowed remains a campus decision.

### Urgent reports and notifications

- Prominently flag urgent reports for authorized staff.
- Display only NITH-approved emergency guidance and contact information. CampusFix is not an emergency service.
- Store notifications in the app. Email and push are outside MVP until delivery expectations are set.
- NITH must define who monitors urgent reports and the escalation response; a UI flag alone is not an operational escalation process.

## Success measures

Track submission-to-assignment time, submission-to-resolution time, resolved share, duplicate suggestions confirmed, frequency of staff changes to AI suggestions, and reporter access to current status. NITH must set baselines and targets.

## Out of scope for MVP

- Public reports or cross-reporter access to report details.
- Automated assignment, external campus-system integrations, report merging, analytics dashboards, email/push notifications, and map routing.
- Claims that AI can reliably identify emergencies or replace campus response staff.

## Open decisions before production

NITH IT and operations must confirm SSO and account provisioning, location directory and coordinates, team/area ownership, category taxonomy, priority definitions, AI review thresholds, photo policy, retention/deletion, status transitions, emergency guidance and escalation ownership, accessibility/language needs, and data residency/backup requirements.

## Source notes

Initial location names were drawn from the [NITH planning works list](https://apar.nith.ac.in/planning-works), [hostel information](https://nith.ac.in/hostels-at-nith), [hostel functionaries](https://nith.ac.in/hostel-functionaries), [central facilities](https://web.nith.ac.in/index.php/sections/central-facilities-cells/central-facilities), and [hostel booklet 2025–26](https://nith.ac.in/uploads/topics/hostel-booklet-25-26.pdf). These public sources are not a verified live GIS or authoritative staff-access map.
