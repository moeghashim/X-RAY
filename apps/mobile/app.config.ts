import { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...config,
    name: "TweetMind",
    slug: "tweetmind",
    orientation: "portrait",
    newArchEnabled: true,
    userInterfaceStyle: "light",
    ios: {
      supportsTablet: false,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
    },
    extra: {
      ...config.extra,
      convexUrl: process.env.CONVEX_URL ?? "",
    },
  };
};


