@echo off
rem Serves this folder locally (browsers block module scripts on file://) and opens the app.
rem no-store: the browser always loads the latest files instead of a cached copy.
cd /d "%~dp0"
start "" http://localhost:8000
py -c "import http.server as h; R=h.SimpleHTTPRequestHandler; e=R.end_headers; R.end_headers=lambda s:(s.send_header('Cache-Control','no-store'),e(s)); h.test(R,port=8000)"
