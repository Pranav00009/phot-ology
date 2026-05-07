@echo off
echo ================================================
echo   PHOTOLOGY - Git LFS Setup
echo ================================================
echo.

:: Check if git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed! Please install Git first.
    pause
    exit /b 1
)

:: Check if git-lfs is installed
git lfs version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git LFS is not installed!
    echo.
    echo Please install Git LFS from: https://git-lfs.com
    echo Or run: winget install GitHub.GitLFS
    echo.
    pause
    exit /b 1
)

echo [OK] Git and Git LFS are installed.
echo.

:: Initialize LFS in the repo
echo [1/4] Initializing Git LFS...
git lfs install
echo.

:: Track large video and image files
echo [2/4] Tracking large media files with LFS...
git lfs track "*.mp4"
git lfs track "*.mov"
git lfs track "*.avi"
git lfs track "*.mkv"
git lfs track "*.webm"
git lfs track "*.png"
git lfs track "*.jpg"
git lfs track "*.jpeg"
git lfs track "*.gif"
echo.

:: Add .gitattributes
echo [3/4] Adding .gitattributes to git...
git add .gitattributes
echo.

:: Show tracked patterns
echo [4/4] LFS is now tracking these file types:
git lfs track
echo.

echo ================================================
echo   Setup Complete!
echo ================================================
echo.
echo NEXT STEPS:
echo   1. Run: git add assets/
echo   2. Run: git commit -m "migrate media to Git LFS"
echo   3. Run: git push origin main
echo.
echo All future video/image uploads will use LFS automatically.
echo ================================================
echo.
pause
