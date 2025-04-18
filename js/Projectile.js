class Projectile {
    /**
     * Crée un nouveau projectile
     * @param {number} x Position X de départ
     * @param {number} y Position Y de départ
     * @param {Enemy} target Ennemi ciblé
     * @param {number} damage Dégâts infligés
     * @param {string} color Couleur du projectile
     * @param {number} speed Vitesse du projectile
     * @param {HTMLElement} gameBoard Élément conteneur du jeu
     * @param {number} splashRadius Rayon des dégâts de zone (0 = pas de splash)
     * @param {number} splashDamagePercent Pourcentage des dégâts en zone
     * @param {number} level Niveau du projectile (hérité de la tour)
     */
    constructor(x, y, target, damage, color, speed, gameBoard, splashRadius = 0, splashDamagePercent = 100, level = 1) {
        this.id = Utils.generateId();
        this.x = x;
        this.y = y;
        this.target = target;
        this.damage = damage;
        this.color = color;
        this.speed = speed;
        this.gameBoard = gameBoard;
        this.splashRadius = splashRadius;
        this.splashDamagePercent = splashDamagePercent;
        this.level = level; // Niveau du projectile (hérité de la tour)
        
        this.size = 6 + (level - 1) * 2; // Taille du projectile augmente avec le niveau
        this.hit = false;
        this.toRemove = false;
        
        this.element = document.createElement('div');
        this.element.className = 'projectile';
        this.element.id = `projectile-${this.id}`;
        this.element.style.width = `${this.size}px`;
        this.element.style.height = `${this.size}px`;
        this.element.style.backgroundColor = this.color;
        this.element.style.left = `${this.x - this.size / 2}px`;
        this.element.style.top = `${this.y - this.size / 2}px`;
        
        // Ajouter un effet visuel selon le niveau
        if (level > 1) {
            // Ajouter une bordure brillante pour les niveaux supérieurs
            const glowSize = level * 1.5;
            this.element.style.boxShadow = `0 0 ${glowSize}px ${this.color}`;
            
            // Ajouter une traînée pour les niveaux supérieurs
            if (level >= 3) {
                this.element.classList.add('projectile-trail');
            }
        }
        
        this.gameBoard.appendChild(this.element);
    }


    /**
     * Met à jour la position du projectile
     * @param {number} deltaTime Temps écoulé depuis la dernière mise à jour en ms
     * @returns {boolean} Vrai si le projectile a touché sa cible
     */
    update(deltaTime) {
        // Si le projectile a déjà touché, doit être supprimé, ou la cible n'existe plus
        if (this.hit || this.toRemove || !this.target || (this.target.dead || !this.target.isAlive())) {
            this.remove();
            return false;
        }
        
        let dx, dy, distance;
        

        // Comportement normal: suivre la cible
        dx = this.target.x - this.x;
        dy = this.target.y - this.y;
        distance = Math.sqrt(dx * dx + dy * dy);

        this.target.element.style.border = '2px solid red'; // Indiquer la cible avec une bordure rouge

        // Normaliser la direction pour avoir un vecteur unitaire
        if (distance > 0) { // Éviter la division par zéro
            dx = dx / distance;
            dy = dy / distance;
        }


        // Si le projectile est suffisamment proche de la cible (collision)
        // Utiliser le rayon de l'ennemi comme référence principale
        const hitDistance = this.target.size / 2;
        console.log(distance);

        // Vérifier si le projectile a touché l'ennemi
        if (distance <= hitDistance) {
            this.hit = true;

            // Appliquer les dégâts à la cible principale
            this.target.takeDamage(this.damage, this.level);

            // Ajouter un effet d'impact selon le niveau
            this.createImpactEffect();

            // Si le projectile a des dégâts de zone
            if (this.splashRadius > 0) {
                this.applySplashDamage();
            }

            // Retarder légèrement la suppression du projectile pour que l'effet visuel soit visible
            setTimeout(() => {
                this.remove();
            }, 50);

            return true;
        }

        // Convertir deltaTime en secondes (car il est en millisecondes)
        const deltaTimeInSeconds = deltaTime / 1000;
        
        // Calculer la distance totale à parcourir durant cette frame
        const distanceToMove = this.speed * deltaTimeInSeconds;
        
        // Appliquer le mouvement en préservant la direction mais en assurant une vitesse constante
        // quelle que soit la direction (diagonale ou axiale)
        this.x += dx * distanceToMove;
        this.y += dy * distanceToMove;
        
        // Mettre à jour la position visuelle
        this.element.style.left = `${this.x - this.size / 2}px`;
        this.element.style.top = `${this.y - this.size / 2}px`;
        
        // Vérifier si le projectile est sorti des limites du jeu
        const gameWidth = this.gameBoard.clientWidth;
        const gameHeight = this.gameBoard.clientHeight;
        
        if (this.x < -50 || this.x > gameWidth + 50 || this.y < -50 || this.y > gameHeight + 50) {
            this.remove();
            return true;
        }
        
        return false;
    }
    
    /**
     * Crée un effet visuel d'impact lorsque le projectile touche sa cible
     */
    createImpactEffect() {
        // Créer un élément pour l'effet d'impact
        const impact = document.createElement('div');
        impact.className = 'impact-effect';
        
        // Personnaliser l'effet selon le niveau
        const size = 20 + (this.level - 1) * 10;
        const duration = 300 + (this.level - 1) * 100;
        
        impact.style.width = `${size}px`;
        impact.style.height = `${size}px`;
        impact.style.left = `${this.target.x}px`;
        impact.style.top = `${this.target.y}px`;
        impact.style.backgroundColor = this.color;
        impact.style.opacity = '0.7';
        
        // Ajouter l'élément au jeu
        this.gameBoard.appendChild(impact);
        
        // Créer des particules d'explosion
        this.createExplosionParticles(this.target.x, this.target.y, 8 + this.level * 2);
        
        // Animer l'effet et le supprimer
        setTimeout(() => {
            if (impact.parentNode) {
                impact.parentNode.removeChild(impact);
            }
        }, duration);
    }
    
    /**
     * Crée des particules d'explosion à partir d'un point
     * @param {number} x Position X du centre de l'explosion
     * @param {number} y Position Y du centre de l'explosion
     * @param {number} count Nombre de particules à générer
     */
    createExplosionParticles(x, y, count) {
        for (let i = 0; i < count; i++) {
            // Créer une particule
            const particle = document.createElement('div');
            particle.className = 'explosion-particle';
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            particle.style.color = this.color;
            
            // Direction aléatoire pour chaque particule
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 30 * this.level;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            // Définir la direction de l'animation via CSS variables
            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);
            
            // Ajouter au DOM
            this.gameBoard.appendChild(particle);
            
            // Supprimer après l'animation
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 600);
        }
    }
    
    /**
     * Applique les dégâts de zone autour de la cible principale
     */
    applySplashDamage() {
        // Si l'instance de jeu n'est pas disponible, ne rien faire
        if (!window.gameInstance || !window.gameInstance.enemies) {
            return;
        }
        
        // Utiliser directement la liste des ennemis de l'instance du jeu au lieu du DOM
        for (const enemy of window.gameInstance.enemies) {
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
                
                // Appliquer les dégâts à l'ennemi
                enemy.takeDamage(splashDamage, this.level);
                
                // Créer une ligne d'effet de splash visible
                this.createSplashLine(this.target.x, this.target.y, enemy.x, enemy.y);
            }
        }
    }
    
    /**
     * Crée une ligne visuelle pour montrer l'effet de splash entre deux points
     * @param {number} x1 Position X du point d'impact
     * @param {number} y1 Position Y du point d'impact
     * @param {number} x2 Position X de l'ennemi touché
     * @param {number} y2 Position Y de l'ennemi touché
     */
    createSplashLine(x1, y1, x2, y2) {
        // Calculer la longueur et l'angle de la ligne
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        // Créer l'élément de ligne
        const line = document.createElement('div');
        line.className = 'splash-line';
        line.style.width = `${length}px`;
        line.style.left = `${x1}px`;
        line.style.top = `${y1}px`;
        line.style.transform = `rotate(${angle}deg)`;
        line.style.backgroundColor = this.color;
        
        // Personnaliser selon le niveau
        line.style.height = `${2 + this.level}px`;
        line.style.opacity = '0.6';
        
        // Ajouter l'élément au jeu
        this.gameBoard.appendChild(line);
        
        // Animer et supprimer
        setTimeout(() => {
            line.style.opacity = '0';
        }, 50);
        
        setTimeout(() => {
            if (line.parentNode) {
                line.parentNode.removeChild(line);
            }
        }, 300);
    }
    
    /**
     * Supprime le projectile et son élément DOM
     */
    remove() {
        this.toRemove = true;
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}