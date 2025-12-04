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
    <div className="relative h-16 w-full border-b border-[#1f2632] bg-[#0d1117] flex items-center justify-center">
      
      {/* Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-gray-200 text-lg font-medium hover:opacity-80 transition"
      >
        {selected}
        <ChevronDown size={18} className={`${open ? "rotate-180" : ""} transition`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-16 bg-[#0d1117] border border-[#1f2632] rounded-xl shadow-lg w-40 p-2">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              className={`w-full text-left px-3 py-2 rounded-lg text-gray-200 hover:bg-[#1a222e] transition ${
                selected === opt ? "bg-[#17212b]" : ""
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


