@echo off
setlocal enabledelayedexpansion

REM ==== проверка: это git-репозиторий? ====
git rev-parse --git-dir >nul 2>&1 || (
    echo Not a git repository. Open this file inside your repo folder.
    pause
    exit /b 1
)

REM ==== задать сообщение коммита ====
set MSG=Feedback modal connected

REM ==== ветка gh-pages ====
set BRANCH=gh-pages
echo Using branch: %BRANCH%

REM ==== есть ли что коммитить? ====
git diff --quiet && git diff --cached --quiet
if %errorlevel%==0 (
    echo No changes to commit. Skipping commit step.
) else (
    git add -A
    git commit -m "%MSG%" || (
        echo Commit failed.
        pause
        exit /b 1
    )
)

REM ==== пуш ====
git push origin %BRANCH%

echo Pushed to branch: %BRANCH% with message: "%MSG%"
pause
