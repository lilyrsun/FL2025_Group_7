# FL2025 Group 7: Sidequests App
CSE 4307: SWE Workshop


## Team Members
- **Lily Sun:**
  - Email: l.r.sun@wustl.edu
  - GitHub: [lilyrsun](https://github.com/lilyrsun)
- **Emily Huang:**
  - Email: emilyhuang@wustl.edu
  - GitHub: [imemilyhuang](https://github.com/imemilyhuang)


## TA
Yerin Kang


## Objectives
Our app, **Sidequests,** is a reverse form of social media. Instead of users posting what they did, they post what they're doing at the moment or what they plan to do. For instance, a user might post that they're at the library studying at the moment or planning on grabbing coffee in the afternoon. From there, friends and nearby users can view these real-time plans and join spontaneously based on privacy settings that the user sets, which turns social media into a tool for facilitating real-world connections rather than passive scrolling. Instead of curating a highlight reel of the past, the platform creates a feed of low-stakes, organic opportunities to connect.

### Key Features
- **Authentication & Profiles:** secure user sign-in with a customizable profile and privacy settings
- **Home Feed:** a central feed showing both spontaneous posts (current activities) and RSVP-style posts (planned events)
- **Interactive Map:** filter events by type and radius, with the option to explore visually
- **Join Spontaneous Events:** live posts of what users are doing now, with quick access to directions and the ability to ping the user to coordinate plans
- **Join RSVP-Style Events:** event details (event name, date, time, location, description), see who else has RSVPed, and the ability to RSVP with a single tap
- **Create & Manage Posts:** add event info and images, control visibility through privacy settings, edit/delete posts as needed
- **Your Plot:** personal hub, broken down across three tabs:
  - **Wishlist:** saved locations you want to make plans at
  - **Upcoming Events:** events you've RSVPed for
  - **Diary:** a record of past spontaneous and RSVP-style events

### Tech Stack
- **Frontend:** React Native
- **Backend:** Node.js
- **Database:** Supabase


## How to Run
&lt;Instructions for how to run your project. Include the URI to your project at the top if applicable.&gt;

use cloudflare to change http to https and update the urls in the .env file