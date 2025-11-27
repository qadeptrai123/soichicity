// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1 className='text-2xl font-bold underline text-red-500'>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           CCCCCC is {count}
//         </button>
//         <p>
//           Edit <code>src/App.tsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

// export default App



import CreatePostDialog from "@/components/CreatePostDialog";
import './App.css'

function App() {
  return (
    // Nền đen toàn màn hình
    <div className="min-h-screen w-full bg-slate-950 text-white font-sans flex justify-center">
      
      {/* Khung giả lập mobile/tablet */}
      <div className="w-full max-w-[600px] border-x border-neutral-800 min-h-screen relative">
        
        {/* Header */}
        <div className="p-4 flex justify-center border-b border-neutral-800">
           <span className="font-bold text-lg">Sợi Chỉ City</span>
        </div>

        {/* Nội dung thông báo trống */}
        <div className="p-10 text-center text-neutral-500 mt-20">
          <p>Bảng tin chưa có bài viết nào...</p>
          <p className="text-sm mt-2">Hãy bấm nút dấu (+) ở góc dưới để đăng bài mới!</p>
        </div>

        {/* Component tạo bài viết của bạn */}
        <CreatePostDialog />

      </div>
    </div>
  )
}

export default App