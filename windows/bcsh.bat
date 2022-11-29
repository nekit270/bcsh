::Лаунчер для BCSH
@echo off
chcp 1251 > nul
set URL=https://nekit270.github.io/bcsh/windows/bcsh.js

if "%~1"=="/install" (
	setx PATH %PATH%;%~dp0
	setx PATHEXT "%PATHEXT%;.BCSH"
	setx BCSH_DIR %~dp0
	reg add "HKCR\bcshfile" /ve /d "BCSH Script" /t REG_SZ /f 2> nul
	reg add "HKCR\bcshfile\DefaultIcon" /ve /d "%windir%\system32\imageres.dll,-68" /t REG_EXPAND_SZ /f 2> nul
	reg add "HKCR\bcshfile\shell\open\command" /ve /d "%~dpnx0 -f %%1" /t REG_SZ /f 2> nul
	reg add "HKCR\bcshfile\shell\edit\command" /ve /d "%windir%\system32\notepad.exe %%1" /t REG_SZ /f 2> nul
	assoc .bcsh=bcshfile
	call :download %URL%
	exit /b
)

if not exist "%~dp0bcsh.js" (
	call :download %URL%
)
if not exist "%~dp0modules" mkdir "%~dp0modules"
cscript //nologo "%~dp0bcsh.js" %*

exit /b

:download
	curl %~1 -s -o "%~dp0bcsh.js" 2> nul
	if %errorlevel% neq 0 powershell "(New-Object System.Net.WebClient).DownloadFile('%~1', '%~dp0bcsh.js')"
	attrib +h "%~dp0bcsh.js"
exit /b