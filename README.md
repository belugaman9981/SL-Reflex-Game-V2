# SL-Reflex-Game-V2
the second version of the original sl reflex game

## Main problems right now

1. **No automated quality checks**
   - There is no test suite, no lint setup, and no build script in the repository, so regressions are easy to miss.

2. **Large single-file frontend code**
   - Most of the extension logic lives in `popup.js` and most styling lives in `popup.css`, which makes the project harder to debug and maintain as it grows.

3. **Backend/analytics details are hardcoded in the client**
   - The popup directly contains the Supabase URL and publishable key and sends analytics/leaderboard traffic from the client, which creates privacy, security, and maintainability concerns.

4. **Error handling is minimal**
   - Network failures mostly fall back to empty states or simple alerts, so users do not get much guidance when leaderboard/submission features fail.

5. **Very limited project documentation**
   - The repository currently does not explain local development, testing, deployment, or the expected structure of the extension.
