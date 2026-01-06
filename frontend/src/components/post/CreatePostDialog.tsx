import { Button } from "@/components/ui/button";
import { usePostEditor } from "@/hooks/usePostEditor";

interface Props {
  mockFriends: any[];
}

export default function CreatePostDialog({ mockFriends }: Props) {
  const {
    content,
    setContent,
    mediaFiles,
    handleFileUpload,
    removeMedia,
    submitPost,
    isPosting,
  } = usePostEditor({ mockFriends });

  return (
    <div className="bg-black text-white p-4 rounded-xl">
      {/* Textarea */}
      <textarea
        className="w-full bg-transparent resize-none outline-none"
        placeholder="Bạn đang nghĩ gì?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      {/* Media preview */}
      {mediaFiles.map((m, i) => (
        <div key={i}>
          <span>{m.type}</span>
          <button onClick={() => removeMedia(i)}>X</button>
        </div>
      ))}

      {/* Upload */}
      <input
        type="file"
        multiple
        hidden
        ref={null}
        onChange={handleFileUpload}
      />

      {/* Submit */}
      <Button disabled={isPosting} onClick={() => submitPost()}>
        {isPosting ? "Đang đăng..." : "Đăng"}
      </Button>
    </div>
  );
}
