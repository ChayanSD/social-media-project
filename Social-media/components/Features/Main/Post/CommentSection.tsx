// components/CommentSection.tsx

"use client";

import React, { useState } from "react";
import CommentItem from "./CommentItem";
import { CommentType } from "../../../types/types";

const CommentSection: React.FC = () => {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [text, setText] = useState("");

  const addComment = () => {
    if (!text.trim()) return;

    const newComment: CommentType = {
      id: Date.now(),
      text,
      parentId: null,
      author: "You",
      children: [],
    };

    setComments([...comments, newComment]);
    setText("");
  };

  const addReply = (parentId: number, replyText: string) => {
    const newReply: CommentType = {
      id: Date.now(),
      text: replyText,
      parentId,
      author: "You",
      children: [],
    };

    const insertReply = (nodes: CommentType[]): CommentType[] => {
      return nodes.map((node) => {
        if (node.id === parentId) {
          return {
            ...node,
            children: [...node.children, newReply],
          };
        } else {
          return {
            ...node,
            children: insertReply(node.children),
          };
        }
      });
    };

    setComments(insertReply(comments));
  };

  return (
    <div className="mt-5">
      <input
        placeholder="Write a comment..."
        className="w-full bg-slate-900 text-white p-3 rounded-full border border-slate-600"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        onClick={addComment}
        className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm"
      >
        Comment
      </button>

      <div className="mt-5">
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} addReply={addReply} />
        ))}
      </div>
    </div>
  );
};

export default CommentSection;
