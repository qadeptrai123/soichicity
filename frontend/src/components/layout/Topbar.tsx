import { useState } from "react";
import { ArrowLeft } from "lucide-react"; // Nhớ import ArrowLeft
import { useLocation, useNavigate } from "react-router-dom"; // Import hook router
import { DropdownExtend } from "../DropdownExtend";

interface Option {
  id: string;
  label: string;
}

export default function Topbar() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Option>({ id: "for_you", label: "For you" });

  // Hook để lấy thông tin đường dẫn và điều hướng
  const location = useLocation();
  const navigate = useNavigate();

  // Kiểm tra: Nếu đường dẫn bắt đầu bằng "/post/" thì đang ở trang chi tiết
  const isPostPage = location.pathname.startsWith("/post/");


  const handleSelect = (option: Option) => {
    setSelected(option);
    setOpen(false);

    // Navigate to URL with filter param
    if (option.id === "for_you") navigate("/");
    else navigate(`/?filter=${option.id}`);
  };

  const postFilter = [
    {
      id: "for_you",
      label: "For you",
      onClick: () => handleSelect({ id: "for_you", label: "For you" }),
      isVisible: true,
      showSeparatorAfter: true,
    },
    {
      id: "following",
      label: "Following",
      onClick: () => handleSelect({ id: "following", label: "Following" }),
      isVisible: true,
      showSeparatorAfter: true,
    },
    {
      id: "saved",
      label: "Saved",
      onClick: () => handleSelect({ id: "saved", label: "Saved" }),
      isVisible: true,
      showSeparatorAfter: true,
    },
    {
      id: "liked",
      label: "Liked",
      onClick: () => handleSelect({ id: "liked", label: "Liked" }),
      isVisible: true,
    }
  ];

  return (
    <div className="fixed top-0 left-0 right-0 h-16 z-28 border-b border-[#1F2937] bg-backgroundfeed flex items-center justify-center backdrop-blur-md bg-opacity-95">

      {/* CASE 1: NẾU LÀ TRANG THREAD -> HIỆN NÚT BACK */}
      {isPostPage ? (
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-200 text-lg font-medium hover:opacity-80 transition px-4 py-2 rounded-full hover:bg-white/5"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
      ) : location.pathname === "/activities" ? (
        <div className="text-gray-200 text-lg font-medium">
          Activity
        </div>
      ) : (
        /* CASE 2: CÁC TRANG KHÁC -> HIỆN DROPDOWN CŨ CỦA BẠN */
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1 text-gray-200 text-lg font-medium hover:opacity-80 transition"
          >
            {selected.label}
            {/* <ChevronDown size={18} className={`${open ? "rotate-180" : ""} transition duration-200`} /> */}
            <DropdownExtend
              actions={postFilter}
              triggerType="text"
              align="center"
            />
          </button>

          {/* Dropdown Menu (Ví dụ) */}
          {/* {open && (
            <DropdownExtend
              actions={postFilter}
              triggerType="text"
              align="center"
            />

          )} */}
        </div>
      )}

    </div>
  );
}