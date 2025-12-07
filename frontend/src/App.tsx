import './App.css'
import { CURRENT_USER, MOCK_FRIENDS, MOCK_TARGET_POST } from "@/MockData/data"; 
import Comment from './components/comment';
// import CreatePostDialog from './components/CreatePostDialog';


export default function App() {

    return (
        <Comment  
            open={true} 
            onOpenChange={() => {}} 
            currentUser={CURRENT_USER} 
            targetPost={MOCK_TARGET_POST}
            mockFriends={MOCK_FRIENDS} 
            onPost={(content, mediaFiles) => {
                console.log("Đã gửi comment với nội dung:", content, "và media:", mediaFiles);
            }}
        />
    );
}