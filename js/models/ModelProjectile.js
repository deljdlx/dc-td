/**
 * Modèle représentant la logique d'un projectile
 */
class ModelProjectile {
    /**
     * Crée un nouveau modèle de projectile
     * @param {number} x Position X de départ
     * @param {number} y Position Y de départ
     * @param {Enemy} target Ennemi ciblé
     * @param {number} damage Dégâts infligés
     * @param {string} color Couleur du projectile
     * @param {number} speed Vitesse du projectile
     * @param {number} splashRadius Rayon des dégâts de zone (0 = pas de splash)
     * @param {number} splashDamagePercent Pourcentage des dégâts en zone
     * @param {number} level Niveau du projectile (hérité de la tour)
     */
    constructor(x, y, target, damage, color, speed, splashRadius = 0, splashDamagePercent = 100, level = 1) {
        this.id = Utils.generateId();
        this.x = x;
        this.y = y;
        this.target = target;
        this.damage = damage;
        this.color = color;
        this.speed = speed;
        this.splashRadius = splashRadius;
        this.splashDamagePercent = splashDamagePercent;
        this.level = level;
        
        this.hit = false;
        this.toRemove = false;
    }
    
    /**
     * Calcule le déplacement du projectile
     * @param {number} deltaTime Temps écoulé depuis la dernière mise à jour
     * @returns {Object} Informations sur le déplacement et la collision
     */
    calculateMovement(deltaTime) {
        // Si la cible n'existe plus ou le projectile a déjà touché
        if (this.hit || !this.target || !this.target.isAlive()) {
            return { 
                shouldRemove: true,
                hasHit: this.hit,
                newX: this.x,
                newY: this.y
            };
        }
        
        // Calculer la direction vers la cible
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Normaliser la direction
        const normalizedDx = distance > 0 ? dx / distance : 0;
        const normalizedDy = distance > 0 ? dy / distance : 0;
        
        // La distance de collision est le rayon de l'ennemi
        const hitDistance = this.target.size / 2;
        
        // Vitesse fixe indépendante du deltaTime pour un mouvement plus régulier
        const fixedDistancePerFrame = this.speed / 60;
        
        // Vérifier si on va atteindre la cible pendant cette frame
        if (distance <= fixedDistancePerFrame + hitDistance) {
            // Calculer la position d'impact
            let newX = this.x;
            let newY = this.y;
            
            if (distance > hitDistance) {
                // Placer le projectile au bord de la cible pour un impact visuel cohérent
                const ratio = (distance - hitDistance) / distance;
                newX = this.x + (this.target.x - this.x) * ratio;
                newY = this.y + (this.target.y - this.y) * ratio;
            }
            
            // Mise à jour de la position
            this.x = newX;
            this.y = newY;
            this.hit = true;
            
            return {
                shouldRemove: false,
                hasHit: true,
                newX: newX,
                newY: newY,
                hitTarget: this.target
            };
        } else {
            // Déplacement normal
            const newX = this.x + normalizedDx * fixedDistancePerFrame;
            const newY = this.y + normalizedDy * fixedDistancePerFrame;
            
            // Mise à jour de la position
            this.x = newX;
            this.y = newY;
            
            return {
                shouldRemove: false,
                hasHit: false,
                newX: newX,
                newY: newY
            };
        }
    }
    
    /**
     * Vérifie si le projectile est sorti des limites du jeu
     * @param {number} gameWidth Largeur du jeu
     * @param {number} gameHeight Hauteur du jeu
     * @returns {boolean} Vrai si le projectile est hors limites
     */
    isOutOfBounds(gameWidth, gameHeight) {
        return this.x < -50 || this.x > gameWidth + 50 || this.y < -50 || this.y > gameHeight + 50;
    }
    
    /**
     * Calcule les dégâts de splash aux ennemis à proximité
     * @param {Array} enemies Liste des ennemis à vérifier
     * @returns {Array} Liste des ennemis touchés avec les informations de dégâts
     */
    calculateSplashDamage(enemies) {
        if (!this.hit || this.splashRadius <= 0 || !this.target || !enemies || !Array.isArray(enemies)) {
            return [];
        }
        
        const splashTargets = [];
        
        for (const enemy of enemies) {
            // Éviter de toucher la cible principale à nouveau et ignorer les ennemis morts
            if (enemy.id === this.target.id || !enemy.isAlive()) {
                continue;
            }
            
            // Calculer la distance avec le point d'impact
            const dx = enemy.x - this.target.x;
            const dy = enemy.y - this.target.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Si l'ennemi est dans le rayon de splash
            if (distance <= this.splashRadius) {
                // Calculer les dégâts (diminuent avec la distance)
                const damagePercent = this.splashDamagePercent * (1 - distance / this.splashRadius);
                const splashDamage = Math.round(this.damage * damagePercent / 100);
                
                splashTargets.push({
                    enemy: enemy,
                    damage: splashDamage,
                    distance: distance,
                    linePoints: {
                        x1: this.target.x,
                        y1: this.target.y,
                        x2: enemy.x,
                        y2: enemy.y
                    }
                });
            }
        }
        
        return splashTargets;
    }
    
    /**
     * Marque le projectile pour suppression
     */
    markForRemoval() {
        this.toRemove = true;
    }
}