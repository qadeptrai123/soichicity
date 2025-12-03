# Query API System Walkthrough

I have implemented a robust Query API system using **Axios** and **TanStack Query (React Query)**. This system handles authentication, caching, and loading states automatically.

## Structure

- **`src/lib/api-client.ts`**: Configured Axios instance with interceptors. It automatically attaches the Firebase Auth token to every request.
- **`src/lib/react-query.ts`**: Configured QueryClient for React Query.
- **`src/services/api.ts`**: Central place for all API definitions. Add new endpoints here.
- **`src/hooks/api/`**: Custom hooks for data fetching (e.g., `useUsers`, `useThreads`).

## How to Use

### 1. Fetching Data
Use the custom hooks in your components. They return `data`, `isLoading`, `error`, etc.

```tsx
import { useThreads } from '@/hooks/api/use-threads';

function ThreadList() {
  const { data: threads, isLoading } = useThreads();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {threads?.map(thread => (
        <div key={thread.id}>{thread.content}</div>
      ))}
    </div>
  );
}
```

### 2. Mutating Data (Creating/Updating)
Use mutation hooks.

```tsx
import { useCreateThread } from '@/hooks/api/use-threads';

function CreateThread() {
  const createThread = useCreateThread();

  const handleSubmit = (content: string) => {
    createThread.mutate({ content });
  };

  return <button onClick={() => handleSubmit("Hello!")}>Post</button>;
}
```

## How to Add New APIs

1.  **Define the Type and Function** in `src/services/api.ts`:
    ```typescript
    export const api = {
      // ... existing
      posts: {
        get: (id: string) => apiClient.get<Post>(`/api/v1/posts/${id}`),
      }
    }
    ```

2.  **Create a Hook** in `src/hooks/api/use-posts.ts`:
    ```typescript
    export const usePost = (id: string) => {
      return useQuery({
        queryKey: ['posts', id],
        queryFn: () => api.posts.get(id),
      });
    };
    ```

## Verification
- **Build**: `npm run build` passes successfully.
- **Lint**: Fixed unused variables and imports in `CreatePostDialog.tsx` and `App.tsx`.
