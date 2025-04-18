import { Utils } from '../Utils.js';

/**
 * Modèle représentant la logique d'une tour
 */
export class ModelTower {
    /**
     * Crée un nouveau modèle de tour
     * @param {Object} config Configuration de la tour
     * @param {number} x Position X
     * @param {number} y Position Y
     */
    constructor(config, x, y) {
        this.id = Utils.generateId();
        this.type = config.id;
        this.name = config.name;
        this.damage = config.damage;
        this.range = config.range;
        this.fireRate = config.fireRate;
        this.color = config.color;
        this.cost = config.cost;
        this.level = 1;
        this.x = x;
        this.y = y;
        this.target = null;
        this.lastFireTime = 0;
        this.upgrades = config.upgrades || [];
        
        // Valeurs par défaut pour les propriétés additionnelles
        this.projectileColor = config.projectileColor || this.color;
        this.projectileSpeed = config.projectileSpeed || 300;
        this.splashRadius = config.splashRadius || 0;
        this.splashDamagePercent = config.splashDamagePercent || 0;
        this.multiShot = config.multiShot || 1;
        this.multiShotAngle = config.multiShotAngle || 15;
        this.maxLevel = config.maxLevel || 3;
        this.upgradeMultiplier = config.upgradeMultiplier || 1.5;
    }
    
    /**
     * Détermine si la tour peut tirer
     * @param {number} timestamp Horodatage actuel
     * @returns {boolean} Vrai si la tour peut tirer
     */
    canFire(timestamp) {
        // Calculer le temps écoulé depuis le dernier tir
        const elapsedTime = timestamp - this.lastFireTime;
        
        // Calculer le délai entre les tirs en millisecondes
        const fireDelay = 1000 / this.fireRate;
        
        // Retourner vrai si suffisamment de temps s'est écoulé
        return elapsedTime >= fireDelay;
    }
    
    /**
     * Vérifie si la tour peut attaquer un ennemi et retourne l'ennemi ciblé
     * @param {Array} enemies Liste des ennemis
     * @param {number} currentTime Horodatage actuel
     * @returns {Object|null} Ennemi ciblé ou null si aucun
     */
    canAttack(enemies, currentTime) {
        // Vérifier si la tour peut tirer en fonction du taux de tir
        if (!this.canFire(currentTime)) {
            return null;
        }
        
        // Trouver une cible valide
        return this.calculateTarget(enemies);
    }
    
    /**
     * Enregistre l'heure de la dernière attaque
     * @param {number} currentTime Horodatage actuel
     */
    recordAttack(currentTime) {
        this.lastFireTime = currentTime;
    }
    
    /**
     * Calcule les angles des projectiles à tirer
     * @param {Object} enemy Ennemi ciblé
     * @returns {Array} Informations des projectiles à tirer
     */
    calculateProjectileAngles(enemy) {
        const projectiles = [];
        
        // Calculer l'angle de base vers l'ennemi
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const baseAngle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        // Pour chaque projectile à tirer
        for (let i = 0; i < this.multiShot; i++) {
            // Calcul de l'angle pour ce projectile
            let angle;
            if (this.multiShot === 1) {
                angle = baseAngle;
            } else {
                // Répartir les projectiles en éventail
                const spreadAngle = this.multiShotAngle * (i - (this.multiShot - 1) / 2);
                angle = baseAngle + spreadAngle;
            }
            
            // Convertir l'angle en radians
            const radians = angle * Math.PI / 180;
            
            // Calculer le décalage depuis le centre de la tour
            const offsetDistance = 10; // Distance du centre de la tour
            const offsetX = Math.cos(radians) * offsetDistance;
            const offsetY = Math.sin(radians) * offsetDistance;
            
            projectiles.push({
                angle: angle,
                offsetX: offsetX,
                offsetY: offsetY
            });
        }
        
        return projectiles;
    }
    
    /**
     * Calcule la cible prioritaire parmi les ennemis
     * @param {Array} enemies Liste des ennemis
     * @returns {Object|null} Ennemi ciblé ou null si aucun
     */
    calculateTarget(enemies) {
        // Filtrer les ennemis à portée
        const inRangeEnemies = enemies.filter(enemy => this.isEnemyInRange(enemy));
        
        // Si aucun ennemi n'est à portée, retourner null
        if (inRangeEnemies.length === 0) {
            return null;
        }
        
        // Prioriser l'ennemi le plus avancé dans son parcours
        inRangeEnemies.sort((a, b) => b.progressOnPath - a.progressOnPath);
        return inRangeEnemies[0];
    }
    
    /**
     * Vérifie si un ennemi est à portée
     * @param {Enemy} enemy Ennemi à vérifier
     * @returns {boolean} Vrai si l'ennemi est à portée
     */
    isEnemyInRange(enemy) {
        // Calculer la distance entre la tour et l'ennemi
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Vérifier si l'ennemi est à portée
        return distance <= this.range;
    }
    
    /**
     * Déplace la tour à une nouvelle position
     */
    moveTo(x, y) {
        this.x = x;
        this.y = y;
    }
    
    /**
     * Améliore la tour au niveau suivant
     * @returns {boolean} Vrai si l'amélioration a réussi
     */
    upgrade() {
        // Vérifier si la tour a atteint son niveau maximal
        if (this.level >= this.maxLevel) {
            return false;
        }
        
        // Si des améliorations spécifiques sont définies, les appliquer
        if (this.upgrades.length > 0 && this.level <= this.upgrades.length) {
            const upgradeConfig = this.upgrades[this.level - 1];
            
            for (const [key, value] of Object.entries(upgradeConfig)) {
                this[key] = value;
            }
        } else {
            // Amélioration générique : augmenter les statistiques de base
            this.damage *= this.upgradeMultiplier;
            this.range *= 1.2;
            this.fireRate *= 1.1;
        }
        
        // Augmenter le niveau
        this.level++;
        
        return true;
    }
    
    /**
     * Calcule le coût de la prochaine amélioration
     * @returns {number} Coût de l'amélioration ou 0 si niveau max atteint
     */
    get upgradeCost() {
        if (this.level >= this.maxLevel) {
            return 0;
        }
        
        // Formule de base pour le coût d'amélioration
        return Math.round(this.cost * Math.pow(this.upgradeMultiplier, this.level));
    }
    
    /**
     * Vérifie si une amélioration est disponible
     * @returns {boolean} Vrai si une amélioration est disponible
     */
    canUpgrade() {
        return this.level < this.maxLevel;
    }
    
    /**
     * Récupère les statistiques actuelles de la tour
     * @returns {Object} Statistiques
     */
    getStats() {
        return {
            name: this.name,
            damage: this.damage,
            range: this.range,
            fireRate: this.fireRate,
            level: this.level,
            upgradeCost: this.upgradeCost,
            canUpgrade: this.canUpgrade()
        };
    }
}