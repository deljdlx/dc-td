import { ModelTower } from './models/ModelTower.js';
import { Projectile } from './Projectile.js';
import { TowerInfoPopup } from './TowerInfoPopup.js';

/**
 * Classe responsable de l'affichage et de l'interaction d'une tour
 * Utilise un modèle pour les données et la logique métier
 */
export class Tower {
    /**
     * Crée une nouvelle tour
     * @param {Object} config Configuration de la tour
     * @param {number} x Position X de la tour
     * @param {number} y Position Y de la tour
     * @param {HTMLElement} gameBoard Élément conteneur du jeu
     * @param {number} cellSize Taille d'une cellule
     */
    constructor(config, x, y, gameBoard, cellSize) {
        // Créer le modèle de la tour
        this.model = new ModelTower(config, x, y);
        
        // Propriétés d'affichage
        this.gameBoard = gameBoard;
        this.cellSize = cellSize;
        this.size = cellSize * 0.7;
        this.selected = false;
        this.projectiles = [];
        
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

        this.element.classList.add('tower', this.model.type);

        this.element.id = `tower-${this.model.id}`;
        this.element.style.width = `${this.size}px`;
        this.element.style.height = `${this.size}px`;
        this.element.style.backgroundColor = this.model.color;
        this.updatePosition();
        
        this.element.dataset.towerId = this.model.id;
        this.element.dataset.towerType = this.model.type;
        
        // Créer l'indicateur de niveau
        this.levelIndicator = document.createElement('div');
        this.levelIndicator.className = 'tower-level';
        this.levelIndicator.textContent = this.model.level;
        this.element.appendChild(this.levelIndicator);
        
        // Créer l'élément de portée
        this.rangeElement = document.createElement('div');
        this.rangeElement.className = 'tower-range';
        this.rangeElement.style.width = `${this.model.range * 2}px`;
        this.rangeElement.style.height = `${this.model.range * 2}px`;
        this.rangeElement.style.left = `${this.model.x - this.model.range}px`;
        this.rangeElement.style.top = `${this.model.y - this.model.range}px`;
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
            this.element.style.left = `${this.model.x - this.size / 2}px`;
            this.element.style.top = `${this.model.y - this.size / 2}px`;
        }
        
        if (this.rangeElement) {
            this.rangeElement.style.left = `${this.model.x - this.model.range}px`;
            this.rangeElement.style.top = `${this.model.y - this.model.range}px`;
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
        // Déléguer l'amélioration au modèle
        const upgraded = this.model.upgrade();
        
        // Si l'amélioration a réussi, mettre à jour l'interface
        if (upgraded) {
            // Mettre à jour l'apparence
            this.updateAppearance();
            
            // Mettre à jour l'indicateur de niveau
            if (this.levelIndicator) {
                this.levelIndicator.textContent = this.model.level;
            }
            
            // Mettre à jour l'élément de portée
            if (this.rangeElement) {
                this.rangeElement.style.width = `${this.model.range * 2}px`;
                this.rangeElement.style.height = `${this.model.range * 2}px`;
                this.rangeElement.style.left = `${this.model.x - this.model.range}px`;
                this.rangeElement.style.top = `${this.model.y - this.model.range}px`;
            }
            
            // Mettre à jour le popup d'information
            if (this.infoPopup) {
                this.infoPopup.update();
            }
        }
        
        return upgraded;
    }
    
    /**
     * Met à jour l'apparence de la tour en fonction de son niveau
     */
    updateAppearance() {
        if (!this.element) return;
        
        const borderWidth = Math.min(this.model.level + 1, 4);
        this.element.style.borderWidth = `${borderWidth}px`;
        
        const glowSize = this.model.level * 2;
        this.element.style.boxShadow = `0 0 ${glowSize}px ${this.model.color}`;
        
        const scaleFactor = 1 + (this.model.level - 1) * 0.05;
        this.element.style.transform = `scale(${scaleFactor})`;
    }
    
    /**
     * Vérifie si la tour peut attaquer et attaque si possible
     */
    update(enemies, currentTime, deltaTime) {
        // Demander au modèle s'il peut attaquer et qui cibler
        const targetEnemy = this.model.canAttack(enemies, currentTime);
        
        // Si un ennemi est trouvé, tirer
        if (targetEnemy) {
            this.fire(targetEnemy);
            this.model.recordAttack(currentTime);
            
            // Effet visuel de tir
            this.element.style.transform = `scale(${1 + (this.model.level - 1) * 0.05 + 0.1})`;
            setTimeout(() => {
                if (this.element) {
                    const scaleFactor = 1 + (this.model.level - 1) * 0.05;
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
        // Utiliser le modèle pour calculer les angles des projectiles
        const projectilesInfo = this.model.calculateProjectileAngles(enemy);
        
        // Créer les projectiles
        for (const projectileInfo of projectilesInfo) {
            const projectile = new Projectile(
                this.model.x + projectileInfo.offsetX,
                this.model.y + projectileInfo.offsetY,
                enemy,
                this.model.damage,
                this.model.projectileColor,
                this.model.projectileSpeed,
                this.gameBoard,
                this.model.splashRadius,
                this.model.splashDamagePercent,
                this.model.level
            );
            
            this.projectiles.push(projectile);
        }
    }
    
    /**
     * Déplace la tour à une nouvelle position
     */
    moveTo(x, y) {
        this.model.moveTo(x, y);
        this.updatePosition();
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
    
    // Getters pour accéder aux propriétés du modèle
    // Ces getters permettent de garder compatibilité avec le reste du code qui utilise cette classe
    get id() { return this.model.id; }
    get type() { return this.model.type; }
    get name() { return this.model.name; }
    get damage() { return this.model.damage; }
    get range() { return this.model.range; }
    get fireRate() { return this.model.fireRate; }
    get cost() { return this.model.cost; }
    get color() { return this.model.color; }
    get projectileColor() { return this.model.projectileColor; }
    get projectileSpeed() { return this.model.projectileSpeed; }
    get splashRadius() { return this.model.splashRadius; }
    get splashDamagePercent() { return this.model.splashDamagePercent; }
    get multiShot() { return this.model.multiShot; }
    get multiShotAngle() { return this.model.multiShotAngle; }
    get x() { return this.model.x; }
    get y() { return this.model.y; }
    get level() { return this.model.level; }
    get maxLevel() { return this.model.maxLevel; }
    get upgradeMultiplier() { return this.model.upgradeMultiplier; }
    get upgradeCost() { return this.model.upgradeCost; }
    
    // Setters pour maintenir la compatibilité
    set x(value) { this.model.x = value; this.updatePosition(); }
    set y(value) { this.model.y = value; this.updatePosition(); }
}