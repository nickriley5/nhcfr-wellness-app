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
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, collection, addDoc, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { chatWithCoach, AIMessage } from '../utils/ai/aiService';
import Toast from 'react-native-toast-message';

interface ChatMessage extends AIMessage {
  id: string;
  timestamp: Date;
  isTyping?: boolean;
}

const AIChatScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Load user profile and chat history
  useEffect(() => {
    const loadData = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      try {
        // Load user profile
        const profileDoc = await getDoc(doc(db, 'users', uid));
        if (profileDoc.exists()) {
          setUserProfile(profileDoc.data());
        }

        // Load recent chat history (last 20 messages)
        const chatQuery = query(
          collection(db, 'users', uid, 'aiChats'),
          orderBy('timestamp', 'desc'),
          limit(20)
        );

        const unsubscribe = onSnapshot(chatQuery, (snapshot) => {
          const chatMessages: ChatMessage[] = snapshot.docs
            .map(doc => ({
              id: doc.id,
              role: doc.data().role,
              content: doc.data().content,
              timestamp: doc.data().timestamp?.toDate() || new Date(),
            }))
            .reverse();

          setMessages(chatMessages);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error loading chat data:', error);
      }
    };

    loadData();
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

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
      // Add user message to Firestore
      await addDoc(collection(db, 'users', uid, 'aiChats'), {
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      });

      // Get conversation history (last 10 messages for context)
      const conversationHistory: AIMessage[] = messages
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      // Get AI response
      const aiResponse = await chatWithCoach(userMessage, conversationHistory, {
        name: userProfile?.fullName,
        goals: userProfile?.goals,
        experience: userProfile?.experienceLevel,
      });

      // Add AI response to Firestore
      await addDoc(collection(db, 'users', uid, 'aiChats'), {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      });

    } catch (error) {
      console.error('Error sending message:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to send message',
        text2: 'Please try again',
      });
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    '💪 Suggest a workout for today',
    '🍽️ What should I eat for lunch?',
    '📊 Review my progress',
    '🤔 I have a question about form',
    '🎯 Help me set better goals',
  ];

  return (
    <LinearGradient colors={['#0f0f0f', '#1a1a1a']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={90}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>🤖 AI Coach</Text>
            <Text style={styles.headerSubtitle}>Powered by advanced AI</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>👋</Text>
              <Text style={styles.emptyStateTitle}>Hi! I'm your AI Coach</Text>
              <Text style={styles.emptyStateText}>
                Ask me anything about fitness, nutrition, or training advice.
                I'm here to help you reach your goals!
              </Text>

              <Text style={styles.quickPromptsTitle}>Quick Start:</Text>
              {quickPrompts.map((prompt, index) => (
                <Pressable
                  key={index}
                  style={styles.quickPromptButton}
                  onPress={() => {
                    setInputText(prompt.substring(2).trim());
                  }}
                >
                  <Text style={styles.quickPromptText}>{prompt}</Text>
                </Pressable>
              ))}
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
        <View style={styles.inputContainer}>
          <TextInput
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
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
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
  quickPromptsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  quickPromptButton: {
    backgroundColor: '#222',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 8,
    width: '100%',
  },
  quickPromptText: {
    color: '#FF3C38',
    fontSize: 14,
    fontWeight: '500',
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
