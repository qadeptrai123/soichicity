import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import LoginForm from './pages/Login'
import ResetPassword from "./pages/ResetPassword";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import CreatePostDialog from './components/CreatePostDialog';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<LoginForm />} />
        <Route path='/register' element={<Register />} />
        <Route path='/forgot-password' element={<ForgotPassword />} />
        <Route path='/reset-password' element={<ResetPassword />} />
      </Routes>
    </BrowserRouter>
  )
}
// function App() {
//   return (
//     <CreatePostDialog />
//   )
// }

export default App
