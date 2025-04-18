/**
 * Modèle représentant la logique d'un ennemi
 */
class ModelEnemy {
    /**
     * Crée un nouveau modèle d'ennemi
     * @param {Object} config Configuration de l'ennemi
     * @param {Array} path Chemin à suivre
     */
    constructor(config, path) {
        this.id = Utils.generateId();
        this.type = config.id;
        this.name = config.name;
        this.maxHealth = config.health;
        this.health = config.health;
        this.speed = config.speed;
        this.reward = config.reward;
        this.damage = config.damage;
        this.color = config.color;
        this.size = config.size;
        
        this.path = path;
        this.pathIndex = 0;
        this.x = path[0].x;
        this.y = path[0].y;
        this.dead = false;
        this.reachedEnd = false;
    }
    
    /**
     * Calcule le mouvement de l'ennemi sur le chemin
     * @param {number} deltaTime Temps écoulé depuis la dernière mise à jour
     * @returns {Object} Informations sur le mouvement et l'état de l'ennemi
     */
    calculateMovement(deltaTime) {
        if (this.dead || this.reachedEnd) {
            return {
                moved: false,
                reachedEnd: this.reachedEnd,
                newX: this.x,
                newY: this.y
            };
        }
        
        // Si l'ennemi a atteint la fin du chemin
        if (this.pathIndex >= this.path.length - 1) {
            this.reachedEnd = true;
            return {
                moved: false,
                reachedEnd: true,
                newX: this.x,
                newY: this.y
            };
        }
        
        // Trouver le prochain point sur le chemin
        const targetPoint = this.path[this.pathIndex + 1];
        const dx = targetPoint.x - this.x;
        const dy = targetPoint.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.speed) {
            // L'ennemi a atteint le point, passer au suivant
            this.pathIndex++;
            return {
                moved: true,
                reachedPoint: true,
                newX: this.x,
                newY: this.y,
                nextPathIndex: this.pathIndex
            };
        }
        
        // Calculer le déplacement
        const vx = (dx / distance) * this.speed;
        const vy = (dy / distance) * this.speed;
        
        // Mettre à jour la position
        this.x += vx;
        this.y += vy;
        
        return {
            moved: true,
            reachedPoint: false,
            newX: this.x,
            newY: this.y
        };
    }
    
    /**
     * Inflige des dégâts à l'ennemi
     * @param {number} damage Quantité de dégâts
     * @returns {Object} Informations sur l'état de santé après les dégâts
     */
    takeDamage(damage) {
        // Appliquer les dégâts
        this.health -= damage;
        
        // Vérifier si l'ennemi est mort
        let died = false;
        if (this.health <= 0 && !this.dead) {
            this.health = 0;
            this.dead = true;
            died = true;
        }
        
        return {
            currentHealth: this.health,
            maxHealth: this.maxHealth,
            healthPercentage: (this.health / this.maxHealth) * 100,
            died: died
        };
    }
    
    /**
     * Vérifie si l'ennemi est encore en vie
     * @returns {boolean} Vrai si l'ennemi est en vie
     */
    isAlive() {
        return !this.dead && !this.reachedEnd;
    }
    
    /**
     * Vérifie si l'ennemi a atteint la fin du chemin
     * @returns {boolean} Vrai si l'ennemi a atteint la fin
     */
    hasReachedEnd() {
        return this.reachedEnd;
    }
    
    /**
     * Marque l'ennemi comme mort
     */
    kill() {
        this.dead = true;
    }
}