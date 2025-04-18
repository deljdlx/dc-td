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
        this.multiShot = config.multiShot || 1; // Nombre de projectiles tirés simultanément
        this.multiShotAngle = config.multiShotAngle || 0; // Angle entre les projectiles multiples
        
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
        
        // Créer le popup d'information avec la nouvelle classe
        this.infoPopup = new TowerInfoPopup(this, this.gameBoard);
        
        // Ajouter des écouteurs d'événements pour afficher la portée et le popup au survol
        this.element.addEventListener('mouseenter', () => {
            if (!this.selected) {
                this.rangeElement.style.display = 'block';
                this.rangeElement.classList.add('hover-range');
            }
            // Afficher le popup d'information
            this.infoPopup.show();
        });
        
        this.element.addEventListener('mouseleave', () => {
            if (!this.selected) {
                this.rangeElement.style.display = 'none';
                this.rangeElement.classList.remove('hover-range');
            }
            // Cacher le popup d'information
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
            this.infoPopup.update();
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
     * @param {number} deltaTime Temps écoulé depuis la dernière frame en ms
     */
    update(enemies, currentTime, deltaTime) {
        // Vérifier si la tour peut tirer (cooldown)
        if (currentTime - this.lastFireTime < 1000 / this.fireRate) {
            // Même si on ne tire pas, on met quand même à jour les projectiles
            this.updateProjectiles(currentTime, deltaTime);
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
            this.element.style.transform = `scale(${1 + (this.level - 1) * 0.05 + 0.1})`;
            setTimeout(() => {
                if (this.element) {
                    // Restaurer la transformation d'origine basée sur le niveau
                    const scaleFactor = 1 + (this.level - 1) * 0.05;
                    this.element.style.transform = `scale(${scaleFactor})`;
                }
            }, 100);
        }
        
        // Mettre à jour tous les projectiles
        this.updateProjectiles(currentTime, deltaTime);
    }
    
    /**
     * Met à jour tous les projectiles de cette tour
     * @param {number} currentTime Temps courant pour les animations
     * @param {number} deltaTime Temps écoulé depuis la dernière frame en ms
     */
    updateProjectiles(currentTime, deltaTime) {
        // Si la liste de projectiles est vide, rien à faire
        if (this.projectiles.length === 0) return;
        
        // Parcours des projectiles en sens inverse pour pouvoir supprimer en toute sécurité
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            // Appeler update avec deltaTime pour un mouvement fluide
            const hitTarget = projectile.update(deltaTime);

            // Si le projectile a touché sa cible ou a été supprimé
            if (hitTarget || projectile.toRemove) {
                this.projectiles.splice(i, 1);
            }
        }
    }
    
    /**
     * Tire un ou plusieurs projectiles vers un ennemi
     * @param {Enemy} enemy Ennemi ciblé
     */
    fire(enemy) {
        // Calculer l'angle de base entre la tour et l'ennemi
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const baseAngle = Math.atan2(dy, dx);
        
        // Déterminer le nombre total de projectiles à tirer
        const totalProjectiles = this.multiShot + Math.floor((this.level - 1) / 2); // Le niveau augmente le nombre de projectiles
        
        // Calculer l'angle total couvert par les projectiles
        const totalAngle = this.multiShotAngle * (totalProjectiles - 1);
        
        // Tirer les projectiles en éventail
        for (let i = 0; i < totalProjectiles; i++) {
            // Calculer l'angle de chaque projectile
            let angle;
            if (totalProjectiles === 1) {
                angle = baseAngle; // Un seul projectile, tir direct
            } else {
                // Répartir les angles uniformément
                angle = baseAngle - (totalAngle / 2) * (Math.PI / 180) + (this.multiShotAngle * i) * (Math.PI / 180);
            }
            
            // Calculer les coordonnées initiales (légèrement décalées pour éviter la superposition)
            const offsetX = Math.cos(angle) * 5;
            const offsetY = Math.sin(angle) * 5;
            
            // Créer l'objet de cible directionnelle (pour que le projectile suive une trajectoire en ligne droite)
            const directionalTarget = {
                x: enemy.x, // Position x de l'ennemi
                y: enemy.y, // Position y de l'ennemi
                size: enemy.size, // Taille de l'ennemi
                isAlive: () => enemy.isAlive(), // Méthode pour vérifier si l'ennemi est en vie
                takeDamage: (damage, level) => enemy.takeDamage(damage, level), // Méthode pour appliquer les dégâts
                dead: enemy.dead, // État de l'ennemi
                id: enemy.id, // ID de l'ennemi
                // Propriétés supplémentaires pour le tir directionnel
                directionAngle: angle,
                isDirectional: i !== Math.floor(totalProjectiles / 2) // Le projectile central suit l'ennemi, les autres vont en ligne droite
            };
            
            // Créer le projectile avec la cible directionnelle
            const projectile = new Projectile(
                this.x + offsetX,
                this.y + offsetY,
                enemy,
                // directionalTarget,
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