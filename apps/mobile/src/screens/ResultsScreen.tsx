import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Category, LearningStep, TweetItem } from "../../../../types";
import { formatDate } from "../utils/tweet";
import { RootStackParamList } from "../navigation/types";
import { TweetWebView } from "../components/TweetWebView";

type Route = RouteProp<RootStackParamList, "Results">;

type Props = {
  route: Route;
};

const categories: Category[] = ["learning", "news", "inspiration"];

export const ResultsScreen = ({ route }: Props) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState<Category>(route.params.category);

  useEffect(() => {
    setActiveTab(route.params.category);
  }, [route.params.category]);

  const items = useQuery("items:listByCategory", { category: activeTab });
  const deleteItemMutation = useMutation("items:deleteItem");
  
  const deleteItem = async (id: string) => {
    await deleteItemMutation({ id: id as Id<"items"> });
  };
  
  const data: TweetItem[] = useMemo(() => {
    if (!items) return [];
    return items.map((item: any) => ({
      id: item._id,
      originalText: item.originalText,
      tweetUrl: item.tweetUrl ?? undefined,
      category: item.category,
      createdAt: item.createdAt,
      learningData: item.learningData ?? undefined,
      newsData: item.newsData ?? undefined,
      inspirationData: item.inspirationData ?? undefined,
      isLoading: item.isLoading,
      error: item.error ?? undefined,
    }));
  }, [items]);

  const isLoading = items === undefined;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Home</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{activeTab} Library</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.tabs}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.tabButton,
              activeTab === category && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab(category)}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === category && styles.tabLabelActive,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={() => {}} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No {activeTab} items yet</Text>
              <Text style={styles.emptySubtitle}>
                Add content from the home screen to populate this library.
              </Text>
            </View>
          }
          renderItem={({ item }) => <ContentCard item={item} onDelete={deleteItem} />}
        />
      )}
    </SafeAreaView>
  );
};

const ContentCard = ({ item, onDelete }: { item: TweetItem; onDelete: (id: string) => Promise<void> }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      "Delete Item",
      "Are you sure you want to delete this item?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await onDelete(item.id);
            } catch (error) {
              console.error("Failed to delete item", error);
              Alert.alert("Error", "Failed to delete item. Please try again.");
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (item.isLoading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator color="#6366f1" />
        <Text style={styles.loadingText}>Processing...</Text>
      </View>
    );
  }

  if (item.error) {
    return (
      <View style={[styles.card, styles.errorCard]}>
        <View style={styles.errorHeader}>
          <Text style={styles.errorText}>{item.error}</Text>
          <TouchableOpacity
            onPress={handleDelete}
            disabled={isDeleting}
            style={styles.deleteButton}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.categoryPill}>{item.category}</Text>
          <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
        </View>
        <TouchableOpacity
          onPress={handleDelete}
          disabled={isDeleting}
          style={styles.deleteButton}
        >
          <Text style={styles.deleteButtonText}>
            {isDeleting ? "Deleting..." : "Delete"}
          </Text>
        </TouchableOpacity>
      </View>
      {item.tweetUrl && <TweetWebView tweetUrl={item.tweetUrl} />}
      <Text style={styles.originalText}>{item.originalText}</Text>

      {item.category === "learning" && (
        <LearningView data={item.learningData ?? []} />
      )}
      {item.category === "news" && item.newsData && (
        <NewsView data={item.newsData} />
      )}
      {item.category === "inspiration" && item.inspirationData && (
        <InspirationView data={item.inspirationData} />
      )}
    </View>
  );
};

const LearningView = ({ data }: { data: LearningStep[] }) => (
  <View style={styles.learningContainer}>
    {data.map((step) => (
      <View key={step.stepNumber} style={styles.learningStep}>
        <Text style={styles.learningStepNumber}>{step.stepNumber}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.learningConcept}>{step.concept}</Text>
          <Text style={styles.learningExplanation}>{step.explanation}</Text>
          <Text style={styles.learningAnalogy}>Analogy: {step.analogy}</Text>
        </View>
      </View>
    ))}
  </View>
);

const NewsView = ({ data }: { data: TweetItem["newsData"] }) => (
  <View style={styles.newsContainer}>
    <Text style={styles.newsSummary}>{data?.summary}</Text>
    <View style={{ marginVertical: 8 }}>
      {data?.keyPoints.map((point, idx) => (
        <Text key={idx} style={styles.newsPoint}>
          • {point}
        </Text>
      ))}
    </View>
    {data?.similarLinks.map((link, idx) => (
      <Text key={idx} style={styles.newsLink}>
        {idx + 1}. {link.title}
      </Text>
    ))}
  </View>
);

const InspirationView = ({
  data,
}: {
  data: NonNullable<TweetItem["inspirationData"]>;
}) => {
  const [revealed, setRevealed] = useState(false);
  return (
    <View style={styles.inspirationContainer}>
      <View style={styles.tagsRow}>
        {data.tags.map((tag) => (
          <Text key={tag} style={styles.tag}>
            #{tag}
          </Text>
        ))}
      </View>
      <Text style={styles.contextAnalysis}>{data.contextAnalysis}</Text>

      {revealed ? (
        <View style={styles.tweetBox}>
          <Text style={styles.tweetText}>{data.suggestedTweet}</Text>
          <TouchableOpacity onPress={() => setRevealed(false)}>
            <Text style={styles.closeLink}>Hide</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.revealButton}
          onPress={() => setRevealed(true)}
        >
          <Text style={styles.revealLabel}>Generate Creative Spin</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  back: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2563eb",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    textTransform: "capitalize",
  },
  tabs: {
    flexDirection: "row",
    marginHorizontal: 20,
    borderRadius: 16,
    backgroundColor: "#e2e8f0",
    padding: 4,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  tabLabel: {
    textAlign: "center",
    fontWeight: "600",
    color: "#475569",
    textTransform: "capitalize",
  },
  tabLabelActive: {
    color: "#0f172a",
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    padding: 20,
    gap: 16,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptySubtitle: {
    color: "#64748b",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#fee2e2",
  },
  deleteButtonText: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "600",
  },
  errorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    textAlign: "center",
    color: "#475569",
  },
  errorCard: {
    borderColor: "#fecaca",
    backgroundColor: "#fee2e2",
  },
  errorText: {
    color: "#b91c1c",
    fontWeight: "600",
  },
  categoryPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#eef2ff",
    color: "#4f46e5",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  date: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
    marginBottom: 12,
  },
  originalText: {
    fontStyle: "italic",
    color: "#1e293b",
    marginBottom: 16,
  },
  learningContainer: {
    gap: 12,
  },
  learningStep: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  learningStepNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2563eb",
  },
  learningConcept: {
    fontWeight: "700",
    color: "#0f172a",
  },
  learningExplanation: {
    color: "#475569",
  },
  learningAnalogy: {
    marginTop: 4,
    fontSize: 12,
    color: "#a16207",
  },
  newsContainer: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  newsSummary: {
    color: "#0f172a",
    marginBottom: 8,
  },
  newsPoint: {
    color: "#475569",
    marginLeft: 8,
  },
  newsLink: {
    color: "#2563eb",
    marginTop: 4,
  },
  inspirationContainer: {
    gap: 12,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d8b4fe",
    color: "#7e22ce",
    fontWeight: "600",
  },
  contextAnalysis: {
    color: "#475569",
  },
  revealButton: {
    backgroundColor: "#4f46e5",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  revealLabel: {
    color: "#fff",
    fontWeight: "700",
  },
  tweetBox: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#fff",
  },
  tweetText: {
    color: "#0f172a",
    fontWeight: "600",
    marginBottom: 8,
  },
  closeLink: {
    color: "#2563eb",
    fontWeight: "600",
  },
});


