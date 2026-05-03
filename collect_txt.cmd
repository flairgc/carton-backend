@echo off
setlocal EnableDelayedExpansion

rem === Project root (default: current directory) ===
set "ROOT=%~1"
if "%ROOT%"=="" set "ROOT=%CD%"

rem === Output file ===
set "OUT=combined_sources.txt"
> "%OUT%" echo.

rem === File extensions ===
set EXT=ts tsx js jsx json css scss html md env

rem === Excluded directories ===
set EXCLUDE=.git .idea .vscode node_modules dist build coverage .cache .next out

rem === Excluded file names ===
set EXCLUDE_FILES=package-lock.json yarn.lock pnpm-lock.yaml

call :walk "%ROOT%"

echo Done. Output file: %OUT%
exit /b


:walk
set "CURDIR=%~1"
set "DIRNAME=%~nx1"

rem --- Skip excluded directories ---
for %%X in (%EXCLUDE%) do (
    if /i "%DIRNAME%"=="%%X" exit /b
)

rem --- Process files in current directory ---
for %%E in (%EXT%) do (
    for %%F in ("%CURDIR%\*.%%E") do (
        if exist "%%F" (

            rem --- Check if file should be excluded ---
            set "SKIP="
            for %%X in (%EXCLUDE_FILES%) do (
                if /i "%%~nxF"=="%%X" set "SKIP=1"
            )

            if not defined SKIP (
                set "REL=%%F"
                set "REL=!REL:%ROOT%\=!"

                echo !REL!>>"%OUT%"
                echo.>>"%OUT%"
                type "%%F">>"%OUT%"
                echo.>>"%OUT%"
                echo.>>"%OUT%"
            )

        )
    )
)

rem --- Recurse into subdirectories ---
for /d %%D in ("%CURDIR%\*") do (
    call :walk "%%D"
)

exit /b
