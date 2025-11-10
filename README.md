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
- **Real-Time Location Sharing:** share your live location with friends for spontaneous hangouts (similar to "Find My" but for social events)
- **Auto-Expiring Presences:** spontaneous presences automatically expire after 10 minutes for privacy
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

Follow these steps to set up and run the project locally:
1. **Start the Docker container** and add the required environment variables to your `.env` file.

2. **Install frontend dependencies:**
   - Navigate to the `/sidequests` folder.
   - Run:
     ```bash
     yarn install
     ```

3. **Install backend dependencies:**
   - In a new terminal, navigate to the `/backend` folder.
   - Run:
     ```bash
     npm install
     ```

4. **Start both servers:**
   - In the `/sidequests` terminal, run:
     ```bash
     npx expo start -c
     ```
   - In the `/backend` terminal, run:
     ```bash
     npm run dev
     ```

5. **Update environment variables:**
   - When the Expo app starts, you’ll see a line like:
     ```
     Metro waiting on exp://###.###.##.###:8081
     ```
     Use that IP address in your `.env` file:
     ```
     EXPO_API_URL="exp://###.###.##.###:8081"
     ```

6. **Set up Cloudflared (for Supabase and Node.js backend):**
   - If you don’t already have it installed, run:
     ```bash
     brew install cloudflared
     ```
   - After installation, start a quick tunnel:
     ```bash
     cloudflared tunnel --url http://localhost:54321
     ```
   - When you see:
     ```
     Your quick Tunnel has been created! Visit it at:
     ```
     Copy the URL that follows (you'll need it in the next step).

7. **Add Supabase environment variables:**
   - In your `.env` file, define `SUPABASE_URL` to be the copied cloudflared URL
   - Next, define `SUPABASE_REDIRECT_URL` to be the copied cloudflares URL with the slug "/auth/v1/callback"

8. **Update Google Cloud Console settings:**
   - Go to your project in the Google Cloud Console.
   - Under **Authorized JavaScript origins**, add your `SUPABASE_URL`.
   - Under **Authorized redirect URIs**, add your `SUPABASE_REDIRECT_URL`.
   - Click **Save**. Note that it might take ~5 minutes for these changes to go into effect!
  
9. **Create a Cloudflare tunnel for the backend:**
   - Run a second Cloudflare tunnel pointing to the backend, pasting in your backend API URL. The four sets of digits are your IP address:
     ```bash
     cloudflared tunnel --url http://###.##.###.##:4000
     ```
   - When that runs, you'll see a line like:
     ```bash
     Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):
     ```
     A URL will follow that line. Copy it, and use it to define your backend API URL in the `.env` file:
     ```bash
     BACKEND_API_URL=hhttps://louise-therapist-foundations-museum.trycloudflare.com
     ```

10. **Restart services:**
    - Stop your Expo frontend.
    - Restart Supabase:
      ```bash
      supabase stop
      supabase start
      ```
    - When Supabase is running again, restart the frontend with a tunnel:
      ```bash
      npx expo start --tunnel -c
      ```

11. **Run the app:**
    - Scan the QR code with a device that has **Expo Go** installed (e.g., iPhone or iPad), **or** press `i` to open the iOS simulator.

12. **View the database:**
    - Visit the link below to see the database structure:
      ```
      http://localhost:54323/project/default/database/schemas
      ```
