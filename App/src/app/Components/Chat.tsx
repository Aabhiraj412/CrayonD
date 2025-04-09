import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  ScrollView,
  Animated,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  FlatList,
} from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const Chat = () => {
  const [messages, setMessages] = useState<
    { sender: "bot" | "user"; text: string }[]
  >([
    {
      sender: "bot",
      text: "Hello there! Who would you like to analyze today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef(null);

  // Theme state
  const [theme, setTheme] = useState("dark");
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);

  // Define base API URL that works with React Native
  const API_BASE_URL = 'http://10.0.2.2:8000'; // For Android emulator
  // If using iOS simulator, use 'http://localhost:8000' or your computer's local IP
  // If testing on physical device, use your computer's local network IP like 'http://192.168.1.X:8000'

  // Updated loadMessages function with proper React Native API URL
  const loadMessages = async () => {
    setLoading(true);

    try {
    //   const res = await fetch(`${API_BASE_URL}/memory`, {
      const res = await fetch(`https://crayond.onrender.com/memory`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      console.log("Memory data:", data);

      if (
        res.status === 200 &&
        data.messages &&
        Array.isArray(data.messages)
      ) {
        console.log("Messages loaded successfully");

        // Process the memory data to create message pairs
        const memoryMessages = [];
        memoryMessages.push({
          sender: "bot",
          text: "Hello there! Who would you like to analyze today?",
        });
        for (let i = 0; i < data.messages.length; i += 2) {
          if (i + 1 < data.messages.length) {
            const userMessage = data.messages[i];
            const botMessage = data.messages[i + 1].replace(
              /```$/,
              ""
            ); // Remove trailing code markers

            memoryMessages.push(
              { sender: "user", text: userMessage },
              { sender: "bot", text: botMessage }
            );
          }
        }

        if (memoryMessages.length > 0) {
          // Replace the initial greeting with the actual conversation history
          setMessages(memoryMessages);
        }
      } else {
        console.log(
          "Failed to load messages or messages format incorrect"
        );
      }
    } catch (e) {
      console.log("Error loading messages:", e);
      alert(`Failed to load messages: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Updated clearMemory function with proper error handling
  const clearMemory = async () => {
    setLoading(true);
    try {
      console.log("Sending clear memory request to:", `${API_BASE_URL}/clear-memory`);
      
      const res = await fetch(`https://crayond.onrender.com/clear-memory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (res.status === 200) {
        console.log("Memory cleared successfully");

        // Close the settings modal after clearing memory
        setIsSettingsModalOpen(false);

        // Clear messages from state
        setMessages([
          {
            sender: "bot",
            text: "Hello there! Who would you like to analyze today?",
          },
        ]);
      } else {
        const errorData = await res.text();
        console.log("Server returned error:", res.status, errorData);
        alert(`Failed to clear chat history. Server returned: ${res.status}`);
      }
    } catch (e) {
      console.log("Error clearing memory:", e);
      // More detailed error message
      alert(`Network error when clearing history: ${e.message}. Check your connection and server.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);
  
  // Toggle theme function
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Add search functionality states
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [currentResult, setCurrentResult] = useState(0);
  const searchInputRef = useRef(null);

  // Function to handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    // Filter messages that contain the search term
    const results = messages.reduce((acc, msg, index) => {
      if (msg.text.toLowerCase().includes(term.toLowerCase())) {
        acc.push(index);
      }
      return acc;
    }, []);

    setSearchResults(results);
    setCurrentResult(results.length > 0 ? 0 : -1);

    // Scroll to first result if exists
    if (results.length > 0) {
      scrollToMessage(results[0]);
    }
  };

  // Navigate between search results
  const navigateResults = (direction) => {
    if (searchResults.length === 0) return;

    let newResult;
    if (direction === "next") {
      newResult = (currentResult + 1) % searchResults.length;
    } else {
      newResult =
        (currentResult - 1 + searchResults.length) %
        searchResults.length;
    }

    setCurrentResult(newResult);
    scrollToMessage(searchResults[newResult]);
  };

  // Scroll to a specific message by index
  const scrollToMessage = (index) => {
    // React Native implementation is different from web scrollIntoView
    if (scrollViewRef.current) {
      // This is a simplified version, actual implementation depends on your FlatList/ScrollView structure
      scrollViewRef.current.scrollTo({ y: index * 100, animated: true });
    }
  };

  // Toggle search bar
  const toggleSearchBar = () => {
    setIsSearching(!isSearching);
    if (!isSearching) {
      // Focusing in React Native
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    } else {
      // Clear search when closing
      setSearchTerm("");
      setSearchResults([]);
    }
  };

  // Highlight search terms in text for React Native
  const highlightText = (text, term) => {
    if (!term.trim() || !text.toLowerCase().includes(term.toLowerCase())) {
      return <Text>{text}</Text>;
    }

    const parts = text.split(new RegExp(`(${term})`, "gi"));
    return (
      <Text>
        {parts.map((part, i) =>
          part.toLowerCase() === term.toLowerCase() ? (
            <Text key={i} style={styles.highlightedText}>
              {part}
            </Text>
          ) : (
            <Text key={i}>{part}</Text>
          )
        )}
      </Text>
    );
  };

  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Updated handleSend function with proper React Native API URL
  const handleSend = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text: input }]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch(`https://crayond.onrender.com/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: input }),
      });

      const data = await res.json();

      if (res.status === 200) {
        console.log("Bot response:", data);

        // Clean up the response by removing trailing code markers if present
        const cleanedResponse = data.response.replace(/```$/, "");

        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: cleanedResponse,
          },
        ]);
      } else {
        console.log("Error response from server:", data);
        throw new Error(`Server error: ${res.status}`);
      }
    } catch (e) {
      console.log("Error sending message:", e);
      // Show error message to user
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: `Sorry, I encountered an error: ${e.message}. Please check your network connection.`,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Helper function to handle suggestion chip clicks
  const handleSuggestionClick = (text) => {
    setInput(text);
    // Use setTimeout to ensure state update before sending
    setTimeout(() => {
      handleSend();
    }, 0);
  };

  return (
    <SafeAreaView style={[styles.container, theme === "dark" ? styles.darkContainer : styles.lightContainer]}>
      <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} />
      
      {/* Loading Overlay */}
      {loading && (
        <Modal transparent visible={loading}>
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <View style={styles.loadingDotsContainer}>
                <Animated.View style={[styles.loadingDot, styles.greenDot, { opacity: 1 }]} />
                <Animated.View style={[styles.loadingDot, styles.greenDot, { opacity: 0.8 }]} />
                <Animated.View style={[styles.loadingDot, styles.greenDot, { opacity: 0.6 }]} />
              </View>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          </View>
        </Modal>
      )}

      {/* Chat Header */}
      <LinearGradient
        colors={theme === "dark" ? ['#48bb78', '#38a169'] : ['#68d391', '#48bb78']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              <Image
                source={require('./assets/logo.jpg')}
                style={styles.logo}
                resizeMode="cover"
              />
            </View>
            <View>
              <Text style={styles.headerTitle}>CI Chat Advisor</Text>
              <Text style={styles.headerSubtitle}>Powered by Advanced Intelligence</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerButton} onPress={toggleSearchBar}>
              <Feather name="search" size={20} color="black" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={() => setIsSettingsModalOpen(true)}>
              <Feather name="settings" size={20} color="black" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Settings Modal */}
      <Modal
        visible={isSettingsModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSettingsModalOpen(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setIsSettingsModalOpen(false)}
        >
          <View 
            style={[
              styles.modalContent, 
              theme === "dark" ? styles.modalContentDark : styles.modalContentLight
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, theme === "dark" ? styles.textLight : styles.textDark]}>Settings</Text>
            </View>

            <View style={styles.settingSection}>
              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, theme === "dark" ? styles.textLight : styles.textDark]}>Theme</Text>
                <TouchableOpacity 
                  style={[
                    styles.themeToggle, 
                    theme === "dark" ? styles.themeToggleDark : styles.themeToggleLight
                  ]} 
                  onPress={toggleTheme}
                >
                  <Animated.View 
                    style={[
                      styles.themeToggleIndicator, 
                      theme === "dark" ? styles.themeToggleIndicatorDark : styles.themeToggleIndicatorLight
                    ]} 
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.settingHint}>{theme === "dark" ? "Dark Mode" : "Light Mode"}</Text>
            </View>

            <View style={styles.settingSection}>
              <Text style={[styles.settingSectionTitle, theme === "dark" ? styles.textLightMuted : styles.textDarkMuted]}>
                Chat History
              </Text>
              <TouchableOpacity 
                style={styles.clearHistoryButton} 
                onPress={clearMemory}
              >
                <Feather name="trash-2" size={16} color="white" />
                <Text style={styles.clearHistoryText}>Clear History</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Search Bar */}
      {isSearching && (
        <View style={[styles.searchBar, theme === "dark" ? styles.searchBarDark : styles.searchBarLight]}>
          <Feather name="search" size={18} color="gray" />
          <TextInput
            ref={searchInputRef}
            style={[styles.searchInput, theme === "dark" ? styles.textLight : styles.textDark]}
            placeholder="Search in conversation..."
            placeholderTextColor={theme === "dark" ? "#a0aec0" : "#718096"}
            value={searchTerm}
            onChangeText={handleSearch}
          />
          {searchResults.length > 0 && (
            <View style={styles.searchResultsNav}>
              <Text style={styles.searchResultsCounter}>
                {currentResult + 1}/{searchResults.length}
              </Text>
              <View style={styles.searchNavButtons}>
                <TouchableOpacity 
                  style={styles.searchNavButton} 
                  onPress={() => navigateResults("prev")}
                >
                  <Feather name="chevron-up" size={16} color="gray" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.searchNavButton} 
                  onPress={() => navigateResults("next")}
                >
                  <Feather name="chevron-down" size={16} color="gray" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          <TouchableOpacity style={styles.searchCloseButton} onPress={toggleSearchBar}>
            <Feather name="x" size={18} color="gray" />
          </TouchableOpacity>
        </View>
      )}

      {/* Chat Date Indicator */}
      <View style={styles.dateIndicatorContainer}>
        <View style={[styles.dateIndicator, theme === "dark" ? styles.dateIndicatorDark : styles.dateIndicatorLight]}>
          <Text style={[styles.dateIndicatorText, theme === "dark" ? styles.textLightMuted : styles.textDarkMuted]}>
            Today
          </Text>
        </View>
      </View>

      {/* Chat Window */}
      <ScrollView 
        ref={scrollViewRef} 
        style={styles.chatWindow}
        contentContainerStyle={styles.chatContent}
      >
        {messages.map((msg, index) => (
          <View
            key={index}
            style={[
              styles.messageContainer,
              msg.sender === "user" ? styles.userMessageContainer : styles.botMessageContainer
            ]}
          >
            <View style={styles.messageContent}>
              {msg.sender === "bot" && (
                <View style={styles.botIdentifier}>
                  <View style={styles.botAvatar}>
                    <Feather name="monitor" size={14} color="black" />
                  </View>
                  <Text style={[styles.botName, theme === "dark" ? styles.textLightMuted : styles.textDarkMuted]}>
                    CI Advisor
                  </Text>
                </View>
              )}
              <View style={[
                styles.messageBubble,
                msg.sender === "user" ? styles.userBubble : 
                  theme === "dark" ? styles.botBubbleDark : styles.botBubbleLight,
                searchResults.includes(index) && searchResults[currentResult] === index && styles.highlightedBubble
              ]}>
                {msg.sender === "bot" ? (
                  <View>
                    {searchTerm ? (
                      highlightText(msg.text, searchTerm)
                    ) : (
                      <Text style={[styles.messageText, msg.sender === "user" ? styles.userMessageText : (msg.sender === "bot" && theme === "dark" ? styles.botMessageTextDark : styles.botMessageTextLight)]}>
                        {msg.text}
                      </Text>
                    )}
                  </View>
                ) : (
                  <Text style={[styles.messageText, styles.userMessageText]}>
                    {searchTerm ? highlightText(msg.text, searchTerm) : msg.text}
                  </Text>
                )}
              </View>
            </View>
          </View>
        ))}

        {isTyping && (
          <View style={styles.botMessageContainer}>
            <View style={styles.messageContent}>
              <View style={styles.botIdentifier}>
                <View style={styles.botAvatar}>
                  <Feather name="monitor" size={14} color="black" />
                </View>
                <Text style={[styles.botName, theme === "dark" ? styles.textLightMuted : styles.textDarkMuted]}>
                  CI Advisor
                </Text>
              </View>
              <View style={[
                styles.messageBubble,
                theme === "dark" ? styles.botBubbleDark : styles.botBubbleLight
              ]}>
                <View style={styles.typingIndicator}>
                  <Animated.View style={styles.typingDot} />
                  <Animated.View style={[styles.typingDot, { marginLeft: 4 }]} />
                  <Animated.View style={[styles.typingDot, { marginLeft: 4 }]} />
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Suggestion Chips */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.suggestionsContainer}
        contentContainerStyle={styles.suggestionsContent}
      >
        <TouchableOpacity
          style={[styles.suggestionChip, theme === "dark" ? styles.suggestionChipDark : styles.suggestionChipLight]}
          onPress={() => handleSuggestionClick("Analyze Competitor X")}
        >
          <Text style={[styles.suggestionText, theme === "dark" ? styles.textLight : styles.textDark]}>
            Analyze Competitor X
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.suggestionChip, theme === "dark" ? styles.suggestionChipDark : styles.suggestionChipLight]}
          onPress={() => handleSuggestionClick("Market Trends")}
        >
          <Text style={[styles.suggestionText, theme === "dark" ? styles.textLight : styles.textDark]}>
            Market Trends
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.suggestionChip, theme === "dark" ? styles.suggestionChipDark : styles.suggestionChipLight]}
          onPress={() => handleSuggestionClick("SWOT Analysis")}
        >
          <Text style={[styles.suggestionText, theme === "dark" ? styles.textLight : styles.textDark]}>
            SWOT Analysis
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.suggestionChip, theme === "dark" ? styles.suggestionChipDark : styles.suggestionChipLight]}
          onPress={() => handleSuggestionClick("Pricing Strategy")}
        >
          <Text style={[styles.suggestionText, theme === "dark" ? styles.textLight : styles.textDark]}>
            Pricing Strategy
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Chat Input */}
      <View style={[styles.inputContainer, theme === "dark" ? styles.inputContainerDark : styles.inputContainerLight]}>
        <TouchableOpacity
          style={[styles.attachButton, theme === "dark" ? styles.attachButtonDark : styles.attachButtonLight]}
          onPress={() => alert("Feature coming soon!")}
        >
          <Feather 
            name="paperclip" 
            size={20} 
            color={theme === "dark" ? "#a0aec0" : "#4a5568"} 
          />
        </TouchableOpacity>
        <TextInput
          style={[
            styles.textInput,
            theme === "dark" ? styles.textInputDark : styles.textInputLight
          ]}
          placeholder="Ask something about a competitor..."
          placeholderTextColor={theme === "dark" ? "#a0aec0" : "#718096"}
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSend}
        >
          <Feather name="send" size={20} color="#000" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  darkContainer: {
    backgroundColor: "#1a202c", // dark gray
  },
  lightContainer: {
    backgroundColor: "#f7fafc", // light gray
  },
  // Text color styles
  textDark: {
    color: "#1a202c",
  },
  textLight: {
    color: "#f7fafc",
  },
  textDarkMuted: {
    color: "#4a5568",
  },
  textLightMuted: {
    color: "#a0aec0",
  },
  // Header styles
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginLeft: 5,
  },
  logo: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "black",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#276749", // dark green
  },
  headerRight: {
    flexDirection: "row",
    gap: 16,
  },
  headerButton: {
    padding: 8,
    borderRadius: 999,
  },
  // Loading Overlay styles
  loadingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    // backdropFilter is not supported in React Native
    // Consider using a library like react-native-blur for similar effects
  },
  loadingDotsContainer: {
    flexDirection: "row",
    marginBottom: 12,
  },
  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  greenDot: {
    backgroundColor: "#48bb78", // green-500
  },
  loadingText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  // Search bar styles
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  searchBarDark: {
    backgroundColor: "#2d3748",
    borderBottomColor: "#4a5568",
  },
  searchBarLight: {
    backgroundColor: "#e2e8f0",
    borderBottomColor: "#cbd5e0",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    backgroundColor: "transparent",
  },
  searchResultsNav: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  searchResultsCounter: {
    fontSize: 12,
    color: "#a0aec0",
  },
  searchNavButtons: {
    flexDirection: "row",
    marginLeft: 8,
  },
  searchNavButton: {
    padding: 4,
  },
  searchCloseButton: {
    padding: 4,
    marginLeft: 8,
  },
  // Date indicator styles
  dateIndicatorContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  dateIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  dateIndicatorDark: {
    backgroundColor: "#2d3748",
  },
  dateIndicatorLight: {
    backgroundColor: "#e2e8f0",
  },
  dateIndicatorText: {
    fontSize: 12,
  },
  // Chat window styles
  chatWindow: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageContainer: {
    marginBottom: 24,
  },
  userMessageContainer: {
    alignItems: "flex-end",
  },
  botMessageContainer: {
    alignItems: "flex-start",
  },
  messageContent: {
    maxWidth: "75%",
  },
  botIdentifier: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    paddingLeft: 8,
  },
  botAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#48bb78",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  botName: {
    fontSize: 12,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: "#48bb78",
    borderTopRightRadius: 0,
  },
  botBubbleDark: {
    backgroundColor: "#2d3748",
    borderTopLeftRadius: 0,
  },
  botBubbleLight: {
    backgroundColor: "#e2e8f0",
    borderTopLeftRadius: 0,
  },
  highlightedBubble: {
    borderWidth: 2,
    borderColor: "#ecc94b", // yellow-400
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: "black",
  },
  botMessageTextDark: {
    color: "#f7fafc", // gray-100
  },
  botMessageTextLight: {
    color: "#1a202c", // gray-900
  },
  highlightedText: {
    backgroundColor: "#ecc94b",
    color: "black",
  },
  typingIndicator: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#a0aec0",
  },
  // Suggestion chips styles
  suggestionsContainer: {
    maxHeight: 50,
  },
  suggestionsContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginRight: 8,
  },
  suggestionChipDark: {
    backgroundColor: "#2d3748",
  },
  suggestionChipLight: {
    backgroundColor: "#e2e8f0",
  },
  suggestionText: {
    fontSize: 14,
  },
  // Input container styles
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputContainerDark: {
    backgroundColor: "#2d3748",
  },
  inputContainerLight: {
    backgroundColor: "#e2e8f0",
  },
  attachButton: {
    padding: 8,
    borderRadius: 999,
    marginRight: 8,
  },
  attachButtonDark: {
    backgroundColor: "#2d3748",
  },
  attachButtonLight: {
    backgroundColor: "#e2e8f0",
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 8,
  },
  textInputDark: {
    backgroundColor: "#4a5568",
    color: "white",
  },
  textInputLight: {
    backgroundColor: "white",
    color: "#1a202c",
  },
  sendButton: {
    backgroundColor: "#48bb78",
    padding: 12,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: 300,
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
  },
  modalContentDark: {
    backgroundColor: "rgba(45, 55, 72, 0.95)",
    borderColor: "#4a5568",
  },
  modalContentLight: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderColor: "#e2e8f0",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  settingSection: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(160, 174, 192, 0.2)",
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingLabel: {
    fontWeight: "500",
  },
  settingHint: {
    fontSize: 12,
    color: "#a0aec0",
    marginTop: 4,
  },
  themeToggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: "center",
  },
  themeToggleDark: {
    backgroundColor: "#4a5568",
  },
  themeToggleLight: {
    backgroundColor: "#cbd5e0",
  },
  themeToggleIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  themeToggleIndicatorDark: {
    backgroundColor: "#48bb78",
    alignSelf: "flex-end",
  },
  themeToggleIndicatorLight: {
    backgroundColor: "white",
    alignSelf: "flex-start",
  },
  settingSectionTitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  clearHistoryButton: {
    backgroundColor: "#f56565",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    gap: 8,
  },
  clearHistoryText: {
    color: "white",
    fontWeight: "500",
  },
});

export default Chat;
