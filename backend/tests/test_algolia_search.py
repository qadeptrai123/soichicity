from app.services.algolia_search import algolia_search_service


def test_search_all():
    """Test search users + posts functionality"""
    try:
        query = "hcb"

        results = algolia_search_service.search_all(
            query=query,
            page=0,
            hits_per_page=5,
            only_root_posts=True
        )

        print("=" * 50)
        print("GLOBAL SEARCH RESULTS")
        print("=" * 50)
        print(f"Query: {query}")

        # -------- USERS --------
        users = results["users"]
        print("\n--- USERS ---")
        print(f"Total users: {users['total']}")

        if not users["hits"]:
            print("No users found")
        else:
            for idx, hit in enumerate(users["hits"], 1):
                print(f"\n{idx}. Username: {hit.get('username')}")
                print(f"   Full name: {hit.get('full_name')}")
                print(f"   ObjectID: {hit.get('objectID')}")

        # -------- POSTS --------
        posts = results["posts"]
        print("\n--- POSTS ---")
        print(f"Total posts: {posts['total']}")

        if not posts["hits"]:
            print("No posts found")
        else:
            for idx, hit in enumerate(posts["hits"], 1):
                print(f"\n{idx}. Post ID: {hit.get('post_id')}")
                print(f"   Content: {hit.get('content')}")
                print(f"   Likes: {hit.get('likes_count')}")
                print(f"   Created at: {hit.get('created_at')}")

        print("\n" + "=" * 50)
        print("✓ search_all test passed successfully!")

    except Exception as e:
        print(f"✗ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    test_search_all()
