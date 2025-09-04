import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as api from '@/api';
import type { ApiCreatePostRequest } from '@/api';
import { FeedItem } from '@/data';

interface PostsState {
  posts: FeedItem[];
  loading: boolean;
  error: string | null;
  creating: boolean;
  fetchPosts: () => Promise<void>;
  createPost: (postData: ApiCreatePostRequest) => Promise<FeedItem>;
  addPost: (post: FeedItem) => void;
}

export const usePostsStore = create(
  persist<PostsState>(
    (set, get) => ({
      posts: [],
      loading: false,
      error: null,
      creating: false,
      fetchPosts: async () => {
        set({ loading: true, error: null });
        try {
          // Try to fetch from API first
          const response = await api.getFeed();
          // Handle the case where the API response might have a different structure
          const posts = Array.isArray(response) ? response : (response.posts || []);
          set({ posts, loading: false });
        } catch (err: unknown) {
          console.error('Failed to fetch posts from API:', err);
          set({ 
            error: 'Failed to fetch posts from API. Please try again later.', 
            loading: false,
            posts: [] 
          });
        }
      },
      createPost: async (postData: ApiCreatePostRequest) => {
        set({ creating: true, error: null });
        try {
          const newPost = await api.createPost(postData);
          // Add the new post to the beginning of the posts array
          const currentPosts = get().posts;
          set({ 
            posts: [newPost, ...currentPosts], 
            creating: false 
          });
          return newPost;
        } catch (err: unknown) {
          console.error('Failed to create post:', err);
          const errorMessage = err instanceof Error ? err.message : 'Failed to create post';
          set({ 
            error: errorMessage,
            creating: false 
          });
          throw err;
        }
      },
      addPost: (post: FeedItem) => {
        const currentPosts = get().posts;
        set({ posts: [post, ...currentPosts] });
      },
    }),
    {
      name: 'meme-world-posts',
    }
  )
); 