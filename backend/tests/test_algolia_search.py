from app.services.algolia_search import algolia_search_service

def test_search_users():
    """Test search users functionality"""
    try:
        # Search với query "hcl"
        results = algolia_search_service.search_users(
            query="hcb",
            page=0,
            hits_per_page=10
        )
        
        print("=" * 50)
        print("Search Results:")
        print("=" * 50)
        print(f"Query: hcl")
        print(f"Total hits: {results['total']}")
        print(f"Current page: {results['page']}")
        print(f"Total pages: {results['pages']}")
        print("\nUsers found:")
        
        for idx, hit in enumerate(results['hits'], 1):
            print(f"\n{idx}. Username: {hit.get('username')}")
            print(f"   Full name: {hit.get('full_name')}")
            print(f"   ObjectID: {hit.get('objectID')}")
            
        print("=" * 50)
        print("✓ Test passed successfully!")
        
    except Exception as e:
        print(f"✗ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_search_users()