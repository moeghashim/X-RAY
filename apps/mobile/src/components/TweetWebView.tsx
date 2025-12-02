import { useMemo } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import WebView from "react-native-webview";
import { getTweetIdFromUrl } from "../utils/tweet";

type Props = {
  tweetUrl: string;
};

const HEIGHT = 420;

export const TweetWebView = ({ tweetUrl }: Props) => {
  const tweetId = useMemo(() => getTweetIdFromUrl(tweetUrl), [tweetUrl]);
  if (!tweetId) {
    return (
      <TouchableOpacity onPress={() => openExternal(tweetUrl)}>
        <Text style={styles.link}>View tweet</Text>
      </TouchableOpacity>
    );
  }

  const embedUrl = `https://platform.twitter.com/embed/Tweet.html?id=${tweetId}`;

  return (
    <View style={styles.container}>
      <WebView
        style={{ height: HEIGHT, width: "100%", borderRadius: 16 }}
        source={{ uri: embedUrl }}
        originWhitelist={["*"]}
        javaScriptEnabled
        automaticallyAdjustContentInsets
      />
    </View>
  );
};

const openExternal = (url: string) => {
  // We lazily require Linking to avoid importing react-native globally here.
  const { Linking } = require("react-native");
  Linking.openURL(url);
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 12,
  },
  link: {
    color: "#2563eb",
    fontWeight: "600",
  },
});


