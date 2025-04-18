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
        this.splashRadius = config.splashRadius || 0;
        this.splashDamagePercent = config.splashDamagePercent || 100;
        this.multiShot = config.multiShot || 1;
        this.multiShotAngle = config.multiShotAngle || 0;
        
        this.x = x;
        this.y = y;
        this.gameBoard = gameBoard;
        this.cellSize = cellSize;
        this.size = cellSize * 0.7;
        
        this.lastFireTime = 0;
        this.projectiles = [];
        this.selected = false;
        
        // Système de niveau
        this.level = 1;
        this.maxLevel = 3;
        this.upgradeMultiplier = config.upgradeMultiplier || 1.5;
        this.upgradeCost = Math.round(this.cost * 0.75);
        
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
        
        this.element.dataset.towerId = this.id;
        this.element.dataset.towerType = this.type;
        
        // Créer l'indicateur de niveau
        this.levelIndicator = document.createElement('div');
        this.levelIndicator.className = 'tower-level';
        this.levelIndicator.textContent = this.level;
        this.element.appendChild(this.levelIndicator);
        
        // Créer l'élément de portée
        this.rangeElement = document.createElement('div');
        this.rangeElement.className = 'tower-range';
        this.rangeElement.style.width = `${this.range * 2}px`;
        this.rangeElement.style.height = `${this.range * 2}px`;
        this.rangeElement.style.left = `${this.x - this.range}px`;
        this.rangeElement.style.top = `${this.y - this.range}px`;
        this.rangeElement.style.display = 'none';
        
        // Créer le popup d'information
        this.infoPopup = new TowerInfoPopup(this, this.gameBoard);
        
        // Ajouter des écouteurs d'événements
        this.element.addEventListener('mouseenter', () => {
            if (!this.selected) {
                this.rangeElement.style.display = 'block';
                this.rangeElement.classList.add('hover-range');
            }
            this.infoPopup.show();
        });
        
        this.element.addEventListener('mouseleave', () => {
            if (!this.selected) {
                this.rangeElement.style.display = 'none';
                this.rangeElement.classList.remove('hover-range');
            }
            this.infoPopup.hide();
        });
        
        // Ajouter les éléments au jeu
        this.gameBoard.appendChild(this.element);
        this.gameBoard.appendChild(this.rangeElement);
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
            return false;
        }
        
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
        
        if (this.infoPopup) {
            this.infoPopup.update();
        }
        
        return true;
    }
    
    /**
     * Met à jour l'apparence de la tour en fonction de son niveau
     */
    updateAppearance() {
        if (!this.element) return;
        
        const borderWidth = Math.min(this.level + 1, 4);
        this.element.style.borderWidth = `${borderWidth}px`;
        
        const glowSize = this.level * 2;
        this.element.style.boxShadow = `0 0 ${glowSize}px ${this.color}`;
        
        const scaleFactor = 1 + (this.level - 1) * 0.05;
        this.element.style.transform = `scale(${scaleFactor})`;
    }
    
    /**
     * Vérifie si la tour peut attaquer et attaque si possible
     */
    update(enemies, currentTime, deltaTime) {
        // Vérifier si la tour peut tirer (cooldown)
        if (currentTime - this.lastFireTime < 1000 / this.fireRate) {
            this.updateProjectiles(deltaTime);
            return;
        }
        
        // Trouver un ennemi à portée
        let closestEnemy = null;
        let closestDistance = Infinity;
        
        for (const enemy of enemies) {
            if (!enemy.isAlive()) continue;
            
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
            this.element.style.transform = `scale(${1 + (this.level - 1) * 0.05 + 0.1})`;
            setTimeout(() => {
                if (this.element) {
                    const scaleFactor = 1 + (this.level - 1) * 0.05;
                    this.element.style.transform = `scale(${scaleFactor})`;
                }
            }, 100);
        }
        
        this.updateProjectiles(deltaTime);
    }
    
    /**
     * Met à jour tous les projectiles de cette tour
     */
    updateProjectiles(deltaTime) {
        if (this.projectiles.length === 0) return;
        
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            const hitTarget = projectile.update(deltaTime);

            if (hitTarget || projectile.toRemove) {
                this.projectiles.splice(i, 1);
            }
        }
    }
    
    /**
     * Tire un ou plusieurs projectiles vers un ennemi
     */
    fire(enemy) {
        // Calculer l'angle de base entre la tour et l'ennemi
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const baseAngle = Math.atan2(dy, dx);
        
        // Nombre de projectiles à tirer (augmente avec le niveau)
        const totalProjectiles = this.multiShot + Math.floor((this.level - 1) / 2);
        const totalAngle = this.multiShotAngle * (totalProjectiles - 1);
        
        // Tirer les projectiles en éventail
        for (let i = 0; i < totalProjectiles; i++) {
            let angle;
            if (totalProjectiles === 1) {
                angle = baseAngle;
            } else {
                angle = baseAngle - (totalAngle / 2) * (Math.PI / 180) + (this.multiShotAngle * i) * (Math.PI / 180);
            }
            
            // Décalage pour éviter la superposition
            const offsetX = Math.cos(angle) * 5;
            const offsetY = Math.sin(angle) * 5;

            // Créer le projectile
            const projectile = new Projectile(
                this.x + offsetX,
                this.y + offsetY,
                enemy,
                this.damage,
                this.projectileColor,
                this.projectileSpeed,
                this.gameBoard,
                this.splashRadius,
                this.splashDamagePercent,
                this.level
            );
            
            this.projectiles.push(projectile);
        }
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