import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Link2, Github, Twitter, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import * as api from '@/api';
import type { ApiCreatePostRequest } from '@/api';
import { useAuthStore } from '@/store/authStore';

export const CreateContent = () => {
  const { isAuthenticated } = useAuthStore();
  const [contentType, setContentType] = useState('text');
  const [isLoading, setIsLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    vision: '',
    twitter: '',
    discord: '',
    github: '',
    mediaUrl: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      // Prepare the request data to match the backend API
      const requestData: ApiCreatePostRequest = {
        title: formData.title,
        description: formData.description,
        vision: formData.vision,
        content_type: contentType,
        media_url: formData.mediaUrl || undefined,
        twitter: formData.twitter || undefined,
        discord: formData.discord || undefined,
        github: formData.github || undefined,
      };

      // Remove empty optional fields
      Object.keys(requestData).forEach((key) => {
        const value = requestData[key as keyof ApiCreatePostRequest];
        if (!value || value === '') {
          delete requestData[key as keyof ApiCreatePostRequest];
        }
      });

      // Use the abstracted API function
      const result = await api.createPost(requestData);
      console.log('Post created successfully:', result);
      
      setSubmitStatus('success');
      
      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          title: '',
          description: '',
          vision: '',
          twitter: '',
          discord: '',
          github: '',
          mediaUrl: ''
        });
        setContentType('text');
        setSubmitStatus('idle');
      }, 2000);

    } catch (error) {
      console.error('Failed to create post:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create post. Please try again.');
      setSubmitStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!isAuthenticated) {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
            <h1 className="text-4xl font-bold text-white mb-2">Create Content</h1>
            <p className="text-slate-400">Please connect your wallet to create content.</p>
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Create Content</h1>
        <p className="text-slate-400">Share your ideas and vision with the community</p>
      </div>

      {/* Status Messages */}
      {submitStatus === 'success' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-green-900/30 border border-green-500/50 rounded-lg p-4 flex items-center space-x-3"
        >
          <CheckCircle className="h-5 w-5 text-green-400" />
          <span className="text-green-300">Post created successfully!</span>
        </motion.div>
      )}

      {submitStatus === 'error' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-red-900/30 border border-red-500/50 rounded-lg p-4 flex items-center space-x-3"
        >
          <XCircle className="h-5 w-5 text-red-400" />
          <span className="text-red-300">{errorMessage}</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Content Type Selection */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Content Type</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { id: 'text', label: 'Text Post', icon: MessageSquare },
              { id: 'image', label: 'Image', icon: Upload },
              { id: 'video', label: 'Video', icon: Upload },
              { id: 'link', label: 'Link/GitHub', icon: Link2 }
            ].map((type) => {
              const Icon = type.icon;
              return (
                <motion.button
                  key={type.id}
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setContentType(type.id)}
                  disabled={isLoading}
                  className={`p-4 rounded-lg border transition-all duration-200 ${
                    contentType === type.id
                      ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/50 text-white'
                      : 'bg-slate-900/50 border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Icon className="h-6 w-6 mx-auto mb-2" />
                  <span className="text-sm font-medium">{type.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Content Details */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Content Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                disabled={isLoading}
                placeholder="Enter a compelling title for your content"
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                disabled={isLoading}
                rows={4}
                placeholder="Describe your content in detail..."
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Media URL for non-text content */}
            {contentType !== 'text' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {contentType === 'link' ? 'URL/GitHub Link' : 'Media URL'} *
                </label>
                <input
                  type="url"
                  name="mediaUrl"
                  value={formData.mediaUrl}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                  placeholder={
                    contentType === 'link' 
                      ? 'https://github.com/your-username/your-repo' 
                      : 'https://example.com/your-media-file'
                  }
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            )}
          </div>
        </div>

        {/* Vision */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Community Vision</h2>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Describe your vision for this potential community *
            </label>
            <textarea
              name="vision"
              value={formData.vision}
              onChange={handleInputChange}
              required
              disabled={isLoading}
              rows={4}
              placeholder="What kind of community do you envision? What problems will it solve? What value will it provide?"
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Social Links (Optional)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <div className="flex items-center space-x-2">
                  <Twitter className="h-4 w-4 text-blue-400" />
                  <span>Twitter</span>
                </div>
              </label>
              <input
                type="url"
                name="twitter"
                value={formData.twitter}
                onChange={handleInputChange}
                disabled={isLoading}
                placeholder="https://twitter.com/your-handle"
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-indigo-400" />
                  <span>Discord</span>
                </div>
              </label>
              <input
                type="url"
                name="discord"
                value={formData.discord}
                onChange={handleInputChange}
                disabled={isLoading}
                placeholder="https://discord.gg/your-invite"
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <div className="flex items-center space-x-2">
                  <Github className="h-4 w-4 text-slate-400" />
                  <span>GitHub</span>
                </div>
              </label>
              <input
                type="url"
                name="github"
                value={formData.github}
                onChange={handleInputChange}
                disabled={isLoading}
                placeholder="https://github.com/your-username"
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-center">
          <motion.button
            type="submit"
            whileHover={!isLoading ? { scale: 1.05 } : {}}
            whileTap={!isLoading ? { scale: 0.95 } : {}}
            disabled={isLoading || submitStatus === 'success'}
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating...' : submitStatus === 'success' ? 'Created!' : 'Create Content'}
          </motion.button>
        </div>
      </form>
    </div>
  );
};