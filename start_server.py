import http.server
import socketserver
import socket
import webbrowser
import os
import sys

PORT = 8080

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

def run():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    local_ip = get_local_ip()
    local_url = f"http://localhost:{PORT}"
    network_url = f"http://{local_ip}:{PORT}"

    print("=" * 68)
    print("   JAIN COLLEGE OF ENGINEERING - FACULTY TIME TABLE MOBILE APP")
    print("=" * 68)
    print(f"\n[+] Local PC URL:             {local_url}")
    print(f"[+] Mobile Phone URL (Wi-Fi): {network_url}")
    print("\n" + "-" * 68)
    print("HOW TO OPEN & INSTALL ON YOUR ANDROID PHONE:")
    print("1. Connect your phone to the same Wi-Fi as this laptop.")
    print(f"2. Open Chrome on Android and visit: {network_url}")
    print("\nIF CHROME SAYS 'APP CANNOT BE INSTALLED':")
    print("-> Why: Android Chrome requires HTTPS to mint a full WebAPK.")
    print("-> Quick Fix (Instant):")
    print("   In Chrome on your phone, tap the 3-dots menu (⋮) at top right,")
    print("   then tap 'Add to Home screen' (or 'Add shortcut').")
    print("   This creates the timetable app icon on your phone home screen!")
    print("-" * 68 + "\n")
    print("Serving files... Press Ctrl+C to stop.")

    try:
        webbrowser.open(local_url)
    except Exception:
        pass

    with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")

if __name__ == '__main__':
    run()
