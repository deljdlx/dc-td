class Enemy {
    /**
     * Crée un nouvel ennemi
     * @param {Object} config Configuration de l'ennemi
     * @param {Array} path Chemin à suivre
     * @param {HTMLElement} gameBoard Élément conteneur du jeu
     */
    constructor(config, path, gameBoard) {
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
        this.gameBoard = gameBoard;
        this.pathIndex = 0;
        this.x = path[0].x;
        this.y = path[0].y;
        this.dead = false;
        this.reachedEnd = false;
        
        // Éléments DOM
        this.element = null;
        this.healthBarElement = null;
        this.healthBarFillElement = null;
        
        this.createDOMElements();
    }
    
    /**
     * Crée les éléments DOM pour l'ennemi
     */
    createDOMElements() {
        // Créer l'élément de l'ennemi
        this.element = document.createElement('div');
        this.element.className = 'enemy';
        this.element.id = `enemy-${this.id}`;
        this.element.style.width = `${this.size}px`;
        this.element.style.height = `${this.size}px`;
        this.element.style.backgroundColor = this.color;
        
        // Stocker une référence à l'instance dans l'élément DOM pour l'accès depuis les projectiles
        this.element.__enemy_instance = this;
        
        // Créer la barre de vie
        this.healthBarElement = document.createElement('div');
        this.healthBarElement.className = 'health-bar';
        this.healthBarElement.style.width = `${this.size}px`;
        
        this.healthBarFillElement = document.createElement('div');
        this.healthBarFillElement.className = 'health-bar-fill';
        this.healthBarFillElement.style.width = '100%';
        
        this.healthBarElement.appendChild(this.healthBarFillElement);
        this.element.appendChild(this.healthBarElement);
        
        // Positionner l'ennemi
        this.updatePosition();
        
        // Ajouter l'élément au jeu
        this.gameBoard.appendChild(this.element);
    }
    
    /**
     * Met à jour la position de l'élément DOM
     */
    updatePosition() {
        if (this.element) {
            this.element.style.left = `${this.x - this.size / 2}px`;
            this.element.style.top = `${this.y - this.size / 2}px`;
        }
    }
    
    /**
     * Met à jour la barre de vie
     */
    updateHealthBar() {
        if (this.healthBarFillElement) {
            const healthPercentage = (this.health / this.maxHealth) * 100;
            this.healthBarFillElement.style.width = `${healthPercentage}%`;
        }
    }
    
    /**
     * Met à jour la position de l'ennemi
     * @param {number} deltaTime Temps écoulé depuis la dernière mise à jour
     * @returns {boolean} Vrai si l'ennemi a atteint la fin du chemin
     */
    update(deltaTime) {
        if (this.dead || this.reachedEnd) {
            return false;
        }
        
        // Si l'ennemi a atteint la fin du chemin
        if (this.pathIndex >= this.path.length - 1) {
            this.reachedEnd = true;
            return true;
        }
        
        // Déplacer l'ennemi vers le prochain point du chemin
        const targetPoint = this.path[this.pathIndex + 1];
        const dx = targetPoint.x - this.x;
        const dy = targetPoint.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.speed) {
            // L'ennemi a atteint le point, passer au suivant
            this.pathIndex++;
            return false;
        }
        
        // Déplacer l'ennemi vers le point
        const vx = (dx / distance) * this.speed;
        const vy = (dy / distance) * this.speed;
        this.x += vx;
        this.y += vy;
        
        // Mettre à jour la position de l'élément DOM
        this.updatePosition();
        
        return false;
    }
    
    /**
     * Inflige des dégâts à l'ennemi
     * @param {number} damage Quantité de dégâts
     * @returns {boolean} Vrai si l'ennemi est mort
     */
    takeDamage(damage) {
        this.health -= damage;
        this.updateHealthBar();
        
        if (this.health <= 0 && !this.dead) {
            this.dead = true;
            this.element.style.opacity = '0';
            
            // Ajouter une animation de mort
            this.element.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
            this.element.style.transform = 'scale(0.5)';
            
            // Supprimer l'élément après l'animation
            setTimeout(() => {
                this.remove();
            }, 300);
            
            return true;
        }
        return false;
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
     * Supprime l'ennemi et ses éléments DOM
     */
    remove() {
        if (this.element) {
            this.element.remove();
        }
    }
}