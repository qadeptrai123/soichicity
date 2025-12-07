
import Profile from "./components/profile";
// Import dữ liệu từ file mock (hoặc API) tại đây
import { CURRENT_USER, MOCK_FRIENDS } from "./MockData/data";
import "./App.css";


export default function App() {
  return (
    <div className="min-h-screen bg-[#101010] text-white flex justify-center p-4">
      {/* Truyền dữ liệu vào Profile qua Props */}
      <Profile 
        currentUser={CURRENT_USER} 
        mockFriends={MOCK_FRIENDS} 
      />
    </div>
  );
}