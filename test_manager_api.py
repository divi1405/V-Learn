import requests

print("Attempting admin login...")
r = requests.post("http://localhost:8000/api/auth/login", json={"email": "admin@vearc.com", "password": "Welcome@123"})
if r.status_code == 200:
    token = r.json().get("access_token")
    print("Admin login success.")
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\nFetching my-team for admin...")
    r2 = requests.get("http://localhost:8000/api/manager/my-team", headers=headers)
    print(f"Status: {r2.status_code}")
    if r2.status_code == 200:
        print(f"Learners found: {len(r2.json())}")
        
    print("\nFetching team-progress for admin...")
    r3 = requests.get("http://localhost:8000/api/manager/team-progress", headers=headers)
    print(f"Status: {r3.status_code}")
    if r3.status_code == 200:
        print(f"Progress entries: {len(r3.json())}")

print("\n---")
print("Attempting manager login...")
r = requests.post("http://localhost:8000/api/auth/login", json={"email": "satyam.priyam@vearc.com", "password": "Welcome@123"})
if r.status_code == 200:
    token = r.json().get("access_token")
    print("Manager login success.")
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\nFetching my-team for manager...")
    r2 = requests.get("http://localhost:8000/api/manager/my-team", headers=headers)
    print(f"Status: {r2.status_code}")
    if r2.status_code == 200:
        print(f"Direct reports found: {len(r2.json())}")
        
    print("\nFetching team-progress for manager...")
    r3 = requests.get("http://localhost:8000/api/manager/team-progress", headers=headers)
    print(f"Status: {r3.status_code}")
    if r3.status_code == 200:
        print(f"Progress entries: {len(r3.json())}")
