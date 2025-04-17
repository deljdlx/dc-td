class Tower {
    /**
     * Crée une nouvelle tour
     * @param {Object} config Configuration de la tour
     * @param {number} x Position X de la tour
     * @param {number} y Position Y de la tour
     * @param {HTMLElement} gameBoard Élément conteneur du jeu
     * @param {number} cellSize Taille d'une cellule
     */
    constructor(config, x, y, gameBoard, cellSize) {
        this.id = Utils.generateId();
        this.type = config.id;
        this.name = config.name;
        this.damage = config.damage;
        this.range = config.range;
        this.fireRate = config.fireRate;
        this.cost = config.cost;
        this.color = config.color;
        this.projectileColor = config.projectileColor;
        this.projectileSpeed = config.projectileSpeed;
        this.splashRadius = config.splashRadius || 0; // Rayon des dégâts de zone
        this.splashDamagePercent = config.splashDamagePercent || 100; // Pourcentage des dégâts en zone
        
        this.x = x;
        this.y = y;
        this.gameBoard = gameBoard;
        this.cellSize = cellSize;
        this.size = cellSize * 0.7;
        
        this.lastFireTime = 0;
        this.target = null;
        this.projectiles = [];
        this.selected = false;
        
        // Système de niveau
        this.level = 1;
        this.maxLevel = 3;
        this.upgradeMultiplier = config.upgradeMultiplier || 1.5; // Multiplicateur des stats par niveau
        this.upgradeCost = Math.round(this.cost * 0.75); // Coût d'amélioration = 75% du coût initial
        
        // Éléments DOM
        this.element = null;
        this.rangeElement = null;
        this.infoPopup = null;
        this.levelIndicator = null;
        
        this.createDOMElements();
    }
    
    /**
     * Crée les éléments DOM pour la tour
     */
    createDOMElements() {
        // Créer l'élément de la tour
        this.element = document.createElement('div');
        this.element.className = 'tower';
        this.element.id = `tower-${this.id}`;
        this.element.style.width = `${this.size}px`;
        this.element.style.height = `${this.size}px`;
        this.element.style.backgroundColor = this.color;
        this.updatePosition();
        
        // Ajouter un attribut data pour faciliter l'identification
        this.element.dataset.towerId = this.id;
        this.element.dataset.towerType = this.type;
        
        // Créer l'indicateur de niveau
        this.levelIndicator = document.createElement('div');
        this.levelIndicator.className = 'tower-level';
        this.levelIndicator.textContent = this.level;
        this.element.appendChild(this.levelIndicator);
        
        // Créer l'élément de portée (initialement caché)
        this.rangeElement = document.createElement('div');
        this.rangeElement.className = 'tower-range';
        this.rangeElement.style.width = `${this.range * 2}px`;
        this.rangeElement.style.height = `${this.range * 2}px`;
        this.rangeElement.style.left = `${this.x - this.range}px`;
        this.rangeElement.style.top = `${this.y - this.range}px`;
        this.rangeElement.style.display = 'none';
        
        // Créer le popup d'information (initialement caché)
        this.infoPopup = document.createElement('div');
        this.infoPopup.className = 'tower-info-popup';
        this.infoPopup.innerHTML = this.getInfoHTML();
        this.infoPopup.style.display = 'none';
        
        // Ajouter des écouteurs d'événements pour afficher la portée et le popup au survol
        this.element.addEventListener('mouseenter', () => {
            if (!this.selected) {
                this.rangeElement.style.display = 'block';
                this.rangeElement.classList.add('hover-range');
            }
            // Afficher le popup d'information
            this.infoPopup.style.display = 'block';
            this.updateInfoPopupPosition();
        });
        
        this.element.addEventListener('mouseleave', () => {
            if (!this.selected) {
                this.rangeElement.style.display = 'none';
                this.rangeElement.classList.remove('hover-range');
            }
            // Cacher le popup d'information
            this.infoPopup.style.display = 'none';
        });
        
        // Ajouter les éléments au jeu
        this.gameBoard.appendChild(this.element);
        this.gameBoard.appendChild(this.rangeElement);
        this.gameBoard.appendChild(this.infoPopup);
    }
    
    /**
     * Génère le contenu HTML du popup d'information
     * @returns {string} Le HTML formaté pour le popup
     */
    getInfoHTML() {
        // Calculer les dégâts par seconde (DPS)
        const dps = (this.damage * this.fireRate).toFixed(1);
        
        // Construire les informations sur l'amélioration possible
        let upgradeInfo = '';
        if (this.level < this.maxLevel) {
            const nextDamage = Math.round(this.damage * this.upgradeMultiplier);
            const nextRange = Math.round(this.range * this.upgradeMultiplier);
            const nextFireRate = +(this.fireRate * this.upgradeMultiplier).toFixed(1);
            const nextDps = (nextDamage * nextFireRate).toFixed(1);
            
            upgradeInfo = `
                <div class="tower-upgrade-info">
                    <h4>Niveau suivant :</h4>
                    <div><span>Dégâts:</span> ${nextDamage} (+${Math.round((nextDamage-this.damage))})</div>
                    <div><span>Portée:</span> ${nextRange} (+${Math.round((nextRange-this.range))})</div>
                    <div><span>Cadence:</span> ${nextFireRate}/s (+${(nextFireRate-this.fireRate).toFixed(1)})</div>
                    <div><span>DPS:</span> ${nextDps} (+${(nextDps-dps).toFixed(1)})</div>
                    <div class="upgrade-cost">Coût: ${this.upgradeCost}</div>
                </div>
            `;
        } else {
            upgradeInfo = '<div class="tower-max-level">Niveau maximum atteint</div>';
        }
        
        // Formatage du contenu du popup avec les détails de la tour
        return `
            <h3>${this.name} <span class="tower-level-badge">Niv. ${this.level}</span></h3>
            <div class="tower-info-stats">
                <div><span>Dégâts:</span> ${this.damage}</div>
                <div><span>Portée:</span> ${this.range}</div>
                <div><span>Cadence:</span> ${this.fireRate}/s</div>
                <div><span>DPS:</span> ${dps}</div>
                ${this.splashRadius > 0 ? `<div><span>Zone:</span> ${this.splashRadius}</div>` : ''}
            </div>
            ${upgradeInfo}
        `;
    }
    
    /**
     * Met à jour la position du popup d'information
     */
    updateInfoPopupPosition() {
        if (this.infoPopup) {
            // Positionner le popup au-dessus de la tour
            const popupHeight = this.infoPopup.offsetHeight;
            const popupWidth = this.infoPopup.offsetWidth;
            
            // Ajustement de position pour éviter que le popup sorte de l'écran
            let left = this.x - popupWidth / 2;
            let top = this.y - popupHeight - 20; // 20px au-dessus de la tour
            
            // Vérifier les limites du plateau de jeu
            const boardRect = this.gameBoard.getBoundingClientRect();
            
            // Ajuster horizontalement si nécessaire
            if (left < 0) {
                left = 0;
            } else if (left + popupWidth > boardRect.width) {
                left = boardRect.width - popupWidth;
            }
            
            // Ajuster verticalement si nécessaire
            if (top < 0) {
                // Si pas assez d'espace au-dessus, afficher en dessous
                top = this.y + this.size / 2 + 10;
            }
            
            this.infoPopup.style.left = `${left}px`;
            this.infoPopup.style.top = `${top}px`;
        }
    }
    
    /**
     * Met à jour la position des éléments DOM de la tour
     */
    updatePosition() {
        if (this.element) {
            this.element.style.left = `${this.x - this.size / 2}px`;
            this.element.style.top = `${this.y - this.size / 2}px`;
        }
        
        if (this.rangeElement) {
            this.rangeElement.style.left = `${this.x - this.range}px`;
            this.rangeElement.style.top = `${this.y - this.range}px`;
        }
    }
    
    /**
     * Sélectionne ou désélectionne la tour
     * @param {boolean} selected État de sélection
     */
    setSelected(selected) {
        this.selected = selected;
        
        if (this.element) {
            if (selected) {
                this.element.classList.add('selected');
                this.rangeElement.style.display = 'block';
                this.rangeElement.classList.remove('hover-range');
            } else {
                this.element.classList.remove('selected');
                this.rangeElement.style.display = 'none';
            }
        }
    }
    
    /**
     * Améliore la tour au niveau suivant
     * @returns {boolean} Vrai si l'amélioration a réussi
     */
    upgrade() {
        if (this.level >= this.maxLevel) {
            return false; // Déjà au niveau maximum
        }
        
        // Augmenter le niveau
        this.level++;
        
        // Améliorer les statistiques
        this.damage = Math.round(this.damage * this.upgradeMultiplier);
        this.range = Math.round(this.range * this.upgradeMultiplier);
        this.fireRate = +(this.fireRate * this.upgradeMultiplier).toFixed(1);
        
        if (this.splashRadius > 0) {
            this.splashRadius = Math.round(this.splashRadius * this.upgradeMultiplier);
        }
        
        // Calculer le coût de la prochaine amélioration
        if (this.level < this.maxLevel) {
            this.upgradeCost = Math.round(this.upgradeCost * 1.5);
        }
        
        // Mettre à jour l'apparence
        this.updateAppearance();
        
        // Mettre à jour les éléments visuels
        if (this.levelIndicator) {
            this.levelIndicator.textContent = this.level;
        }
        
        if (this.rangeElement) {
            this.rangeElement.style.width = `${this.range * 2}px`;
            this.rangeElement.style.height = `${this.range * 2}px`;
            this.rangeElement.style.left = `${this.x - this.range}px`;
            this.rangeElement.style.top = `${this.y - this.range}px`;
        }
        
        // Mettre à jour le popup d'information
        if (this.infoPopup) {
            this.infoPopup.innerHTML = this.getInfoHTML();
        }
        
        return true;
    }
    
    /**
     * Met à jour l'apparence de la tour en fonction de son niveau
     */
    updateAppearance() {
        if (!this.element) return;
        
        // Ajouter une bordure plus visible pour les tours de haut niveau
        const borderWidth = Math.min(this.level + 1, 4);
        this.element.style.borderWidth = `${borderWidth}px`;
        
        // Ajouter un effet de brillance plus intense selon le niveau
        const glowSize = this.level * 2;
        this.element.style.boxShadow = `0 0 ${glowSize}px ${this.color}`;
        
        // Ajuster légèrement la taille selon le niveau
        const scaleFactor = 1 + (this.level - 1) * 0.05;
        this.element.style.transform = `scale(${scaleFactor})`;
    }
    
    /**
     * Vérifie si la tour peut attaquer et attaque si possible
     * @param {Array} enemies Tableau d'ennemis
     * @param {number} currentTime Temps courant
     */
    update(enemies, currentTime) {
        // Vérifier si la tour peut tirer (cooldown)
        if (currentTime - this.lastFireTime < 1000 / this.fireRate) {
            // Même si on ne tire pas, on met quand même à jour les projectiles
            this.updateProjectiles(currentTime);
            return;
        }
        
        // Trouver un ennemi à portée
        let closestEnemy = null;
        let closestDistance = Infinity;
        
        for (const enemy of enemies) {
            if (!enemy.isAlive()) continue; // Ignorer les ennemis morts
            
            // Calcul de la distance entre la tour et l'ennemi
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= this.range && distance < closestDistance) {
                closestEnemy = enemy;
                closestDistance = distance;
            }
        }
        
        // Si un ennemi est trouvé, tirer
        if (closestEnemy) {
            this.fire(closestEnemy);
            this.lastFireTime = currentTime;
            
            // Effet visuel de tir
            this.element.style.transform = 'scale(1.1)';
            setTimeout(() => {
                if (this.element) {
                    this.element.style.transform = 'scale(1)';
                }
            }, 100);
        }
        
        // Mettre à jour tous les projectiles
        this.updateProjectiles(currentTime);
    }
    
    /**
     * Met à jour tous les projectiles de cette tour
     * @param {number} currentTime Temps courant pour le calcul précis des déplacements
     */
    updateProjectiles(currentTime) {
        // Calculer deltaTime (si c'est le premier appel, utiliser une petite valeur par défaut)
        if (!this.lastProjectileUpdateTime) {
            this.lastProjectileUpdateTime = currentTime - 16; // 16ms = environ 60fps
        }
        
        const deltaTime = (currentTime - this.lastProjectileUpdateTime) / 1000; // Convertir en secondes
        this.lastProjectileUpdateTime = currentTime;
        
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            const hitTarget = projectile.update(deltaTime);
            
            // Si le projectile a touché sa cible ou a été supprimé
            if (hitTarget) {
                this.projectiles.splice(i, 1);
            }
        }
    }
    
    /**
     * Tire un projectile vers un ennemi
     * @param {Enemy} enemy Ennemi ciblé
     */
    fire(enemy) {
        const projectile = new Projectile(
            this.x,
            this.y,
            enemy,
            this.damage,
            this.projectileColor,
            this.projectileSpeed,
            this.gameBoard,
            this.splashRadius,
            this.splashDamagePercent,
            this.level // Transmettre le niveau au projectile
        );
        
        this.projectiles.push(projectile);
    }
    
    /**
     * Supprime la tour et ses éléments DOM
     */
    remove() {
        if (this.element) {
            this.element.remove();
        }
        
        if (this.rangeElement) {
            this.rangeElement.remove();
        }
        
        if (this.infoPopup) {
            this.infoPopup.remove();
        }
        
        // Supprimer tous les projectiles associés
        for (const projectile of this.projectiles) {
            projectile.remove();
        }
        
        this.projectiles = [];
    }
}