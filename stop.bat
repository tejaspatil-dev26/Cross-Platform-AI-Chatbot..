@echo off
title Cross-Platform AI Chatbot - Stop Servers
color 0C

echo ===================================================================
echo           STOPPING CROSS-PLATFORM AI CHATBOT SERVERS
echo ===================================================================
echo.
echo Stopping running processes on ports 8000 and 5173...
powershell -NoProfile -Command "try { (Get-NetTCPConnection -LocalPort 8000,5173 -State Listen -ea 0).OwningProcess | %% { Stop-Process -Id $_ -Force -ea 0 } } catch {}; exit 0" >nul 2>nul
echo.
echo [DONE] Ports 8000 and 5173 have been released and all servers stopped.
echo.
ping 127.0.0.1 -n 2 >nul
exit /b 0
