// import Sidebar from "./Sidebar";
// import Topbar from "./Topbar";
// import { Outlet } from "react-router-dom";

// export default function Layout() {
//   return (
//     <div className="flex bg-[#0d1117] text-white">
//       <Sidebar />

//       <div className="flex-1 min-h-screen flex flex-col">
//         <Topbar />

//         <div className="flex-1 overflow-auto px-10 py-6">
//           <Outlet />
//         </div>
//       </div>
//     </div>
//   );
// }
// import Sidebar from "./Sidebar";
// import Topbar from "./Topbar";
// import { Outlet } from "react-router-dom";

// export default function Layout() {
//   return (
//     <div className="relative bg-[#0b0f15] w-full min-h-screen">
      
//       {/* Sidebar overlay (absolute) */}
//       <div className="fixed left-0 top-0 h-screen z-20">
//         <Sidebar />
//       </div>

//       {/* Topbar */}
//       <div className="relative z-10">
//         <Topbar />
//       </div>

//       {/* Main content */}
//       <div className="flex-1 overflow-auto px-10 py-6">
//            <Outlet />
//          </div>
//        </div>
//   );
// }
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="bg-[#0b0f15] min-h-screen w-full flex">

      {/* Sidebar (80px) */}
      <div className="fixed left-0 top-0 h-screen w-20 z-30">
        <Sidebar />
      </div>

      {/* RIGHT AREA (Topbar + Content) */}
      <div className="flex-1 ml-20"> 
        {/* Topbar */}
        <div className="fixed top-0 left-20 right-0 h-16 z-20">
          <Topbar />
        </div>

        {/* MAIN CONTENT (scrollable) */}
        <div className="pt-16">
          <Outlet />
        </div>
      </div>

    </div>
  );
}



