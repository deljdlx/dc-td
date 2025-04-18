/**
 * Classe représentant le modèle d'une tour, contenant les données et la logique métier
 */
class ModelTower {
    /**
     * Crée un nouveau modèle de tour
     * @param {Object} config Configuration de la tour
     * @param {number} x Position X de la tour
     * @param {number} y Position Y de la tour
     */
    constructor(config, x, y) {
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
        this.lastFireTime = 0;
        this.projectiles = [];
        
        // Système de niveau
        this.level = 1;
        this.maxLevel = 3;
        this.upgradeMultiplier = config.upgradeMultiplier || 1.5;
        this.upgradeCost = Math.round(this.cost * 0.75);
    }
    
    /**
     * Déplace la tour vers une nouvelle position
     * @param {number} x Nouvelle position X
     * @param {number} y Nouvelle position Y
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
        
        return true;
    }
    
    /**
     * Vérifie si la tour peut attaquer et renvoie l'ennemi à cibler
     * @param {Array} enemies Liste des ennemis
     * @param {number} currentTime Temps actuel en millisecondes
     * @returns {Object|null} L'ennemi ciblé ou null
     */
    canAttack(enemies, currentTime) {
        // Vérifier si la tour peut tirer (cooldown)
        if (currentTime - this.lastFireTime < 1000 / this.fireRate) {
            return null;
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
        
        return closestEnemy;
    }
    
    /**
     * Calcule les angles pour les projectiles
     * @param {Object} enemy L'ennemi ciblé
     * @returns {Array} Liste des angles et offsets pour chaque projectile
     */
    calculateProjectileAngles(enemy) {
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const baseAngle = Math.atan2(dy, dx);
        
        // Nombre de projectiles à tirer (augmente avec le niveau)
        const totalProjectiles = this.multiShot + Math.floor((this.level - 1) / 2);
        const totalAngle = this.multiShotAngle * (totalProjectiles - 1);
        
        const projectilesInfo = [];
        
        // Calculer les angles pour chaque projectile
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
            
            projectilesInfo.push({
                angle: angle,
                offsetX: offsetX,
                offsetY: offsetY
            });
        }
        
        return projectilesInfo;
    }
    
    /**
     * Met à jour l'état des projectiles
     * @param {number} deltaTime Temps écoulé depuis la dernière mise à jour en ms
     * @returns {Array} Liste des projectiles à supprimer (index)
     */
    updateProjectiles(deltaTime) {
        if (this.projectiles.length === 0) return [];
        
        const projectilesToRemove = [];
        
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            const hitTarget = projectile.update(deltaTime);

            if (hitTarget || projectile.toRemove) {
                projectilesToRemove.push(i);
            }
        }
        
        return projectilesToRemove;
    }
    
    /**
     * Enregistre le moment où la tour a tiré
     * @param {number} currentTime Temps actuel
     */
    recordAttack(currentTime) {
        this.lastFireTime = currentTime;
    }
}