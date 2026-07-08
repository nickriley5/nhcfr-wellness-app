/**
 * AI Coach Chat Screen
 * Real-time chat with AI fitness/nutrition coach
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { auth, db } from '../firebase';
import {
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  deleteDoc,
  writeBatch,
  getDocs,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { chatWithCoach, AIMessage } from '../utils/ai/aiService';
import Toast from 'react-native-toast-message';

interface ChatMessage extends AIMessage {
  id: string;
  timestamp: Date;
  isTyping?: boolean;
}

interface ChatThread {
  id: string;
  title: string;
  lastMessage?: string;
  messageCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
  context?: string;
  isLegacyImport?: boolean;
}

type AIChatRoute = RouteProp<RootStackParamList, 'AIChat'>;

const AIChatScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<AIChatRoute>();
  const workoutContext = route.params?.context ? route.params.context : undefined;
  const insets = useSafeAreaInsets();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const contextThreadCreatedRef = useRef(false);

  // Load user profile and thread list
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    let unsubscribeThreads = () => {};
    const loadData = async () => {
      try {
        const profileDoc = await getDoc(doc(db, 'users', uid));
        if (profileDoc.exists()) {
          setUserProfile(profileDoc.data());
        }

        const threadsQuery = query(
          collection(db, 'users', uid, 'aiChatThreads'),
          orderBy('updatedAt', 'desc')
        );

        unsubscribeThreads = onSnapshot(threadsQuery, (snapshot) => {
          const threadData: ChatThread[] = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            title: docSnap.data().title || 'Chat',
            lastMessage: docSnap.data().lastMessage,
            messageCount: docSnap.data().messageCount,
            createdAt: docSnap.data().createdAt?.toDate?.(),
            updatedAt: docSnap.data().updatedAt?.toDate?.(),
            context: docSnap.data().context,
            isLegacyImport: docSnap.data().isLegacyImport,
          }));
          setThreads(threadData);
          setLoadingThreads(false);
        });
      } catch (error) {
        console.error('Error loading chat data:', error);
        setLoadingThreads(false);
      }
    };

    loadData();
    return () => unsubscribeThreads();
  }, []);

  // Auto-create a workout-context thread if provided
  useEffect(() => {
    if (!workoutContext || contextThreadCreatedRef.current || loadingThreads) return;
    if (activeThreadId) return;
    if (!auth.currentUser?.uid) return;

    contextThreadCreatedRef.current = true;
    createThread({
      title: 'Workout Q&A',
      context: workoutContext,
    }).catch((error) => {
      console.error('Error creating workout thread:', error);
    });
  }, [workoutContext, loadingThreads, activeThreadId]);

  // Subscribe to messages for active thread
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid || !activeThreadId) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    const messagesQuery = query(
      collection(db, 'users', uid, 'aiChatThreads', activeThreadId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const threadMessages: ChatMessage[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        role: docSnap.data().role,
        content: docSnap.data().content,
        timestamp: docSnap.data().timestamp?.toDate?.() || new Date(),
      }));
      setMessages(threadMessages);
      setLoadingMessages(false);
    });

    return () => unsubscribe();
  }, [activeThreadId]);

  // One-time legacy import if no threads exist
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid || loadingThreads) return;
    if (threads.length > 0) return;

    const importLegacy = async () => {
      try {
        const legacyQuery = query(
          collection(db, 'users', uid, 'aiChats'),
          orderBy('timestamp', 'asc'),
          limit(50)
        );
        const legacySnap = await getDocs(legacyQuery);
        if (legacySnap.empty) return;

        const legacyThread = await addDoc(collection(db, 'users', uid, 'aiChatThreads'), {
          title: 'Legacy Chat',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastMessage: legacySnap.docs[legacySnap.docs.length - 1]?.data()?.content || '',
          messageCount: legacySnap.size,
          isLegacyImport: true,
        });

        const batch = writeBatch(db);
        legacySnap.docs.forEach((docSnap) => {
          const data = docSnap.data();
          batch.set(doc(db, 'users', uid, 'aiChatThreads', legacyThread.id, 'messages', docSnap.id), {
            role: data.role,
            content: data.content,
            timestamp: data.timestamp || new Date(),
          });
        });
        await batch.commit();
      } catch (error) {
        console.error('Error importing legacy chat:', error);
      }
    };

    importLegacy();
  }, [threads, loadingThreads]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const activeThread = threads.find(t => t.id === activeThreadId) || null;

  const createThread = async (options?: { title?: string; context?: string }) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return null;

    const title = options?.title || 'New Chat';
    const threadDoc = await addDoc(collection(db, 'users', uid, 'aiChatThreads'), {
      title,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: '',
      messageCount: 0,
      context: options?.context || '',
    });

    setActiveThreadId(threadDoc.id);
    return threadDoc.id;
  };

  const handleNewChat = async () => {
    await createThread();
  };

  const handleSelectThread = (threadId: string) => {
    setActiveThreadId(threadId);
  };

  const deleteThread = async (threadId: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const threadRef = doc(db, 'users', uid, 'aiChatThreads', threadId);
    const messagesRef = collection(db, 'users', uid, 'aiChatThreads', threadId, 'messages');
    let hasMore = true;

    while (hasMore) {
      const msgSnap = await getDocs(query(messagesRef, orderBy('timestamp', 'asc'), limit(200)));
      if (msgSnap.empty) {
        hasMore = false;
        break;
      }
      const batch = writeBatch(db);
      msgSnap.docs.forEach((docSnap) => batch.delete(docSnap.ref));
      await batch.commit();
    }

    await deleteDoc(threadRef);
    if (activeThreadId === threadId) {
      setActiveThreadId(null);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || loading) return;

    const uid = auth.currentUser?.uid;
    if (!uid) {
      Toast.show({
        type: 'error',
        text1: 'Not logged in',
        text2: 'Please sign in to use AI Coach',
      });
      return;
    }

    const userMessage = inputText.trim();
    setInputText('');
    setLoading(true);

    try {
      let threadId = activeThreadId;
      if (!threadId) {
        threadId = await createThread({
          title: workoutContext ? 'Workout Q&A' : 'New Chat',
          context: workoutContext,
        });
      }
      if (!threadId) {
        throw new Error('Unable to create chat thread');
      }

      const currentThread = threads.find(t => t.id === threadId);
      const shouldUpdateTitle =
        !currentThread?.title || currentThread.title === 'New Chat';
      const nextTitle: string | null = shouldUpdateTitle ? summarizeTitle(userMessage) : null;

      // Add user message to Firestore
      await addDoc(collection(db, 'users', uid, 'aiChatThreads', threadId, 'messages'), {
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      });

      await updateDoc(doc(db, 'users', uid, 'aiChatThreads', threadId), {
        ...(shouldUpdateTitle ? { title: nextTitle } : {}),
        lastMessage: userMessage,
        updatedAt: serverTimestamp(),
        messageCount: increment(1),
      });

      // Get conversation history (last 10 messages for context)
      const conversationHistory: AIMessage[] = messages
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      const threadContext = threads.find(t => t.id === threadId)?.context || workoutContext;

      // Get AI response
      const aiResponse = await chatWithCoach(
        userMessage,
        conversationHistory,
        {
          name: userProfile?.fullName,
          goals: userProfile?.goals,
          experience: userProfile?.experienceLevel,
        },
        threadContext
      );

      // Add AI response to Firestore
      await addDoc(collection(db, 'users', uid, 'aiChatThreads', threadId, 'messages'), {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      });

      await updateDoc(doc(db, 'users', uid, 'aiChatThreads', threadId), {
        lastMessage: aiResponse,
        updatedAt: serverTimestamp(),
        messageCount: increment(1),
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error sending message:', errorMessage);
      Toast.show({
        type: 'error',
        text1: 'Failed to send message',
        text2: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatThreadTime = (date?: Date) => {
    if (!date) return '';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const summarizeTitle = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return 'New Chat';
    const cleaned = trimmed.replace(/\s+/g, ' ');
    const words = cleaned.split(' ');
    const maxWords = 6;
    const title = words.slice(0, maxWords).join(' ');
    return title.length > 32 ? `${title.slice(0, 32)}…` : title;
  };

  return (
    <LinearGradient colors={['#0f0f0f', '#1a1a1a']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              if (activeThreadId) {
                setActiveThreadId(null);
              } else {
                navigation.goBack();
              }
            }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>
              {activeThread ? activeThread.title : '🤖 AI Coach'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {activeThread ? 'Workout-aware coaching' : 'Powered by advanced AI'}
            </Text>
          </View>
          <Pressable onPress={handleNewChat} style={styles.newChatButton}>
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>
        </View>

        {!activeThreadId ? (
          <ScrollView style={styles.threadsContainer} contentContainerStyle={styles.threadsContent}>
            {loadingThreads ? (
              <View style={styles.loadingState}>
                <ActivityIndicator color="#FF3C38" size="small" />
                <Text style={styles.loadingText}>Loading chats...</Text>
              </View>
            ) : threads.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>🧠</Text>
                <Text style={styles.emptyStateTitle}>Start a new coach chat</Text>
                <Text style={styles.emptyStateText}>
                  Save threads by topic so you can come back to them later.
                </Text>
                <Pressable style={styles.primaryActionButton} onPress={handleNewChat}>
                  <Text style={styles.primaryActionText}>New Chat</Text>
                </Pressable>
              </View>
            ) : (
              threads.map((thread) => (
                <Pressable
                  key={thread.id}
                  style={styles.threadCard}
                  onPress={() => handleSelectThread(thread.id)}
                >
                  <View style={styles.threadInfo}>
                    <Text style={styles.threadTitle}>{thread.title}</Text>
                    <Text style={styles.threadPreview} numberOfLines={2}>
                      {thread.lastMessage || 'No messages yet'}
                    </Text>
                    <Text style={styles.threadMeta}>
                      {thread.messageCount || 0} messages
                      {thread.updatedAt ? ` • ${formatThreadTime(thread.updatedAt)}` : ''}
                    </Text>
                  </View>
                  <Pressable
                    onPress={(event) => {
                      event.stopPropagation?.();
                      deleteThread(thread.id);
                    }}
                    style={styles.threadDelete}
                  >
                    <Ionicons name="trash-outline" size={20} color="#FF3C38" />
                  </Pressable>
                </Pressable>
              ))
            )}
          </ScrollView>
        ) : (
          <>
            {/* Messages */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
            >
              {loadingMessages && (
                <View style={styles.loadingState}>
                  <ActivityIndicator color="#FF3C38" size="small" />
                  <Text style={styles.loadingText}>Loading messages...</Text>
                </View>
              )}

              {messages.length === 0 && !loadingMessages && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateIcon}>👋</Text>
                  <Text style={styles.emptyStateTitle}>Ask your coach</Text>
                  <Text style={styles.emptyStateText}>
                    Ask your coach anything you&apos;d like about fitness or nutrition, and we&apos;ll figure it out together.
                  </Text>
                </View>
              )}

              {messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageBubble,
                    message.role === 'user' ? styles.userMessage : styles.aiMessage,
                  ]}
                >
                  {message.role === 'assistant' && (
                    <View style={styles.aiIcon}>
                      <Text style={styles.aiIconText}>🤖</Text>
                    </View>
                  )}
                  <View style={styles.messageContent}>
                    <Text
                      style={[
                        styles.messageText,
                        message.role === 'user' ? styles.userMessageText : styles.aiMessageText,
                      ]}
                    >
                      {message.content}
                    </Text>
                    <Text style={styles.messageTime}>
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              ))}

              {loading && (
                <View style={[styles.messageBubble, styles.aiMessage]}>
                  <View style={styles.aiIcon}>
                    <Text style={styles.aiIconText}>🤖</Text>
                  </View>
                  <View style={styles.typingIndicator}>
                    <ActivityIndicator color="#FF3C38" size="small" />
                    <Text style={styles.typingText}>Thinking...</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Input */}
            <View style={[styles.inputContainer, { paddingBottom: Math.max(12, insets.bottom) }]}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask me anything..."
                placeholderTextColor="#666"
                multiline
                maxLength={500}
                editable={!loading}
              />
              <Pressable
                style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={!inputText.trim() || loading}
              >
                <Ionicons name="send" size={20} color="#fff" />
              </Pressable>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backButton: {
    width: 40,
  },
  newChatButton: {
    width: 40,
    alignItems: 'flex-end',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  threadsContainer: {
    flex: 1,
  },
  threadsContent: {
    padding: 16,
  },
  threadCard: {
    flexDirection: 'row',
    backgroundColor: '#1f1f1f',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 12,
  },
  threadInfo: {
    flex: 1,
    marginRight: 12,
  },
  threadTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  threadPreview: {
    fontSize: 13,
    color: '#bbb',
  },
  threadMeta: {
    fontSize: 11,
    color: '#777',
  },
  threadDelete: {
    padding: 8,
    alignSelf: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyStateIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 32,
  },
  primaryActionButton: {
    backgroundColor: '#FF3C38',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  primaryActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  loadingText: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 10,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  aiMessage: {
    alignSelf: 'flex-start',
  },
  aiIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  aiIconText: {
    fontSize: 18,
  },
  messageContent: {
    flex: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userMessageText: {
    backgroundColor: '#FF3C38',
    color: '#fff',
    padding: 12,
    borderRadius: 16,
    borderBottomRightRadius: 4,
  },
  aiMessageText: {
    backgroundColor: '#222',
    color: '#fff',
    padding: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
  },
  messageTime: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    marginLeft: 12,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    padding: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
  },
  typingText: {
    color: '#aaa',
    marginLeft: 8,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#222',
    backgroundColor: '#0f0f0f',
  },
  input: {
    flex: 1,
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 10,
    maxHeight: 100,
    fontSize: 15,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF3C38',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#444',
    opacity: 0.5,
  },
});

export default AIChatScreen;
