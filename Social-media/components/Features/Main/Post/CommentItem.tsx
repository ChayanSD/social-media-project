// components/CommentItem.tsx

import React, { useState } from "react";
import { CommentType } from "../../../types/types";

interface CommentItemProps {
  comment: CommentType;
  addReply: (parentId: number, text: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, addReply }) => {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");

  const handleReply = () => {
    if (!replyText.trim()) return;
    addReply(comment.id, replyText);
    setReplyText("");
    setReplying(false);
  };

  return (
    <div className="ml-4 mt-4">
      <div className="bg-slate-800 p-3 rounded-md text-white text-sm">
        <p><strong>{comment.author}</strong>: {comment.text}</p>
      </div>
      <button
        onClick={() => setReplying(!replying)}
        className="text-xs text-blue-400 mt-1 hover:underline"
      >
        Reply
      </button>

      {replying && (
        <div className="mt-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            className="w-full bg-slate-900 text-white p-2 rounded border border-slate-600 text-sm"
          />
          <button
            onClick={handleReply}
            className="mt-1 text-sm text-white bg-blue-600 px-2 py-1 rounded"
          >
            Submit
          </button>
        </div>
      )}

      {comment.children?.map((child) => (
        <CommentItem key={child.id} comment={child} addReply={addReply} />
      ))}
    </div>
  );
};

export default CommentItem;
