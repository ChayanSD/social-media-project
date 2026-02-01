"use client";

import { useEffect, useRef, useCallback } from 'react';
import { store } from '@/store/store';
import { chatApi, type ChatMessage, type ChatUser } from '@/store/chatApi';
import { getStoredAccessToken } from '@/lib/auth';
import { getApiBaseUrl } from '@/lib/utils';

type WebSocketMessage = {
  type: string;
  room?: number | string;
  message?: {
    id: number | string;
    room?: number | string;
    sender?: {
      id: number | string;
      username?: string;
      display_name?: string;
      avatar?: string;
      is_online?: boolean;
    };
    content?: string;
    created_at?: string;
    is_read?: boolean;
  };
  [key: string]: unknown;
};

type UseChatWebSocketOptions = {
  enabled?: boolean;
  roomId?: number | string;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Event) => void;
};

export const useChatWebSocket = (options: UseChatWebSocketOptions = {}) => {
  const { enabled = true, roomId, onMessage, onError } = options;
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds

  // Update refs when callbacks change (without triggering reconnection)
  useEffect(() => {
    onMessageRef.current = onMessage;
    onErrorRef.current = onError;
  }, [onMessage, onError]);

  // Store roomId in ref to avoid recreating connect function
  const roomIdRef = useRef(roomId);
  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  const connect = useCallback(() => {
    if (!enabled || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      // Use ref to get current roomId without adding it to dependencies
      const currentRoomId = roomIdRef.current;
      const apiUrl = getApiBaseUrl();
      const token = getStoredAccessToken();
      
      // Convert HTTP/HTTPS URL to WebSocket URL
      let wsUrl = apiUrl.replace(/^http/, 'ws').replace(/\/$/, '');
      
      // For direct messaging, always use the direct endpoint
      if (currentRoomId) {
        wsUrl += `/ws/chat/${currentRoomId}/`;
      } else {
        // Direct messaging endpoint
        wsUrl += '/ws/chat/direct/';
      }
      
      // Add token as query parameter if available
      if (token) {
        const separator = wsUrl.includes('?') ? '&' : '?';
        wsUrl += `${separator}token=${encodeURIComponent(token)}`;
      }
      
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        reconnectAttemptsRef.current = 0;
        // User is now online - backend handles this via WebSocket connection
      };

      ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          
          // Handle different message types - backend sends 'data' field for room messages
          const message = (data.message || data.data || data) as {
            id?: number | string;
            room_id?: number | string;
            room?: number | string;
            content?: string;
            created_at?: string;
            is_read?: boolean;
            sender?: ChatUser;
            [key: string]: unknown;
          };
          const messageType = data.type;
          
          // For room messages, check room_id in the message object
          const roomId = message.room_id || message.room || data.room;

          if (messageType === 'message' && roomId && message.id) {
            console.log('WebSocket room message received:', { roomId, messageId: message.id, content: message.content });
            
            // Update the messages cache for the specific room
            store.dispatch(
              chatApi.util.updateQueryData('getRoomMessages', roomId, (draft) => {
                const messagesData = 
                  draft.data ?? 
                  draft.results?.data ?? 
                  draft.messages ?? 
                  [];

                // Check if message already exists
                const messageExists = messagesData.some(
                  (msg: { id: number | string }) => String(msg.id) === String(message.id)
                );

                if (!messageExists) {
                  // Ensure message has required fields
                  const messageWithText = message as { content?: string; text?: string; [key: string]: unknown };
                  const messageContent = message.content || messageWithText.text || '';
                  const messageCreatedAt = message.created_at || new Date().toISOString();
                  const messageSender = message.sender || (message as { user?: ChatUser }).user;
                  
                  const formattedMessage: ChatMessage = {
                    ...message,
                    id: message.id as number | string,
                    room: roomId,
                    room_id: roomId,
                    sender: messageSender as ChatUser | undefined,
                    sender_id: (message as { sender_id?: number | string }).sender_id || (messageSender as ChatUser)?.id,
                    sender_username: (message as { sender_username?: string }).sender_username || (messageSender as ChatUser)?.username,
                    content: typeof messageContent === 'string' ? messageContent : '',
                    created_at: typeof messageCreatedAt === 'string' ? messageCreatedAt : new Date().toISOString(),
                    is_read: message.is_read !== false,
                  };
                  messagesData.push(formattedMessage);
                  console.log('Added message to cache:', formattedMessage);
                } else {
                  console.log('Message already exists in cache');
                }
              })
            );

            // Invalidate chat rooms to update last message and unread count
            store.dispatch(chatApi.util.invalidateTags(['ChatRooms']));
          }

          // Handle online status updates
          if (data.type === 'online_status') {
            const statusData = data as { user_id?: number | string; is_online?: boolean; [key: string]: unknown };
            // Invalidate chat users and conversations to refresh online status
            store.dispatch(chatApi.util.invalidateTags(['ChatUsers']));
            store.dispatch(chatApi.util.invalidateTags(['Conversations']));
          }

          // Handle message request events
          if (data.type === 'message_request') {
            const requestData = (data as { request?: unknown }).request;
            console.log('WebSocket message request received:', requestData);
            // Invalidate message requests to show the new request
            store.dispatch(chatApi.util.invalidateTags(['MessageRequests']));
          }

          if (data.type === 'message_request_accepted') {
            const requestData = (data as { request?: { message_id?: number | string; receiver_id?: number | string } }).request;
            console.log('WebSocket message request accepted:', requestData);
            // Invalidate message requests to remove the accepted one
            store.dispatch(chatApi.util.invalidateTags(['MessageRequests']));
            // Invalidate conversations to show the new conversation
            store.dispatch(chatApi.util.invalidateTags(['Conversations']));
            // Invalidate messages if we have a receiver_id
            if (requestData?.receiver_id) {
              store.dispatch(chatApi.util.invalidateTags([{ type: 'Messages', id: requestData.receiver_id }]));
            }
          }

          if (data.type === 'message_request_rejected') {
            const requestData = (data as { request?: unknown }).request;
            console.log('WebSocket message request rejected:', requestData);
            // Invalidate message requests to remove the rejected one
            store.dispatch(chatApi.util.invalidateTags(['MessageRequests']));
          }

          if (data.type === 'message_request_cancelled') {
            const requestData = (data as { request?: unknown }).request;
            console.log('WebSocket message request cancelled:', requestData);
            // Invalidate message requests and conversations to refresh the list
            store.dispatch(chatApi.util.invalidateTags(['MessageRequests']));
            store.dispatch(chatApi.util.invalidateTags(['Conversations']));
          }

          // Call custom onMessage handler if provided
          if (onMessageRef.current) {
            onMessageRef.current(data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (onErrorRef.current) {
          onErrorRef.current(error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        wsRef.current = null;

        // Attempt to reconnect if enabled and not exceeded max attempts
        if (enabled && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Reconnecting... Attempt ${reconnectAttemptsRef.current}`);
            connect();
          }, reconnectDelay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.error('Max reconnection attempts reached');
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  }, [enabled]); // Only depend on enabled, use ref for roomId

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    reconnectAttemptsRef.current = 0;
  }, []);

  const sendMessage = useCallback((message: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  // Reconnect when enabled or roomId changes
  useEffect(() => {
    // Disconnect existing connection if roomId changed
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      disconnect();
    }
    
    if (enabled) {
      // Small delay to ensure cleanup completes
      const timeoutId = setTimeout(() => {
        connect();
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        disconnect();
      };
    } else {
      disconnect();
      return () => {
        disconnect();
      };
    }
    // Only reconnect when enabled or roomId actually changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, roomId]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    sendMessage,
    connect,
    disconnect,
  };
};

