import React, { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Share2, Flame, Github, Link as LinkIcon, Video, Image, TrendingUp, Users, DollarSign, Heart, Send, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { IgniteCoinModal } from '@/components/features/ignite-coin/components/IgniteCoinModal';
import { useState } from 'react';
import { useCommentsStore } from '@/store/commentsStore';
import { usePostsStore } from '@/store/postsStore';
import { ws } from '@/ws';
import { FeedItem } from '@/data';

interface MainFeedProps {
  searchQuery?: string;
  isSearching?: boolean;
}

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
  isLiked?: boolean;
}

export const MainFeed: React.FC<MainFeedProps> = ({ searchQuery = '', isSearching = false }) => {
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [showIgniteModal, setShowIgniteModal] = useState(false);
  const [expandedComments, setExpandedComments] = useState<{ [postId: string]: boolean }>({});
  const [newComments, setNewComments] = useState<{ [postId: string]: string }>({});
  const [postLikes, setPostLikes] = useState<{ [postId: string]: { count: number; isLiked: boolean } }>({});
  const { commentsByPost, addComment } = useCommentsStore();
  
  // Store integration
  const { posts, loading, error, fetchPosts } = usePostsStore();

  // Fetch posts on component mount
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Helper to publish comment to server (API or WebSocket)
  const publishCommentToServer = async (post: FeedItem, comment: Comment) => {
    // Since there's no specific comments endpoint in the API documentation,
    // we'll use WebSocket for now as the primary method
    try {
      ws.send(`comments:${post.id}`, { post, comment });
      console.log('Comment sent via WebSocket');
    } catch (e) {
      console.warn('Failed to send comment via WebSocket:', e);
    }
  };

  const filteredData = useMemo(() => {
    if (!isSearching || !searchQuery.trim()) {
      return posts;
    }

    const query = searchQuery.toLowerCase();
    return posts.filter(item =>
      item.content.title.toLowerCase().includes(query) ||
      item.content.description.toLowerCase().includes(query) ||
      item.creator.name.toLowerCase().includes(query) ||
      item.vision.toLowerCase().includes(query) ||
      (item.coinData?.symbol.toLowerCase().includes(query))
    );
  }, [searchQuery, isSearching, posts]);

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'link':
        return <LinkIcon className="h-4 w-4" />;
      default:
        return <Github className="h-4 w-4" />;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`;
    }
    return `$${num}`;
  };

  const handleIgniteCoin = (item: any) => {
    setSelectedPost({
      id: item.id,
      title: item.content.title,
      description: item.content.description,
      creator: item.creator.name,
    });
    setShowIgniteModal(true);
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleAddComment = (postId: string) => {
    const commentText = newComments[postId]?.trim();
    if (!commentText) return;

    // Build comment object
    const comment: Comment = {
      id: `${postId}-${Date.now()}`,
              author: {
          name: 'You',
          avatar: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
          wallet: 'your-wallet',
        },
      content: commentText,
      timestamp: new Date().toISOString(),
      likes: 0,
      isLiked: false,
    };
    addComment(postId, comment);
    // Find the post info for publishing
    const post = filteredData.find((p) => p.id === postId);
    if (post) publishCommentToServer(post, comment);
    setNewComments(prev => ({ ...prev, [postId]: '' }));
  };

  const handleLikePost = (postId: string, currentLikes: number, currentIsLiked: boolean) => {
    setPostLikes(prev => ({
      ...prev,
      [postId]: {
        count: currentIsLiked ? currentLikes - 1 : currentLikes + 1,
        isLiked: !currentIsLiked
      }
    }));
  };

  const getPostLikes = (postId: string, originalLikes: number, originalIsLiked: boolean) => {
    const postLike = postLikes[postId];
    return {
      count: postLike?.count ?? originalLikes,
      isLiked: postLike?.isLiked ?? originalIsLiked
    };
  };

  return (
    <>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
            <div className="text-slate-400 text-lg mb-2">Loading posts...</div>
            <div className="text-slate-500 text-sm">Fetching the latest content</div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12">
            <div className="text-red-400 text-lg mb-2">Failed to load posts</div>
            <div className="text-slate-500 text-sm mb-4">{error}</div>
            <button
              onClick={fetchPosts}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200"
            >
              Try Again
            </button>
          </div>
        )}

        {/* No Data State */}
        {!loading && !error && filteredData.length === 0 && (
          <div className="text-center py-12">
            <div className="text-slate-400 text-lg mb-2">No posts found</div>
            <div className="text-slate-500 text-sm">
              {isSearching ? 'Try adjusting your search terms or filters' : 'Be the first to create a post!'}
            </div>
          </div>
        )}

        {filteredData.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden hover:border-orange-500/30 transition-all duration-300"
          >
            {/* Header */}
            <div className="p-6 pb-4">
              <div className="flex items-center space-x-3 mb-4">
                <img
                  src={item.creator.avatar}
                  alt={item.creator.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-white font-medium">{item.creator.name}</h3>
                    <span className="text-slate-400 text-sm">{item.creator.wallet}</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    {getContentIcon(item.content.type)}
                    <span className="text-slate-500 text-sm capitalize">{item.content.type}</span>
                    <span className="text-slate-500 text-sm">•</span>
                    <span className="text-slate-500 text-sm">{item.timestamp}</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-3">
                <h4 className="text-xl font-semibold text-white">{item.content.title}</h4>
                <p className="text-slate-300 leading-relaxed">{item.content.description}</p>

                {item.content.media && (
                  <div className="rounded-lg overflow-hidden">
                    <img
                      src={item.content.media}
                      alt={item.content.title}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}

                {/* Vision */}
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                  <h5 className="text-sm font-medium text-slate-300 mb-2">Community Vision</h5>
                  <p className="text-slate-400 text-sm">{item.vision}</p>
                </div>

                {/* Social Links */}
                {Object.keys(item.socialLinks).length > 0 && (
                  <div className="flex items-center space-x-3">
                    <span className="text-slate-500 text-sm">Links:</span>
                    {item.socialLinks.twitter && (
                      <a
                        href={item.socialLinks.twitter}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <span className="text-sm">Twitter</span>
                      </a>
                    )}
                    {item.socialLinks.discord && (
                      <a
                        href={item.socialLinks.discord}
                        className="text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        <span className="text-sm">Discord</span>
                      </a>
                    )}
                    {item.socialLinks.github && (
                      <a
                        href={item.socialLinks.github}
                        className="text-slate-400 hover:text-slate-300 transition-colors"
                      >
                        <span className="text-sm">GitHub</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Coin Data Section (if coin exists) */}
            {item.coinData && (
              <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg p-4 border border-orange-500/20 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-orange-400 font-medium text-sm">Coin Ignited</span>
                    <span className="bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full text-xs font-medium">
                      {item.coinData.symbol}
                    </span>
                  </div>
                  <Link
                    to={`/coin/${item.id}`}
                    className="text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors"
                  >
                    View Community →
                  </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-400" />
                    <div>
                      <div className="text-white font-medium text-sm">${item.coinData.price.toFixed(2)}</div>
                      <div className={`text-xs ${item.coinData.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {item.coinData.change24h >= 0 ? '+' : ''}{item.coinData.change24h.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-blue-400" />
                    <div>
                      <div className="text-white font-medium text-sm">{formatNumber(item.coinData.marketCap)}</div>
                      <div className="text-xs text-slate-400">Market Cap</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-purple-400" />
                    <div>
                      <div className="text-white font-medium text-sm">{item.coinData.members}</div>
                      <div className="text-xs text-slate-400">Members</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Flame className="h-4 w-4 text-orange-400" />
                    <div>
                      <div className="text-orange-400 font-medium text-sm">Active</div>
                      <div className="text-xs text-slate-400">Status</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="px-6 py-4 bg-slate-900/30 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => {
                    const likes = getPostLikes(item.id, item.likes, item.isLiked || false);
                    handleLikePost(item.id, likes.count, likes.isLiked);
                  }}
                  className={`flex items-center space-x-2 transition-colors ${getPostLikes(item.id, item.likes, item.isLiked || false).isLiked
                    ? 'text-red-400 hover:text-red-300'
                    : 'text-slate-400 hover:text-white'
                    }`}
                >
                  <Heart className={`h-4 w-4 ${getPostLikes(item.id, item.likes, item.isLiked || false).isLiked ? 'fill-current' : ''
                    }`} />
                  <span className="text-sm">{getPostLikes(item.id, item.likes, item.isLiked || false).count}</span>
                </button>
                <button
                  onClick={() => toggleComments(item.id)}
                  className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-sm">{item.comments}</span>
                  {expandedComments[item.id] ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>
                <button className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors">
                  <Share2 className="h-4 w-4" />
                  <span className="text-sm">Share</span>
                </button>
              </div>

              {item.coinData ? (
                <Link to={`/coin/${item.id}`}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 rounded-lg text-white font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
                  >
                    <Users className="h-4 w-4" />
                    <span>Join Community</span>
                  </motion.button>
                </Link>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleIgniteCoin(item)}
                  className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 rounded-lg text-white font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200"
                >
                  <Flame className="h-4 w-4" />
                  <span>Ignite Coin</span>
                </motion.button>
              )}
            </div>

            {/* Comments Section */}
            {expandedComments[item.id] && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-slate-700/30"
              >
                {/* Comments List */}
                <div className="px-6 py-4 space-y-3">
                  {commentsByPost[item.id]?.map((comment: Comment) => (
                    <div key={comment.id} className="flex items-start space-x-3">
                      <img
                        src={comment.author.avatar}
                        alt={comment.author.name}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1">
                        <div className="bg-slate-800/50 rounded-lg p-3">
                                                      <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-white text-sm">{comment.author.name}</span>
                              <span className="text-slate-500 text-xs">{comment.author.wallet}</span>
                              <span className="text-slate-500 text-xs">•</span>
                              <span className="text-slate-500 text-xs">{comment.timestamp}</span>
                          </div>
                          <p className="text-slate-300 text-sm">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {(!commentsByPost[item.id] || commentsByPost[item.id].length === 0) && (
                    <div className="text-center py-4">
                      <p className="text-slate-400 text-sm">No comments yet</p>
                      <p className="text-slate-500 text-xs">Be the first to share your thoughts!</p>
                    </div>
                  )}
                </div>

                {/* Add Comment */}
                <div className="px-6 pb-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src="https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2"
                      alt="Your avatar"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newComments[item.id] || ''}
                        onChange={(e) => setNewComments(prev => ({
                          ...prev,
                          [item.id]: e.target.value
                        }))}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleAddComment(item.id);
                          }
                        }}
                        placeholder="Add a comment..."
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-full px-4 py-2 pr-10 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAddComment(item.id)}
                        disabled={!newComments[item.id]?.trim()}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-orange-400 hover:text-orange-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="h-4 w-4" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Ignite Coin Modal */}
      <IgniteCoinModal
        isOpen={showIgniteModal}
        onClose={() => setShowIgniteModal(false)}
        postData={selectedPost || { id: '', title: '', description: '', creator: '' }}
      />
    </>
  );
};