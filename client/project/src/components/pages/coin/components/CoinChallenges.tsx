import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/common/ui/Tabs';
import { Trophy, Users, DollarSign, Clock, Target, Zap, Send, X, Plus, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useCoinStore } from '@/store/coinStore';
import { Challenge } from '@/data';

interface CoinChallengesProps {
  coinId: string;
}

// Removed local Challenge interface and mockChallenges - now using centralized data from @/data

export const CoinChallenges: React.FC<CoinChallengesProps> = ({ coinId }) => {
  const [activeTab, setActiveTab] = useState('proposals');
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  
  // Form state for creating challenges
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetPrize: '',
    deadline: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Store integration
  const { coinsCache, loading, error, fetchChallenges, createChallenge } = useCoinStore();
  const challenges = coinsCache[coinId]?.challenges || [];
  const isLoading = loading[coinId];
  const hasError = error[coinId];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'proposal':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const filterChallenges = (status: string) => {
    switch (status) {
      case 'proposals':
        return challenges.filter(c => c.status === 'proposal');
      case 'active':
        return challenges.filter(c => c.status === 'active');
      case 'completed':
        return challenges.filter(c => c.status === 'completed');
      default:
        return challenges;
    }
  };

  const getDaysRemaining = (deadline: string) => {
    const today = new Date();
    const end = new Date(deadline);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Form handling functions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.targetPrize || !formData.deadline) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createChallenge(coinId, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        creator: 'You', // In a real app, this would come from user context
        targetPrize: parseFloat(formData.targetPrize),
        deadline: formData.deadline
      });
      
      // Reset form and show success
      setFormData({ title: '', description: '', targetPrize: '', deadline: '' });
      setShowCreateChallenge(false);
      setShowSuccess(true);
      
      // Auto-hide success message
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to create challenge:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({ title: '', description: '', targetPrize: '', deadline: '' });
    setShowCreateChallenge(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Community Challenges</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreateChallenge(!showCreateChallenge)}
          className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          <span>Create Challenge</span>
        </motion.button>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-4"
        >
          <div className="text-green-400 font-medium">Challenge created successfully!</div>
          <div className="text-green-300 text-sm">Your challenge has been posted and is now visible to the community.</div>
        </motion.div>
      )}

      {/* Create Challenge Form */}
      {showCreateChallenge && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Create New Challenge</h3>
          <form onSubmit={handleSubmitChallenge} className="space-y-4">
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Challenge title"
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe the challenge requirements and goals..."
              rows={4}
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Target Prize Pool (DEFM)
                </label>
                <input
                  type="number"
                  name="targetPrize"
                  value={formData.targetPrize}
                  onChange={handleInputChange}
                  placeholder="5000"
                  min="1"
                  step="0.01"
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Deadline
                </label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
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
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create Challenge</span>
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
          <div className="text-slate-400 text-lg mb-2">Loading challenges...</div>
          <div className="text-slate-500 text-sm">Fetching community challenges</div>
        </div>
      )}

      {/* Error State */}
      {hasError && !isLoading && (
        <div className="text-center py-12">
          <div className="text-red-400 text-lg mb-2">Failed to load challenges</div>
          <div className="text-slate-500 text-sm mb-4">{hasError}</div>
          <button
            onClick={() => fetchChallenges(coinId)}
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200"
          >
            Try Again
          </button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="proposals">Proposals</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="proposals" className="mt-6">
          <div className="space-y-4">
            {filterChallenges('proposals').length === 0 ? (
              <div className="text-center py-12">
                <div className="text-slate-400 text-lg mb-2">No challenge proposals found</div>
                <div className="text-slate-500 text-sm">Be the first to create a challenge for this community!</div>
              </div>
            ) : (
              filterChallenges('proposals').map((challenge, index) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{challenge.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(challenge.status)}`}>
                        Proposal
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm mb-3">{challenge.description}</p>
                    <div className="text-sm text-slate-400">
                      Created by <span className="text-white">{challenge.creator}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-orange-400" />
                    <div>
                      <div className="text-white font-medium">{challenge.targetPrize} DEFM</div>
                      <div className="text-xs text-slate-400">Target Prize</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-4 w-4 text-green-400" />
                    <div>
                      <div className="text-white font-medium">{challenge.currentPrize} DEFM</div>
                      <div className="text-xs text-slate-400">Current Prize</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-blue-400" />
                    <div>
                      <div className="text-white font-medium">{challenge.participants}</div>
                      <div className="text-xs text-slate-400">Backers</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-purple-400" />
                    <div>
                      <div className="text-white font-medium">{getDaysRemaining(challenge.deadline)}d</div>
                      <div className="text-xs text-slate-400">Until Deadline</div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(challenge.currentPrize / challenge.targetPrize) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {Math.round((challenge.currentPrize / challenge.targetPrize) * 100)}% funded
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200"
                >
                  Back Challenge
                </motion.button>
              </motion.div>
            ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          <div className="space-y-4">
            {filterChallenges('active').length === 0 ? (
              <div className="text-center py-12">
                <div className="text-slate-400 text-lg mb-2">No active challenges found</div>
                <div className="text-slate-500 text-sm">Check back later for active challenges!</div>
              </div>
            ) : (
              filterChallenges('active').map((challenge, index) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{challenge.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(challenge.status)}`}>
                        Active
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm mb-3">{challenge.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-4 w-4 text-green-400" />
                    <div>
                      <div className="text-white font-medium">{challenge.currentPrize} DEFM</div>
                      <div className="text-xs text-slate-400">Prize Pool</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-blue-400" />
                    <div>
                      <div className="text-white font-medium">{challenge.participants}</div>
                      <div className="text-xs text-slate-400">Participants</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-orange-400" />
                    <div>
                      <div className="text-white font-medium">{challenge.submissions || 0}</div>
                      <div className="text-xs text-slate-400">Submissions</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-purple-400" />
                    <div>
                      <div className="text-white font-medium">{getDaysRemaining(challenge.deadline)}d</div>
                      <div className="text-xs text-slate-400">Remaining</div>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
                >
                  Submit Entry
                </motion.button>
              </motion.div>
            ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <div className="space-y-4">
            {filterChallenges('completed').length === 0 ? (
              <div className="text-center py-12">
                <div className="text-slate-400 text-lg mb-2">No completed challenges found</div>
                <div className="text-slate-500 text-sm">Completed challenges will appear here once they finish.</div>
              </div>
            ) : (
              filterChallenges('completed').map((challenge, index) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{challenge.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(challenge.status)}`}>
                        Completed
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm mb-3">{challenge.description}</p>
                    {challenge.winner && (
                      <div className="text-sm">
                        <span className="text-slate-400">Winner: </span>
                        <span className="text-yellow-400 font-medium">{challenge.winner}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-4 w-4 text-green-400" />
                    <div>
                      <div className="text-white font-medium">{challenge.currentPrize} DEFM</div>
                      <div className="text-xs text-slate-400">Prize Pool</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-blue-400" />
                    <div>
                      <div className="text-white font-medium">{challenge.participants}</div>
                      <div className="text-xs text-slate-400">Participants</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-orange-400" />
                    <div>
                      <div className="text-white font-medium">{challenge.submissions || 0}</div>
                      <div className="text-xs text-slate-400">Submissions</div>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-slate-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-600 transition-colors"
                >
                  View Results
                </motion.button>
              </motion.div>
            ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};