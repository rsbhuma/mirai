import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, ThumbsUp, Pin, Clock, Send, X, Upload, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useCoinStore } from '@/store/coinStore';
import { Discussion } from '@/data';

interface CoinDiscussionsProps {
  coinId: string;
}

// Removed local Discussion interface and mockDiscussions - now using centralized data from @/data

export const CoinDiscussions: React.FC<CoinDiscussionsProps> = ({ coinId }) => {
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    media: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Store integration
  const { coinsCache, loading, error, fetchDiscussions, createDiscussion } = useCoinStore();
  const discussions = coinsCache[coinId]?.discussions || [];
  const isLoading = loading[coinId];
  const hasError = error[coinId];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const author = {
        name: 'You',
        avatar: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
        isStacker: true
      };

      await createDiscussion(coinId, {
        title: formData.title.trim(),
        content: formData.content.trim(),
        author,
        media: formData.media.trim() || undefined
      });

      // Reset form and close modal
      setFormData({ title: '', content: '', media: '' });
      setShowCreatePost(false);
      
      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to create discussion:', error);
      // You could show an error message here
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({ title: '', content: '', media: '' });
    setShowCreatePost(false);
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-green-500/20 border border-green-500/30 rounded-lg p-4"
        >
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-green-400 font-medium">Discussion posted successfully!</span>
          </div>
        </motion.div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Community Discussions</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreatePost(!showCreatePost)}
          className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200"
        >
          Create Post
        </motion.button>
      </div>

      {/* Create Post Form */}
      {showCreatePost && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Create New Discussion</h3>
          <form onSubmit={handleSubmitDiscussion} className="space-y-4">
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Discussion title"
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
            <textarea
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="Share your thoughts with the community..."
              rows={4}
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              required
            />
            <input
              type="url"
              value={formData.media}
              onChange={(e) => handleInputChange('media', e.target.value)}
              placeholder="Media URL (optional)"
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <div className="flex items-center space-x-3">
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isSubmitting 
                    ? 'bg-slate-600 text-slate-300 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Posting...</span>
                  </>
                ) : (
                  <span>Post Discussion</span>
                )}
              </motion.button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
          <div className="text-slate-400 text-lg mb-2">Loading discussions...</div>
          <div className="text-slate-500 text-sm">Fetching community posts</div>
        </div>
      )}

      {/* Error State */}
      {hasError && !isLoading && (
        <div className="text-center py-12">
          <div className="text-red-400 text-lg mb-2">Failed to load discussions</div>
          <div className="text-slate-500 text-sm mb-4">{hasError}</div>
          <button
            onClick={() => fetchDiscussions(coinId)}
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Discussions List */}
      <div className="space-y-4">
        {discussions.map((discussion, index) => (
          <motion.div
            key={discussion.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden hover:border-orange-500/30 transition-all duration-300"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start space-x-3 mb-4">
                <img
                  src={discussion.author.avatar}
                  alt={discussion.author.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-white">{discussion.author.name}</h3>
                    {discussion.author.isStacker && (
                      <span className="bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full text-xs font-medium">
                        Stacker
                      </span>
                    )}
                    {discussion.isPinned && (
                      <Pin className="h-4 w-4 text-yellow-400" />
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-slate-400">
                    <Clock className="h-3 w-3" />
                    <span>{discussion.timestamp}</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-3">
                <h4 className="text-lg font-medium text-white">{discussion.title}</h4>
                <p className="text-slate-300 leading-relaxed">{discussion.content}</p>

                {discussion.media && (
                  <div className="rounded-lg overflow-hidden">
                    <img
                      src={discussion.media}
                      alt="Discussion media"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-6 mt-4 pt-4 border-t border-slate-700/30">
                <button className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors">
                  <ThumbsUp className="h-4 w-4" />
                  <span className="text-sm">{discussion.likes}</span>
                </button>
                <button className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors">
                  <Send className="h-4 w-4" />
                  <span className="text-sm">Reply</span>
                </button>
                <button className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors">
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-sm">Reply</span>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};