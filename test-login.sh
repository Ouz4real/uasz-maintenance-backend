#!/bin/bash

# Script de test de connexion pour UASZ Maintenance
# Usage: ./test-login.sh [username] [password]

API_URL="http://localhost:8080/api/auth/login"

# Couleurs pour l'affichage
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔐 Test de connexion - UASZ Maintenance"
echo "========================================"
echo ""

# Si des arguments sont fournis, les utiliser
if [ $# -eq 2 ]; then
    USERNAME=$1
    PASSWORD=$2
else
    # Sinon, tester tous les comptes
    echo "Test de tous les comptes utilisateurs..."
    echo ""
    
    # Tableau des utilisateurs
    declare -a users=(
        "admin:admin123:ADMINISTRATEUR"
        "superviseur:super123:SUPERVISEUR"
        "responsable:resp123:RESPONSABLE_MAINTENANCE"
        "technicien:tech123:TECHNICIEN"
        "demandeur:dem123:DEMANDEUR"
    )
    
    for user in "${users[@]}"; do
        IFS=':' read -r username password role <<< "$user"
        
        echo -e "${YELLOW}Test: $username ($role)${NC}"
        
        response=$(curl -s -X POST "$API_URL" \
            -H "Content-Type: application/json" \
            -d "{\"usernameOrEmail\":\"$username\",\"motDePasse\":\"$password\"}")
        
        if echo "$response" | grep -q "token"; then
            token=$(echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
            echo -e "${GREEN}✓ Connexion réussie${NC}"
            echo "  Token: ${token:0:50}..."
        else
            echo -e "${RED}✗ Échec de connexion${NC}"
            echo "  Réponse: $response"
        fi
        echo ""
    done
    
    exit 0
fi

# Test d'un seul utilisateur
echo "Test de connexion pour: $USERNAME"
echo ""

response=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "{\"usernameOrEmail\":\"$USERNAME\",\"motDePasse\":\"$PASSWORD\"}")

if echo "$response" | grep -q "token"; then
    echo -e "${GREEN}✓ Connexion réussie!${NC}"
    echo ""
    echo "Réponse complète:"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
else
    echo -e "${RED}✗ Échec de connexion${NC}"
    echo ""
    echo "Réponse:"
    echo "$response"
fi
