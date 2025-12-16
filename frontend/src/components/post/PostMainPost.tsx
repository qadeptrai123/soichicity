import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MoreHorizontal, Heart, MessageCircle, Repeat2, Send } from "lucide-react";

interface PostMainPostProps { data: any; onViewActivity: () => void; }

export const PostMainPost = ({ data }: PostMainPostProps) => {
  // Hàm format thời gian giả lập (hoặc dùng thư viện date-fns nếu có)
  const timeAgo = "16h"; // Hardcode cho giống mẫu, thực tế bạn dùng formatDistanceToNow(new Date(data.createdAt))

  return (
    <div className="p-6 pb-6 text-white">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-3 items-center">
            <Avatar className="w-12 h-12 border border-[#374151]">
                <AvatarImage src={data.author.avatar} />
                <AvatarFallback>{data.author.name[0]}</AvatarFallback>
            </Avatar>
            <div>
                <div className="flex items-center gap-2">
                    <span className="font-bold text-lg leading-tight text-white">{data.author.name}</span>
                    <span className="text-[#64748b] text-base">@{data.author.username}</span>
                    
                    {/* THÊM THỜI GIAN Ở ĐÂY */}
                    <span className="text-[#64748b] text-sm flex items-center gap-1">
                        <span className="text-[10px]">•</span> {timeAgo}
                    </span>
                </div>
            </div>
        </div>
        <button className="text-[#94a3b8] hover:text-white p-2 rounded-full hover:bg-white/10">
            <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="text-[17px] leading-7 whitespace-pre-wrap mb-6 font-normal text-[#f1f5f9]">
         {data.content}
      </div>
      
      {/* Stats Row */}
      <div className="flex items-center gap-6 text-[#94a3b8] pt-2">
          <div className="flex items-center gap-2 group cursor-pointer hover:text-rose-500 transition-colors">
             <Heart size={20} /> <span className="text-sm font-medium">{data.likes}</span>
          </div>
          <div className="flex items-center gap-2 group cursor-pointer hover:text-blue-500 transition-colors">
             <MessageCircle size={20} /> <span className="text-sm font-medium">{data.replies?.length}</span>
          </div>
          <div className="flex items-center gap-2 group cursor-pointer hover:text-green-500 transition-colors">
             <Repeat2 size={20} /> <span className="text-sm font-medium">12</span>
          </div>
           <div className="flex items-center gap-2 group cursor-pointer hover:text-blue-400 transition-colors">
             <Send size={20} />
          </div>
      </div>
    </div>
  );
};