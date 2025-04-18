/**
 * Classe responsable de l'affichage et de l'interaction d'un ennemi
 * Utilise un modèle pour les données et la logique métier
 */
class Enemy {
    /**
     * Crée un nouvel ennemi
     * @param {Object} config Configuration de l'ennemi
     * @param {Array} path Chemin à suivre
     * @param {HTMLElement} gameBoard Élément conteneur du jeu
     */
    constructor(config, path, gameBoard) {
        // Créer le modèle d'ennemi
        this.model = new ModelEnemy(config, path);
        
        // Propriétés d'affichage
        this.gameBoard = gameBoard;
        
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
        this.element.id = `enemy-${this.model.id}`;
        this.element.style.width = `${this.model.size}px`;
        this.element.style.height = `${this.model.size}px`;
        this.element.style.backgroundColor = this.model.color;
        
        // Stocker une référence à l'instance dans l'élément DOM pour l'accès depuis les projectiles
        this.element.__enemy_instance = this;
        
        // Créer la barre de vie
        this.healthBarElement = document.createElement('div');
        this.healthBarElement.className = 'health-bar';
        this.healthBarElement.style.width = `${this.model.size}px`;
        
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
            this.element.style.left = `${this.model.x - this.model.size / 2}px`;
            this.element.style.top = `${this.model.y - this.model.size / 2}px`;
        }
    }
    
    /**
     * Met à jour la barre de vie
     * @param {number} healthPercentage Pourcentage de santé (0-100)
     */
    updateHealthBar(healthPercentage) {
        if (this.healthBarFillElement) {
            this.healthBarFillElement.style.width = `${healthPercentage}%`;
        }
    }
    
    /**
     * Met à jour la position de l'ennemi
     * @param {number} deltaTime Temps écoulé depuis la dernière mise à jour
     * @returns {boolean} Vrai si l'ennemi a atteint la fin du chemin
     */
    update(deltaTime) {
        // Utiliser le modèle pour calculer le mouvement
        const movement = this.model.calculateMovement(deltaTime);
        
        // Mettre à jour la position visuelle si l'ennemi a bougé
        if (movement.moved) {
            this.updatePosition();
        }
        
        // Retourner vrai si l'ennemi a atteint la fin du chemin
        return movement.reachedEnd;
    }
    
    /**
     * Inflige des dégâts à l'ennemi
     * @param {number} damage Quantité de dégâts
     * @param {number} level Niveau de la tour qui inflige les dégâts (optionnel)
     * @returns {boolean} Vrai si l'ennemi est mort
     */
    takeDamage(damage, level = 1) {
        // Utiliser le modèle pour appliquer les dégâts
        const healthInfo = this.model.takeDamage(damage);
        
        // Mettre à jour la barre de vie
        this.updateHealthBar(healthInfo.healthPercentage);
        
        // Si l'ennemi est mort, jouer l'animation de mort
        if (healthInfo.died) {
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
        return this.model.isAlive();
    }
    
    /**
     * Vérifie si l'ennemi a atteint la fin du chemin
     * @returns {boolean} Vrai si l'ennemi a atteint la fin
     */
    hasReachedEnd() {
        return this.model.hasReachedEnd();
    }
    
    /**
     * Supprime l'ennemi et ses éléments DOM
     */
    remove() {
        if (this.element) {
            this.element.remove();
        }
    }
    
    // Getters pour accéder aux propriétés du modèle
    get id() { return this.model.id; }
    get type() { return this.model.type; }
    get name() { return this.model.name; }
    get health() { return this.model.health; }
    get maxHealth() { return this.model.maxHealth; }
    get speed() { return this.model.speed; }
    get reward() { return this.model.reward; }
    get damage() { return this.model.damage; }
    get color() { return this.model.color; }
    get size() { return this.model.size; }
    get x() { return this.model.x; }
    get y() { return this.model.y; }
    get dead() { return this.model.dead; }
    get reachedEnd() { return this.model.reachedEnd; }
    
    // Pour la compatibilité avec les classes existantes
    get originalEnemy() { return null; }
}