import { useState } from "react";
import { ChevronDown, ArrowLeft } from "lucide-react"; // Nhớ import ArrowLeft
import { useLocation, useNavigate } from "react-router-dom"; // Import hook router

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("For you");
  
  // Hook để lấy thông tin đường dẫn và điều hướng
  const location = useLocation();
  const navigate = useNavigate();

  // Kiểm tra: Nếu đường dẫn bắt đầu bằng "/thread/" thì đang ở trang chi tiết
  const isThreadPage = location.pathname.startsWith("/thread/");

  const options = ["For you", "Following", "Saved", "Liked"];

  const handleSelect = (option: string) => {
    setSelected(option);
    setOpen(false);
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-16 z-50 border-b border-[#1F2937] bg-backgroundfeed flex items-center justify-center backdrop-blur-md bg-opacity-95">
      
      {/* CASE 1: NẾU LÀ TRANG THREAD -> HIỆN NÚT BACK */}
      {isThreadPage ? (
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-200 text-lg font-medium hover:opacity-80 transition px-4 py-2 rounded-full hover:bg-white/5"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
      ) : (
        /* CASE 2: CÁC TRANG KHÁC -> HIỆN DROPDOWN CŨ CỦA BẠN */
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1 text-gray-200 text-lg font-medium hover:opacity-80 transition"
          >
            {selected}
            <ChevronDown size={18} className={`${open ? "rotate-180" : ""} transition duration-200`} />
          </button>
            
          {/* Dropdown Menu (Ví dụ) */}
          {open && (
             <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-40 bg-[#1A1F2E] border border-[#374151] rounded-xl shadow-xl overflow-hidden py-1">
                {options.map((opt) => (
                    <div 
                        key={opt}
                        onClick={() => handleSelect(opt)}
                        className="px-4 py-2 text-gray-300 hover:bg-white/10 cursor-pointer text-sm text-center"
                    >
                        {opt}
                    </div>
                ))}
             </div>
          )}
        </div>
      )}

    </div>
  );
}