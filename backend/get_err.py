import subprocess
try:
    p = subprocess.run(["docker", "exec", "hr_platform-backend-1", "python", "-m", "app.import_employees"], capture_output=True, text=True)
    with open("err2.txt", "w", encoding="utf-8") as f:
        f.write("STDOUT:\n")
        f.write(p.stdout)
        f.write("\nSTDERR:\n")
        f.write(p.stderr)
except Exception as e:
    print(e)
