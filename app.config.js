// d:/ARKTINI/Reach-insta/insta-reach-tracker/app.config.js
import "dotenv/config";

export default {
  expo: {
    name: "instareachtracker",
    slug: "instareachtracker",
    version: "1.0.0",
    orientation: "portrait",
    owner: "gks2331",
    // ... any other existing expo config you have
    extra: {
      instagramAppId: process.env.INSTAGRAM_APP_ID,
      instagramClientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
    },
  },
};