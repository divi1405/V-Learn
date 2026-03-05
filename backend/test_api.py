import requests

# Test login to get token
response = requests.post("http://localhost:8000/api/auth/login", data={"username": "sri.vidya@vearc.com", "password": "Welcome@123"})
if response.status_code == 200:
    token = response.json()["access_token"]
    
    # Test badges/me
    headers = {"Authorization": f"Bearer {token}"}
    badges_res = requests.get("http://localhost:8000/api/badges/me", headers=headers)
    print("Badges:", badges_res.json())
    
    # Check enrollments
    enroll_res = requests.get("http://localhost:8000/api/enrollments", headers=headers)
    completed = [e for e in enroll_res.json() if e["status"] == "completed"]
    print("Completed enrollments:", len(completed))
else:
    print("Login failed:", response.status_code, response.text)
