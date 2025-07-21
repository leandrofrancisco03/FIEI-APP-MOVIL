import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  Pressable,
  KeyboardAvoidingView,
  TextInput,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Send, MessageCircle, Bot, User } from 'lucide-react-native';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  status: 'sending' | 'sent' | 'error';
}

export default function ChatScreen() {
  const { user } = useAuth();
  const { sendChatMessage, isLoading: isSupabaseLoading } = useSupabaseData();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // Load welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: '1',
      content: user?.rol === 'profesor' 
        ? '¡Hola profesor! Soy tu asistente virtual. Puedo ayudarte con información sobre tus cursos, estudiantes y más. ¿En qué puedo asistirte hoy?'
        : '¡Hola estudiante! Soy tu asistente virtual. Puedo ayudarte con información sobre tus cursos, notas, asistencias y más. ¿En qué puedo ayudarte hoy?',
      isUser: false,
      timestamp: new Date(),
      status: 'sent'
    };
    setMessages([welcomeMessage]);
  }, [user?.rol]);

  const testConnection = async () => {
    const testMessage: Message = {
      id: 'test-' + Date.now().toString(),
      content: '🔍 Probando conexión con el servidor...',
      isUser: false,
      timestamp: new Date(),
      status: 'sending'
    };
    
    setMessages(prev => [...prev, testMessage]);
    
    try {
      const result = await sendChatMessage(
        'test connection',
        user?.rol || '',
        user?.id || '',
        user?.email || ''
      );
      
      const resultMessage: Message = {
        id: 'test-result-' + Date.now().toString(),
        content: result.success 
          ? '✅ Conexión exitosa con el servidor n8n'
          : `❌ Error de conexión: ${result.error}`,
        isUser: false,
        timestamp: new Date(),
        status: 'sent'
      };
      
      setMessages(prev => [...prev, resultMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: 'test-error-' + Date.now().toString(),
        content: '❌ Error al probar la conexión: ' + (error as any)?.message,
        isUser: false,
        timestamp: new Date(),
        status: 'sent'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
      status: 'sending'
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    const messageText = inputText.trim();
    setInputText('');
    setIsLoading(true);

    try {
      // Update user message status to sent
      setMessages(prev => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: 'sent' as const }
            : msg
        )
      );

      // Send message using the hook
      console.log('📱 Enviando mensaje desde chat:', {
        messageText,
        userRole: user?.rol,
        userId: user?.id,
        userEmail: user?.email
      });
      
      const result = await sendChatMessage(
        messageText,
        user?.rol || '',
        user?.id || '',
        user?.email || ''
      );

      console.log('📱 Resultado del envío:', result);

      if (result.success) {
        // Add bot response
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: result.response || 'Respuesta recibida del asistente.',
          isUser: false,
          timestamp: new Date(),
          status: 'sent'
        };

        console.log('📱 Agregando respuesta del bot:', botMessage.content);
        setMessages(prev => [...prev, botMessage]);
      } else {
        console.error('❌ Error en la respuesta:', result.error);
        throw new Error(result.error || 'Error desconocido');
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Update user message status to error
      setMessages(prev => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: 'error' as const }
            : msg
        )
      );

      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: (error as any)?.message?.includes('tiempo') 
          ? '⏰ El servidor está tardando más de lo normal. Esto puede ocurrir cuando el flujo de n8n está muy ocupado. Inténtalo de nuevo en unos momentos.'
          : 'Lo siento, hubo un error al enviar tu mensaje. Por favor, verifica que el flujo de n8n esté funcionando correctamente e inténtalo de nuevo.',
        isUser: false,
        timestamp: new Date(),
        status: 'sent'
      };

      setMessages(prev => [...prev, errorMessage]);

      if (Platform.OS === 'web') {
        window.alert('Error al enviar el mensaje. Inténtalo de nuevo.');
      } else {
        Alert.alert('Error', 'Error al enviar el mensaje. Inténtalo de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'sending':
        return '⏳';
      case 'sent':
        return '✓';
      case 'error':
        return '❌';
      default:
        return ''; // No retornar undefined
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <MessageCircle size={24} color="#D2691E" />
        <Text style={styles.headerTitle}>Chat Asistente</Text>
        <Pressable
          style={styles.testButton}
          onPress={testConnection}
          disabled={isLoading}
        >
          <Text style={styles.testButtonText}>🔍 Test</Text>
        </Pressable>
        <View style={styles.roleIndicator}>
          <Text style={styles.roleText}>
            {user?.rol === 'profesor' ? '👨‍🏫 Profesor' : '🎓 Estudiante'}
          </Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageContainer,
              message.isUser ? styles.userMessage : styles.botMessage,
            ]}
          >
            <View style={styles.messageHeader}>
              {message.isUser ? (
                <User size={16} color="#FFFFFF" />
              ) : (
                <Bot size={16} color="#D2691E" />
              )}
              <Text style={[
                styles.messageSender,
                { color: message.isUser ? '#FFFFFF' : '#D2691E' }
              ]}>
                {message.isUser ? 'Tú' : 'Asistente'}
              </Text>
              <Text style={[
                styles.messageTime,
                { color: message.isUser ? '#FFFFFF' : '#666666' }
              ]}>
                {formatTime(message.timestamp)}
              </Text>
            </View>
            <Text style={[
              styles.messageText,
              { color: message.isUser ? '#FFFFFF' : '#333333' }
            ]}>
              {message.content}
            </Text>
            {message.isUser && message.status && (
              <View style={styles.messageStatus}>
                {getMessageStatusIcon(message.status) && (
                  <Text style={styles.statusIcon}>
                    {getMessageStatusIcon(message.status)}
                  </Text>
                )}
              </View>
            )}
          </View>
        ))}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <LoadingSpinner />
            <Text style={styles.loadingText}>El asistente está escribiendo...</Text>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            placeholder="Escribe tu mensaje..."
            value={inputText}
            onChangeText={setInputText}
            style={styles.textInput}
            multiline
            maxLength={500}
          />
          <Pressable
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <Send 
              size={20} 
              color={(!inputText.trim() || isLoading) ? '#CCCCCC' : '#FFFFFF'} 
            />
          </Pressable>
        </View>
        <Text style={styles.inputCounter}>
          {inputText.length}/500
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#DEB887',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginLeft: 12,
    flex: 1,
  },
  roleIndicator: {
    backgroundColor: '#DEB887',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B4513',
  },
  testButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  testButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#D2691E',
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DEB887',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageSender: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    flex: 1,
  },
  messageTime: {
    fontSize: 10,
    opacity: 0.7,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageStatus: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  statusIcon: {
    fontSize: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#DEB887',
    padding: Platform.OS === 'web' ? 20 : 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : Platform.OS === 'web' ? 20 : 16,
    width: '100%',
    maxWidth: undefined,
    alignSelf: 'stretch',
    flexShrink: 0,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '100%',
    flex: 1,
    gap: 20,
  },
  textInput: {
    flex: 1,
    width: '100%',
    maxHeight: Platform.OS === 'web' ? 300 : 200,
    minHeight: Platform.OS === 'web' ? 140 : 120,
    fontSize: Platform.OS === 'web' ? 25 : 15,
    paddingVertical: Platform.OS === 'web' ? 28 : 24,
    paddingHorizontal: Platform.OS === 'web' ? 36 : 28,
    backgroundColor: '#FFFFFF',
    borderRadius: Platform.OS === 'web' ? 16 : 12,
    borderWidth: 3,
    borderColor: '#D2691E',
    color: '#333333',
    lineHeight: Platform.OS === 'web' ? 40 : 36,
    textAlignVertical: 'top',
    alignSelf: 'stretch',
  },
  sendButton: {
    backgroundColor: '#D2691E',
    width: Platform.OS === 'web' ? 70 : 50,
    height: Platform.OS === 'web' ? 70 : 50,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 35,
    marginLeft: 8,  
    marginRight: 24,
  },
  sendButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  inputCounter: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'right',
    marginTop: 4,
  },
});
