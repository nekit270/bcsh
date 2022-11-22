@echo off
chcp 1251 > nul
set URL=https://nekit270.github.io/files/bcsh_windows.js

if not exist %~dp0bcsh.js (
	curl %URL% -s -o %~dp0bcsh.js 2> nul
	if %errorlevel% neq 0 powershell "(New-Object System.Net.WebClient).DownloadFile('%URL%', '%~dp0bcsh.js')"
	attrib +h %~dp0bcsh.js
)
cscript //nologo %~dp0bcsh.js %*