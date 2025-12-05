// import { ChevronDown } from "lucide-react";

// export default function Topbar() {
//   return (
//     <div className="h-16 w-full border-b border-[#1f2632] bg-[#0d1117] flex items-center justify-center">
//       <button className="flex items-center gap-1 text-gray-200 text-lg font-medium hover:opacity-80 transition">
//         For you
//         <ChevronDown size={18} />
//       </button>
//     </div>
//   );
// }
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function Topbar() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("For you");

  const options = ["For you", "Following", "Saved", "Liked"];

  const handleSelect = (option: string) => {
    setSelected(option);
    setOpen(false);
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-16 z-20 border-b border-[#1F2937] bg-backgroundfeed flex items-center justify-center">

      {/* Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-gray-200 text-lg font-medium hover:opacity-80 transition"
      >
        {selected}
        <ChevronDown size={18} className={`${open ? "rotate-180" : ""} transition`} />
      </button>


    </div>
  );
}


