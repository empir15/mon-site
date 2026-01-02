@echo off
REM Script pour initialiser la base de données MySQL
REM Usage: double-cliquez sur ce fichier ou exécutez-le dans le terminal

echo ==========================================
echo   Initialisation Base de Données MySQL
echo ==========================================
echo.

REM Vérifier si MySQL est installé
where mysql >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] MySQL n'est pas installé ou n'est pas dans le PATH
    echo Veuillez installer MySQL ou ajouter mysql.exe au PATH système
    pause
    exit /b 1
)

echo [INFO] MySQL trouvé !
echo.

REM Demander les informations de connexion
set /p MYSQL_USER="Entrez le nom d'utilisateur MySQL (par défaut: root): "
if "%MYSQL_USER%"=="" set MYSQL_USER=root

echo.
echo [INFO] Création de la base de données...
echo.

REM Créer la base de données
mysql -u %MYSQL_USER% -p < database.sql

if %ERRORLEVEL% EQ 0 (
    echo [SUCCESS] Base de données créée avec succès !
    echo.
    
    REM Demander si on veut charger les données de test
    set /p LOAD_SEED="Voulez-vous charger les données de test ? (O/N): "
    if /i "%LOAD_SEED%"=="O" (
        echo.
        echo [INFO] Chargement des données de test...
        mysql -u %MYSQL_USER% -p < seed.sql
        
        if %ERRORLEVEL% EQ 0 (
            echo [SUCCESS] Données de test chargées !
            echo.
            echo Comptes disponibles :
            echo   - Chef : chef@dept-info.cm / admin123
            echo   - Enseignant : j.kamga@dept-info.cm / prof123
            echo   - Secrétaire : secretaire@dept-info.cm / secretaire123
        ) else (
            echo [ERREUR] Échec du chargement des données de test
        )
    )
) else (
    echo [ERREUR] Échec de la création de la base de données
)

echo.
echo ==========================================
pause
