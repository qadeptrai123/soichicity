import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import LoginForm from './pages/Login'
import ResetPassword from "./pages/ResetPassword";
import CreatePostDialog from './components/CreatePostDialog';
import EmojiButton from './components/EmojiButton';

function App() {
  return (
    <CreatePostDialog />
    // <EmojiButton />
    // <BrowserRouter>
    //   <Routes>
    //     <Route path='/' element={<LoginForm />} />
    //     <Route path='/reset-password' element={<ResetPassword />} />
    //     <Route path='/test' element={<CreatePostDialog />} />
    //   </Routes>
    // </BrowserRouter>
  )
}

export default App
