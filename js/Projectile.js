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
        this.level = level;
        
        this.size = 6 + (level - 1) * 2;
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
            const glowSize = level * 1.5;
            this.element.style.boxShadow = `0 0 ${glowSize}px ${this.color}`;
            
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
        if (this.hit || this.toRemove || !this.target || !this.target.isAlive()) {
            this.remove();
            return true;
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
            // Placer le projectile au bord de la cible pour un impact visuel cohérent
            if (distance > hitDistance) {
                const ratio = (distance - hitDistance) / distance;
                this.x = this.x + (this.target.x - this.x) * ratio;
                this.y = this.y + (this.target.y - this.y) * ratio;
            }
            
            // Mettre à jour la position visuelle
            this.element.style.transition = 'none';
            this.element.style.left = `${this.x}px`;
            this.element.style.top = `${this.y}px`;
            
            // Déclencher la collision
            this.hit = true;
            this.target.takeDamage(this.damage, this.level);
            this.createImpactEffect();

            // Appliquer les dégâts de zone si nécessaire
            if (this.splashRadius > 0) {
                this.applySplashDamage();
            }

            // Retarder légèrement la suppression pour que l'effet visuel soit visible
            setTimeout(() => {
                this.remove();
            }, 150);

            return true;
        } else {
            // Déplacement normal
            this.x += normalizedDx * fixedDistancePerFrame;
            this.y += normalizedDy * fixedDistancePerFrame;
            
            // Désactiver la transition CSS pour éviter l'accélération
            this.element.style.transition = 'none';
            this.element.style.left = `${this.x}px`;
            this.element.style.top = `${this.y}px`;
            
            // Réactiver la transition après la mise à jour
            setTimeout(() => {
                if (this.element) {
                    this.element.style.transition = '';
                }
            }, 0);
        }

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
        
        this.gameBoard.appendChild(impact);
        this.createExplosionParticles(this.target.x, this.target.y, 8 + this.level * 2);
        
        // Supprimer l'élément après l'animation
        setTimeout(() => {
            if (impact.parentNode) {
                impact.parentNode.removeChild(impact);
            }
        }, duration);
    }
    
    /**
     * Crée des particules d'explosion à partir d'un point
     */
    createExplosionParticles(x, y, count) {
        for (let i = 0; i < count; i++) {
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
            
            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);
            
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
        // Récupérer les ennemis du jeu via game.enemies
        const enemies = this.game?.enemies || window.gameInstance?.enemies;
        
        if (!enemies || !Array.isArray(enemies)) {
            return;
        }
        
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
                
                // Appliquer les dégâts à l'ennemi
                enemy.takeDamage(splashDamage, this.level);
                
                // Créer une ligne d'effet de splash visible
                this.createSplashLine(this.target.x, this.target.y, enemy.x, enemy.y);
            }
        }
    }
    
    /**
     * Crée une ligne visuelle pour montrer l'effet de splash entre deux points
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
        line.style.height = `${2 + this.level}px`;
        line.style.opacity = '0.6';
        
        this.gameBoard.appendChild(line);
        
        // Animer et supprimer
        setTimeout(() => line.style.opacity = '0', 50);
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