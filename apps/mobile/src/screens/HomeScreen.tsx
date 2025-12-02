import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery } from "convex/react";
import { Category } from "../../../../types";
import { extractTweetUrl } from "../utils/tweet";
import { RootStackParamList } from "../navigation/types";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Home">;
};

const categoryOptions: Category[] = ["learning", "news", "inspiration"];

export const HomeScreen = ({ navigation }: Props) => {
  const counts = useQuery("items:counts");
  const createAndAnalyze = useMutation("items:createAndAnalyze");
  const [inputText, setInputText] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<Category>("learning");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAnalyze = async () => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      return;
    }
    setIsSubmitting(true);
    const tweetUrl = extractTweetUrl(trimmed);
    try {
      await createAndAnalyze({
        originalText: trimmed,
        tweetUrl,
        category: selectedCategory,
      });
      setInputText("");
      navigation.navigate("Results", { category: selectedCategory });
    } catch (error: any) {
      console.error(error);
      Alert.alert(
        "Error",
        error?.message ?? "We couldn't analyze that tweet. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>TweetMind</Text>
        <Text style={styles.title}>Transform tweets into structured knowledge</Text>
        <Text style={styles.subtitle}>
          Paste a tweet link or text, choose a mode, and let TweetMind craft
          learning paths, news briefings, or inspiration sparks.
        </Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Add Content</Text>
          <TextInput
            multiline
            placeholder="Paste tweet link or content to begin..."
            placeholderTextColor="#94a3b8"
            value={inputText}
            onChangeText={setInputText}
            style={styles.textarea}
          />

          <View style={styles.categoryRow}>
            {categoryOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.categoryButton,
                  selectedCategory === option && styles.categoryButtonActive,
                ]}
                onPress={() => setSelectedCategory(option)}
              >
                <Text
                  style={[
                    styles.categoryLabel,
                    selectedCategory === option && styles.categoryLabelActive,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              (!inputText.trim() || isSubmitting) && styles.primaryButtonDisabled,
            ]}
            onPress={handleAnalyze}
            disabled={!inputText.trim() || isSubmitting}
          >
            <Text style={styles.primaryButtonText}>
              {isSubmitting ? "Processing..." : "Analyze Content"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Browse Library</Text>
          <View style={styles.libraryList}>
            <BrowseCard
              title="Learning Paths"
              description="Review Feynman breakdowns and study guides."
              count={counts?.learning ?? 0}
              onPress={() => navigation.navigate("Results", { category: "learning" })}
            />
            <BrowseCard
              title="News Briefings"
              description="Access summarized news and related links."
              count={counts?.news ?? 0}
              onPress={() => navigation.navigate("Results", { category: "news" })}
            />
            <BrowseCard
              title="Inspiration Board"
              description="See creative sparks and generated tweets."
              count={counts?.inspiration ?? 0}
              onPress={() =>
                navigation.navigate("Results", { category: "inspiration" })
              }
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const BrowseCard = ({
  title,
  description,
  count,
  onPress,
}: {
  title: string;
  description: string;
  count: number;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.browseCard} onPress={onPress}>
    <View>
      <Text style={styles.browseTitle}>{title}</Text>
      <Text style={styles.browseDescription}>{description}</Text>
    </View>
    <Text style={styles.browseCount}>{count} items</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    padding: 20,
    gap: 16,
  },
  eyebrow: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6366f1",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 15,
    color: "#475569",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: "#0f172a",
  },
  textarea: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 16,
    textAlignVertical: "top",
    fontSize: 16,
    color: "#1e293b",
    marginBottom: 16,
    backgroundColor: "#f8fafc",
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  categoryButtonActive: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a",
  },
  categoryLabel: {
    color: "#475569",
    textAlign: "center",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  categoryLabelActive: {
    color: "#fff",
  },
  primaryButton: {
    backgroundColor: "#0f172a",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  libraryList: {
    gap: 12,
  },
  browseCard: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  browseTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  browseDescription: {
    fontSize: 13,
    color: "#475569",
    marginTop: 4,
  },
  browseCount: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "700",
    color: "#2563eb",
    textTransform: "uppercase",
  },
});


