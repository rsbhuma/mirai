import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, Paperclip, Crown, Loader2 } from 'lucide-react';
import { useCoinStore } from '@/store/coinStore';
import { ws } from '@/ws';
import { ChatMessage } from '@/data';

interface CoinChatProps {
  coinId: string;
}

// Removed local ChatMessage interface and mockMessages - now using centralized data from @/data

export const CoinChat: React.FC<CoinChatProps> = ({ coinId }) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Store integration
  const { coinsCache, loading, error, fetchChatMessages, sendChatMessage } = useCoinStore();
  const messages = coinsCache[coinId]?.chatMessages || [];
  const isLoading = loading[coinId];
  const hasError = error[coinId];

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // WebSocket connection for real-time chat
  useEffect(() => {
    if (!coinId) return;

    // Connect to WebSocket for this coin's chat
    const handleMessage = (data: any) => {
      if (data.type === 'chat_message' && data.coinId === coinId) {
        // The store will handle adding the message
        console.log('Received chat message:', data.message);
      }
    };

    // Subscribe to chat messages for this coin
    ws.subscribe(`chat:${coinId}`, handleMessage);

    return () => {
      ws.unsubscribe(`chat:${coinId}`, handleMessage);
    };
  }, [coinId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const author = {
      name: 'You',
      avatar: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      isStacker: true
    };

    await sendChatMessage(coinId, message, author);
    setMessage('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Community Chat</h2>
        <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm font-medium">
          Stackers Only
        </span>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
          <div className="text-slate-400 text-lg mb-2">Loading chat...</div>
          <div className="text-slate-500 text-sm">Connecting to community chat</div>
        </div>
      )}

      {/* Error State */}
      {hasError && !isLoading && (
        <div className="text-center py-12">
          <div className="text-red-400 text-lg mb-2">Failed to load chat</div>
          <div className="text-slate-500 text-sm mb-4">{hasError}</div>
          <button
            onClick={() => fetchChatMessages(coinId)}
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Chat Container */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
        {/* Messages */}
        <div className="h-96 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="flex items-start space-x-3"
            >
              <img
                src={msg.author.avatar}
                alt={msg.author.name}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-white text-sm">{msg.author.name}</span>
                  {msg.author.isStacker && (
                    <span className="bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded text-xs font-medium">
                      Stacker
                    </span>
                  )}
                  <span className="text-slate-500 text-xs">{msg.timestamp}</span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{msg.content}</p>
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t border-slate-700/30 p-4">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-2 pr-12 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                <button
                  type="button"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <Smile className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-2 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200"
            >
              <Send className="h-4 w-4" />
            </motion.button>
          </form>
        </div>
      </div>

      {/* Chat Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
          <h3 className="text-white font-medium mb-2">Voice Chat</h3>
          <p className="text-slate-400 text-sm mb-3">Join the community voice channel</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 bg-slate-700 text-white px-3 py-2 rounded-lg hover:bg-slate-600 transition-colors"
          >
            <Crown className="h-4 w-4" />
            <span className="text-sm">Join Voice</span>
          </motion.button>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
          <h3 className="text-white font-medium mb-2">Screen Share</h3>
          <p className="text-slate-400 text-sm mb-3">Share your screen with the community</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 bg-slate-700 text-white px-3 py-2 rounded-lg hover:bg-slate-600 transition-colors"
          >
            <Paperclip className="h-4 w-4" />
            <span className="text-sm">Share Screen</span>
          </motion.button>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
          <h3 className="text-white font-medium mb-2">Online Members</h3>
          <p className="text-slate-400 text-sm mb-3">23 stackers online</p>
          <div className="flex -space-x-2">
            {messages.slice(0, 5).map((msg) => (
              <img
                key={msg.id}
                src={msg.author.avatar}
                alt={msg.author.name}
                className="w-6 h-6 rounded-full border-2 border-slate-800"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};