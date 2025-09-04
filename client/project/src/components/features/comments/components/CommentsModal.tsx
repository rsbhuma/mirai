import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Send, Heart, Reply } from 'lucide-react';

interface Comment {
  id: string;
  author: {
    name: string;
    avatar: string;
    wallet: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  replies?: Comment[];
}

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  postTitle: string;
  commentsCount: number;
}

const mockComments: Comment[] = [
  {
    id: '1',
    author: {
      name: 'Sarah Martinez',
      avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      wallet: '8pQ3...2mL5'
    },
    content: 'This looks amazing! The automated yield farming feature could be a game changer for DeFi.',
    timestamp: '2 hours ago',
    likes: 12,
    replies: [
      {
        id: '1-1',
        author: {
          name: 'Marcus Thompson',
          avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
          wallet: '9nH6...4sK8'
        },
        content: 'Agreed! The cross-chain compatibility is what really sets this apart.',
        timestamp: '1 hour ago',
        likes: 5
      }
    ]
  },
  {
    id: '2',
    author: {
      name: 'Emma Wilson',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      wallet: '6kL9...7fR3'
    },
    content: 'When do you expect to launch the mainnet version? I\'d love to be an early adopter.',
    timestamp: '3 hours ago',
    likes: 8
  },
  {
    id: '3',
    author: {
      name: 'David Park',
      avatar: 'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      wallet: '3mN8...1qW4'
    },
    content: 'The tokenomics look solid. Have you considered implementing a governance token as well?',
    timestamp: '4 hours ago',
    likes: 15
  }
];

export const CommentsModal: React.FC<CommentsModalProps> = ({
  isOpen,
  onClose,
  postId,
  postTitle,
  commentsCount
}) => {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    // In a real app, this would submit to your backend
    console.log('New comment:', newComment);
    setNewComment('');
  };

  const handleSubmitReply = (e: React.FormEvent, commentId: string) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    
    // In a real app, this would submit to your backend
    console.log('Reply to comment', commentId, ':', replyContent);
    setReplyContent('');
    setReplyingTo(null);
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-8 mt-3' : 'mb-6'}`}>
      <div className="flex items-start space-x-3">
        <img
          src={comment.author.avatar}
          alt={comment.author.name}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
        />
        <div className="flex-1">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <span className="font-medium text-white text-sm">{comment.author.name}</span>
              <span className="text-slate-500 text-xs">{comment.author.wallet}</span>
              <span className="text-slate-500 text-xs">•</span>
              <span className="text-slate-500 text-xs">{comment.timestamp}</span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{comment.content}</p>
          </div>
          
          <div className="flex items-center space-x-4 mt-2">
            <button className="flex items-center space-x-1 text-slate-400 hover:text-red-400 transition-colors">
              <Heart className="h-3 w-3" />
              <span className="text-xs">{comment.likes}</span>
            </button>
            {!isReply && (
              <button
                onClick={() => setReplyingTo(comment.id)}
                className="flex items-center space-x-1 text-slate-400 hover:text-white transition-colors"
              >
                <Reply className="h-3 w-3" />
                <span className="text-xs">Reply</span>
              </button>
            )}
          </div>

          {/* Reply Form */}
          {replyingTo === comment.id && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={(e) => handleSubmitReply(e, comment.id)}
              className="mt-3"
            >
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="flex-1 bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-2 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200"
                >
                  <Send className="h-3 w-3" />
                </motion.button>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="text-slate-400 hover:text-white text-xs transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.form>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.map(reply => renderComment(reply, true))}
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
            <div className="flex items-center space-x-3">
              <MessageCircle className="h-5 w-5 text-orange-400" />
              <div>
                <h2 className="text-lg font-bold text-white">Comments</h2>
                <p className="text-slate-400 text-sm truncate max-w-md">{postTitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-6">
            {mockComments.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No comments yet</p>
                <p className="text-slate-500 text-sm">Be the first to share your thoughts!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {mockComments.map(comment => renderComment(comment))}
              </div>
            )}
          </div>

          {/* Comment Input */}
          <div className="border-t border-slate-700/50 p-6">
            <form onSubmit={handleSubmitComment} className="flex items-center space-x-3">
              <img
                src="https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2"
                alt="Your avatar"
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-2 pr-12 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={!newComment.trim()}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-orange-500 to-red-500 text-white p-1.5 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-3 w-3" />
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};