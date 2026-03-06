"""
Quick test script for Clerk authentication

Usage:
    python test_auth.py <your_clerk_jwt_token>
"""
import sys
import asyncio
import httpx


async def test_auth(token: str):
    """Test authentication endpoints"""
    base_url = "http://localhost:8000/api/auth"
    headers = {"Authorization": f"Bearer {token}"}
    
    print("=" * 70)
    print("Testing Clerk Authentication")
    print("=" * 70)
    print()
    
    async with httpx.AsyncClient() as client:
        # Test 1: Get current user
        print("1. Testing /api/auth/me (requires auth)")
        print("-" * 70)
        try:
            response = await client.get(f"{base_url}/me", headers=headers)
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"✓ Success!")
                print(f"  Clerk ID: {data.get('clerk_id')}")
                print(f"  Email: {data.get('email')}")
                print(f"  Name: {data.get('full_name')}")
            else:
                print(f"✗ Failed: {response.text}")
        except Exception as e:
            print(f"✗ Error: {e}")
        print()
        
        # Test 2: Verify token
        print("2. Testing /api/auth/verify-token")
        print("-" * 70)
        try:
            response = await client.post(f"{base_url}/verify-token", headers=headers)
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"✓ Token is valid!")
                print(f"  Valid: {data.get('valid')}")
                print(f"  User ID: {data.get('user_id')}")
            else:
                print(f"✗ Failed: {response.text}")
        except Exception as e:
            print(f"✗ Error: {e}")
        print()
        
        # Test 3: Optional auth endpoint (with token)
        print("3. Testing /api/auth/optional (with token)")
        print("-" * 70)
        try:
            response = await client.get(f"{base_url}/optional", headers=headers)
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"✓ Success!")
                print(f"  Authenticated: {data.get('authenticated')}")
                print(f"  Message: {data.get('message')}")
            else:
                print(f"✗ Failed: {response.text}")
        except Exception as e:
            print(f"✗ Error: {e}")
        print()
        
        # Test 4: Optional auth endpoint (without token)
        print("4. Testing /api/auth/optional (without token)")
        print("-" * 70)
        try:
            response = await client.get(f"{base_url}/optional")
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"✓ Success!")
                print(f"  Authenticated: {data.get('authenticated')}")
                print(f"  Message: {data.get('message')}")
            else:
                print(f"✗ Failed: {response.text}")
        except Exception as e:
            print(f"✗ Error: {e}")
        print()
    
    print("=" * 70)
    print("Testing complete!")
    print("=" * 70)


async def test_without_token():
    """Test that protected endpoints require auth"""
    base_url = "http://localhost:8000/api/auth"
    
    print("=" * 70)
    print("Testing Protected Endpoints (without token)")
    print("=" * 70)
    print()
    
    async with httpx.AsyncClient() as client:
        print("Testing /api/auth/me (should fail)")
        print("-" * 70)
        try:
            response = await client.get(f"{base_url}/me")
            print(f"Status: {response.status_code}")
            if response.status_code == 401:
                print("✓ Correctly rejected (401 Unauthorized)")
            else:
                print(f"✗ Unexpected response: {response.text}")
        except Exception as e:
            print(f"✗ Error: {e}")
        print()
    
    print("=" * 70)


def main():
    if len(sys.argv) < 2:
        print("Usage: python test_auth.py <clerk_jwt_token>")
        print("\nOr test without token:")
        print("Usage: python test_auth.py --no-token")
        print("\nMake sure FastAPI server is running on http://localhost:8000")
        sys.exit(1)
    
    if sys.argv[1] == "--no-token":
        asyncio.run(test_without_token())
    else:
        token = sys.argv[1]
        asyncio.run(test_auth(token))


if __name__ == "__main__":
    main()
