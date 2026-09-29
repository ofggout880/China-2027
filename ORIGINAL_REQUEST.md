# Original User Request

## 2026-09-25T19:55:18Z

Build a comprehensive, 3D-animated, dark-themed (with vibrant red accents) web application (frontend only with mock data) to plan and track the user's goal of studying in China in 2027. It will feature a data-rich dashboard with China statistics, a school finder, a Chinese language learning timeline, and application tracking (deadlines, documents).

Working directory: /Users/matthieugout/Desktop/Travail Perso/CHINA 2027/website
Integrity mode: development

## Requirements

### R1. Visual Identity & 3D Environment
Create a dark-themed user interface with vibrant red accents. The application must feature advanced 3D elements and modern animations using appropriate libraries (e.g., Three.js, GSAP, or Framer Motion).

### R2. Preparation Dashboard & Data
Implement a main dashboard containing rich statistical widgets displaying mock data about modern China, as well as a visual countdown timer to the September 2027 school application deadlines.

### R3. Roadmap & Tracking Tools
Build dedicated sections or views for the user's roadmap:
- A school exploration/finding section.
- A timeline for learning Chinese prior to September 2027.
- A checklist or tracker for assembling necessary application documents.

### R4. Mobile-First Design
The application must be designed with a mobile-first approach, ensuring an optimal experience on smartphones while remaining fully functional and well-proportioned on desktop browsers.

### R5. Live Functional Testing
The team must not simply write the code; they must spin up a local development server and actively test the UI. This includes running a browser automation script (e.g., Puppeteer/Playwright) to interact with the elements, verify the 3D renders, and confirm the site behaves correctly without errors.

## Acceptance Criteria

### R1. Visuals & 3D
- [ ] The application successfully loads in a browser without console errors.
- [ ] A `<canvas>` element (or equivalent 3D rendering context) is present on the home page.
- [ ] The primary background color is dark, and CSS variables/classes for red accents are defined and used.

### R2. Dashboard
- [ ] The dashboard renders at least two distinct data visualization components (charts/graphs) populated with placeholder data.
- [ ] A countdown timer component is present and calculating time relative to a target date in 2027.

### R3. Roadmap Tools
- [ ] The application contains a language learning timeline component with discrete steps/milestones.
- [ ] The application contains a document checklist with at least 5 placeholder items that can be toggled.

### R4 & R5. Responsiveness and Testing
- [ ] Default CSS styles target mobile devices, with `@media` queries used exclusively to scale up for larger screens (desktop).
- [ ] The project includes a functional test script that launches the site, simulates user interactions (like toggling a checklist item), and passes without errors.
