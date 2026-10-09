"""
Cross-Platform AI Chatbot - Unified Background Launcher
Manages both FastAPI backend and Vite frontend without opening extra CMD windows.
"""

import os
import sys

# Ensure UTF-8 output encoding on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import time
import signal
import atexit
import subprocess
import urllib.request
import webbrowser

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
WIDGET_DIR = os.path.join(PROJECT_ROOT, "widget")

backend_process = None
frontend_process = None
keep_running_on_exit = False


def kill_proc_tree(pid: int):
    """Forcefully terminate a process and all its child processes on Windows."""
    if not pid:
        return
    try:
        subprocess.run(
            ["taskkill", "/F", "/T", "/PID", str(pid)],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
    except Exception:
        pass


def release_ports():
    """Ensure ports 8000 and 5173 are freed."""
    try:
        ps_cmd = (
            "try { "
            "(Get-NetTCPConnection -LocalPort 8000,5173 -State Listen -ea 0).OwningProcess | "
            "% { Stop-Process -Id $_ -Force -ea 0 } "
            "} catch {}; exit 0"
        )
        subprocess.run(
            ["powershell", "-NoProfile", "-Command", ps_cmd],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
    except Exception:
        pass


def cleanup():
    """Stop all running server processes."""
    global backend_process, frontend_process, keep_running_on_exit
    if keep_running_on_exit:
        return

    print("\n[*] Stopping all server processes...")
    if backend_process and backend_process.pid:
        kill_proc_tree(backend_process.pid)
    if frontend_process and frontend_process.pid:
        kill_proc_tree(frontend_process.pid)

    release_ports()
    print("[OK] All servers stopped cleanly.")


def check_url(url: str, timeout: float = 1.0) -> bool:
    """Check if a URL responds with HTTP 200/304."""
    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "HealthCheck/1.0"},
        )
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return response.status in (200, 304)
    except Exception:
        return False


def main():
    global backend_process, frontend_process, keep_running_on_exit

    # Register cleanup handlers
    atexit.register(cleanup)
    signal.signal(signal.SIGINT, lambda sig, frame: sys.exit(0))
    signal.signal(signal.SIGTERM, lambda sig, frame: sys.exit(0))

    creation_flags = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0

    print("===================================================================")
    print("        STARTING SERVERS IN BACKGROUND (NO EXTRA WINDOWS)         ")
    print("===================================================================")
    print()

    # Free any previously lingering servers on ports 8000 & 5173
    print("  [*] Releasing previous server processes...")
    release_ports()
    time.sleep(0.5)

    # 1. Start FastAPI Backend
    print("  [1/2] Launching FastAPI Backend on port 8000...")
    backend_cmd = [
        sys.executable,
        "-m",
        "uvicorn",
        "app.main:app",
        "--host",
        "0.0.0.0",
        "--port",
        "8000",
        "--reload",
    ]

    try:
        backend_process = subprocess.Popen(
            backend_cmd,
            cwd=BACKEND_DIR,
            creationflags=creation_flags,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        print(f"        -> Backend started (PID: {backend_process.pid})")
    except Exception as e:
        print(f"  [ERROR] Failed to start backend: {e}")
        sys.exit(1)

    # 2. Start Vite Frontend Widget Dev Server
    print("  [2/2] Launching Vite Frontend on port 5173...")
    frontend_cmd = [
        "cmd.exe",
        "/c",
        "npm",
        "run",
        "dev",
        "--",
        "--host",
        "0.0.0.0",
        "--port",
        "5173",
    ]
    try:
        frontend_process = subprocess.Popen(
            frontend_cmd,
            cwd=WIDGET_DIR,
            creationflags=creation_flags,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        print(f"        -> Frontend started (PID: {frontend_process.pid})")
    except Exception as e:
        print(f"  [ERROR] Failed to start frontend: {e}")
        sys.exit(1)

    # 3. Health check polling
    print()
    print("[*] Waiting for servers to initialize and become ready...")
    backend_ready = False
    frontend_ready = False
    max_wait_seconds = 20
    start_time = time.time()

    while time.time() - start_time < max_wait_seconds:
        if not backend_ready:
            backend_ready = check_url("http://127.0.0.1:8000/docs")
        if not frontend_ready:
            frontend_ready = check_url("http://127.0.0.1:5173")

        if backend_ready and frontend_ready:
            break

        # Check if either process crashed early
        if backend_process.poll() is not None:
            print(f"\n[ERROR] Backend process exited unexpectedly with code {backend_process.returncode}")
            sys.exit(1)
        if frontend_process.poll() is not None:
            print(f"\n[ERROR] Frontend process exited unexpectedly with code {frontend_process.returncode}")
            sys.exit(1)

        time.sleep(0.5)

    if not (backend_ready and frontend_ready):
        print("\n[WARNING] One or more servers took longer than expected to respond.")
        print(f"  Backend ready : {backend_ready}")
        print(f"  Frontend ready: {frontend_ready}")
    else:
        print("[OK] Both servers are online and responding!")

    # 4. Open browser
    time.sleep(0.5)
    target_url = "http://localhost:5173"
    print(f"\n[*] Opening {target_url} in your default browser...")
    try:
        webbrowser.open(target_url)
    except Exception as e:
        print(f"    (Could not automatically launch browser: {e})")

    # 5. Display Dashboard
    print()
    print("===================================================================")
    print("               CROSS-PLATFORM AI CHATBOT IS RUNNING!               ")
    print("===================================================================")
    print()
    print("  [Access Links]")
    print("  -----------------------------------------------------------------")
    print("  * Frontend Widget (Vite Dev)  : http://localhost:5173")
    print("  * Backend Server (FastAPI)    : http://localhost:8000")
    print("  * Embedded Demo Page          : http://localhost:8000/test")
    print("  * Swagger API Docs            : http://localhost:8000/docs")
    print()
    print("  -----------------------------------------------------------------")
    print("  [Running Server Status]")
    print(f"  * FastAPI Backend : RUNNING on port 8000 (PID {backend_process.pid})")
    print(f"  * Vite Frontend   : RUNNING on port 5173 (PID {frontend_process.pid})")
    print("  (Both servers are running smoothly without opening extra CMD windows!)")
    print()
    print("===================================================================")
    print("  Controls:")
    print("  - Keep this single window open while using the chatbot!")
    print("  - Type [Q] and press Enter to Stop All Servers and Exit")
    print("  - Type [O] and press Enter to Re-open Browser (http://localhost:5173)")
    print("===================================================================")
    print()

    # 6. Command Loop
    while True:
        try:
            choice = input("Enter command [Q=Quit, O=Open]: ").strip().lower()
            if choice == "q":
                cleanup()
                sys.exit(0)
            elif choice == "o":
                print(f"Re-opening {target_url}...")
                webbrowser.open(target_url)
            elif choice == "":
                continue
            else:
                print("Invalid command. Please enter Q or O.")
        except EOFError:
            # Stdin is not interactive / closed: keep running until terminated
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                cleanup()
                sys.exit(0)
        except KeyboardInterrupt:
            cleanup()
            sys.exit(0)


if __name__ == "__main__":
    main()
