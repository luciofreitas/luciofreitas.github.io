Firebase setup steps for this project

1) Create project in Firebase Console
   - https://console.firebase.google.com
   - Add a Web app and copy the config values

2) Create a local environment file
   - create a file named `.env.local` in the project root
   - copy values from `.env.example` and fill them

3) Enable Authentication providers
   - Authentication -> Sign-in method
   - Enable Google and add your app domains to Authorized domains

4) Install dependencies (already done if you pulled changes)
   npm install

5) Run the app
   npm run dev

Notes:
- Make sure to add the production domain to the Firebase Console when deploying.
- For Facebook login you need to create an app at developers.facebook.com and add App ID/Secret to Firebase.
