import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Comment } from '../types';

interface CommentsState {
    commentsByPost: Record<string, Comment[]>;
    setComments: (postId: string, comments: Comment[]) => void;
    addComment: (postId: string, comment: Comment) => void;
}

export const useCommentsStore = create<CommentsState>()(
    persist(
        (set, get) => ({
            commentsByPost: {},
            setComments: (postId, comments) =>
                set((state) => ({
                    commentsByPost: { ...state.commentsByPost, [postId]: comments },
                })),
            addComment: (postId, comment) =>
                set((state) => ({
                    commentsByPost: {
                        ...state.commentsByPost,
                        [postId]: [...(state.commentsByPost[postId] || []), comment],
                    },
                })),
        }),
        {
            name: 'meme-world-comments',
        }
    )
); 