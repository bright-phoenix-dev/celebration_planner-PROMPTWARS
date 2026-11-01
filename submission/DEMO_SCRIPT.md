# Celebration & Event Planner — 3-Minute Demo Script

A guided presentation script for judges and evaluators, aligned with the captured demo recording in `submission/recordings/happy-path-demo.webm`.

---

### [0:00 - 0:25] The Hook

- **Visual**: Landing on the Celebration & Event Planner welcome screen in clean light mode.
- **Narrator**:
  > _"Every year, millions of couples and community organizers face the same nightmare: fragmented spreadsheets, blown budgets, and missed deadlines. Planning life's biggest milestones shouldn't feel like managing a chaotic corporate project. Welcome to **Celebration & Event Planner**—an intelligent, GenAI-powered assistant that turns scattered ideas into a unified, backward-planned execution roadmap in seconds."_

---

### [0:25 - 0:55] Step 1 & 2: Guided Onboarding

- **Visual**: Clicking _"Plan a Wedding"_, entering _"Emma & Liam Dream Wedding"_, Date _"2027-06-18"_, Guests _"120"_, and Budget _"$35,000"_. Clicking _"Create Event Plan"_.
- **Narrator**:
  > _"We start with an accessible, guided onboarding flow. The user selects from three purpose-built typologies: weddings, birthdays, or community events. Notice the clean micro-interactions and strict validation. With just our guest count and target budget, the engine constructs a complete, tailored master plan stored instantly in the browser's local IndexedDB—zero server tracking, 100% private."_

---

### [0:55 - 1:25] Dashboard & Adaptive Budgeting

- **Visual**: Navigating to the **Budget** tab. Pointing out the allocated categories (Venue $10,500, Catering $8,750, Attire, Decor, Photography, Entertainment, Misc). Entering an actual spend exceeding planned and highlighting the warning badge.
- **Narrator**:
  > _"Here on the Budget dashboard, our pure business logic automatically distributes the $35,000 across 7 event-specific categories. Notice how a wedding heavily weighs attire and photography, whereas a community festival would shift those dollars into municipal permits and staging. When actual invoices roll in, any overage triggers both a visual badge and an explicit text warning—never relying on color alone, ensuring full WCAG compliance."_

---

### [1:25 - 1:50] Backward-Planned Milestones

- **Visual**: Clicking the **Timeline** tab. Expanding milestones (12 Months, 6 Months, 1 Month, 1 Week, Day-Of). Checking off _"Book Venue"_ and watching the progress bar advance.
- **Narrator**:
  > _"Next, the Timeline. Rather than a flat to-do list, our backward-planning algorithm calculates exact milestone deadlines from the event date—from 12 months out down to the day-of. Tasks are completely editable, custom milestones can be added on the fly, and checking off tasks updates our interactive progress bar in real time."_

---

### [1:50 - 2:15] Vendor Checklist

- **Visual**: Clicking the **Vendors** tab. Demonstrating status progression (`To-Contact` -> `Contacted` -> `Quoted` -> `Booked` -> `Paid`). Showing quote inputs and notes.
- **Narrator**:
  > _"Moving to Vendors: the app automatically seeds the essential vendor roster for the event type. We can record quotes, track contacts, and progress statuses through five structured stages from initial inquiry to final payment."_

---

### [2:15 - 2:40] Personalized GenAI Ideas Engine

- **Visual**: Clicking the **AI Ideas** tab. Submitting preferences: Vibe _"Cozy Autumn & Romantic"_, Theme _"Rustic Vintage Barn"_, Dietary _"Gluten-Free & Vegan Options"_. Displaying structured cards for Themes, Decor, Curated Menu, Activities, and Invitations.
- **Narrator**:
  > _"When creative inspiration stalls, our GenAI engine steps in. Powered by Google Gemini 2.0 with strict JSON schema constraints and XML prompt delimitation, it returns hyper-tailored concepts for themes, decor, curated dietary-safe menus, activities, and invitations. Responses are cached in an LRU store and debounced, eliminating redundant API spend."_

---

### [2:40 - 2:55] Security & Accessibility Highlights

- **Visual**: Toggling **Dark Mode** via the theme toggle, opening the **Print / Export** preview, and noting the keyboard focus rings.
- **Narrator**:
  > _"Under the hood: zero client-side API key leakage, sliding-window rate limiting, and 100% WCAG 2.1 AA compliance with zero axe-core violations across every screen, complete with print-friendly PDF exporting."_

---

### [2:55 - 3:00] The Closing Line

- **Visual**: Returning to the dashboard overview card.
- **Narrator**:
  > _"Celebration & Event Planner: Where cutting-edge GenAI meets rock-solid engineering to make life's greatest moments stress-free. Thank you!"_
