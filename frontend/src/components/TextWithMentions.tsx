import React from 'react';
import { useNavigate } from 'react-router-dom';
import { parseTextWithMentions } from '@/lib/utils';

interface TextWithMentionsProps {
  content: string;
  className?: string;
}

/**
 * Component to render text with @mentions highlighted and clickable
 */
export const TextWithMentions: React.FC<TextWithMentionsProps> = ({ content, className = '' }) => {
  const navigate = useNavigate();
  const segments = parseTextWithMentions(content);

  const handleMentionClick = (e: React.MouseEvent, username: string) => {
    e.stopPropagation();
    navigate(`/profile/@${username}`);
  };

  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (segment.type === 'mention' && segment.username) {
          return (
            <span
              key={index}
              onClick={(e) => handleMentionClick(e, segment.username!)}
              className="text-[#3b82f6] font-semibold cursor-pointer hover:underline"
            >
              {segment.content}
            </span>
          );
        }
        return <span key={index}>{segment.content}</span>;
      })}
    </span>
  );
};

export default TextWithMentions;
