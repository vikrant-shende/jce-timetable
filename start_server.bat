@echo off
title JCE Faculty Time Table Server
echo Starting JCE Faculty Time Table Local Server...
set PYTHON_PATH="C:\Users\vikra\AppData\Local\Programs\Python\Python39\python.exe"

if exist %PYTHON_PATH% (
    %PYTHON_PATH% "%~dp0start_server.py"
) else (
    python "%~dp0start_server.py"
)
pause
