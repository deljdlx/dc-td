import { ModelProjectile } from './models/ModelProjectile.js';

/**
 * Classe responsable de l'affichage et de l'interaction d'un projectile
 * Utilise un modèle pour les données et la logique métier
 */
export class Projectile {
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
        // Créer le modèle de projectile
        this.model = new ModelProjectile(x, y, target, damage, color, speed, splashRadius, splashDamagePercent, level);
        
        // Propriétés d'affichage
        this.gameBoard = gameBoard;
        this.size = 6 + (level - 1) * 2;
        this.toRemove = false; // Duplication avec le modèle pour compatibilité
        
        // Créer l'élément DOM
        this.element = document.createElement('div');
        this.element.className = 'projectile';
        this.element.id = `projectile-${this.model.id}`;
        this.element.style.width = `${this.size}px`;
        this.element.style.height = `${this.size}px`;
        this.element.style.backgroundColor = this.model.color;
        this.element.style.left = `${this.model.x - this.size / 2}px`;
        this.element.style.top = `${this.model.y - this.size / 2}px`;
        
        // Ajouter un effet visuel selon le niveau
        if (level > 1) {
            const glowSize = level * 1.5;
            this.element.style.boxShadow = `0 0 ${glowSize}px ${this.model.color}`;
            
            if (level >= 3) {
                this.element.classList.add('projectile-trail');
            }
        }
        
        // Ajouter l'élément au jeu
        this.gameBoard.appendChild(this.element);
    }

    /**
     * Met à jour la position du projectile
     * @param {number} deltaTime Temps écoulé depuis la dernière mise à jour en ms
     * @returns {boolean} Vrai si le projectile a touché sa cible
     */
    update(deltaTime) {
        // Calculer le mouvement avec le modèle
        const movement = this.model.calculateMovement(deltaTime);
        
        // Si le projectile doit être supprimé
        if (movement.shouldRemove) {
            this.remove();
            return true;
        }
        
        // Mettre à jour la position visuelle
        this.element.style.transition = 'none';
        this.element.style.left = `${movement.newX}px`;
        this.element.style.top = `${movement.newY}px`;
        
        // Réactiver la transition après la mise à jour
        setTimeout(() => {
            if (this.element) {
                this.element.style.transition = '';
            }
        }, 0);
        
        // Si le projectile a touché sa cible
        if (movement.hasHit) {
            // Appliquer les dégâts à la cible principale
            movement.hitTarget.takeDamage(this.model.damage, this.model.level);
            
            // Créer un effet d'impact visuel
            this.createImpactEffect();
            
            // Appliquer les dégâts de zone si nécessaire
            if (this.model.splashRadius > 0) {
                this.applySplashDamage();
            }
            
            // Retarder légèrement la suppression pour que l'effet visuel soit visible
            setTimeout(() => {
                this.remove();
            }, 150);
            
            return true;
        }
        
        // Vérifier si le projectile est sorti des limites du jeu
        const gameWidth = this.gameBoard.clientWidth;
        const gameHeight = this.gameBoard.clientHeight;
        
        if (this.model.isOutOfBounds(gameWidth, gameHeight)) {
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
        const size = 20 + (this.model.level - 1) * 10;
        const duration = 300 + (this.model.level - 1) * 100;
        
        impact.style.width = `${size}px`;
        impact.style.height = `${size}px`;
        impact.style.left = `${this.model.target.x}px`;
        impact.style.top = `${this.model.target.y}px`;
        impact.style.backgroundColor = this.model.color;
        impact.style.opacity = '0.7';
        
        this.gameBoard.appendChild(impact);
        this.createExplosionParticles(this.model.target.x, this.model.target.y, 8 + this.model.level * 2);
        
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
            particle.style.color = this.model.color;
            
            // Direction aléatoire pour chaque particule
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 30 * this.model.level;
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
        // Récupérer les ennemis du jeu
        const enemies = window.gameInstance?.enemies;
        
        // Utiliser le modèle pour calculer les dégâts de splash
        const splashTargets = this.model.calculateSplashDamage(enemies);
        
        // Appliquer les dégâts et créer les effets visuels
        for (const target of splashTargets) {
            // Appliquer les dégâts à l'ennemi
            target.enemy.takeDamage(target.damage, this.model.level);
            
            // Créer une ligne d'effet de splash visible
            this.createSplashLine(
                target.linePoints.x1, 
                target.linePoints.y1, 
                target.linePoints.x2, 
                target.linePoints.y2
            );
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
        line.style.backgroundColor = this.model.color;
        line.style.height = `${2 + this.model.level}px`;
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
        this.model.markForRemoval();
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
    
    // Getters pour compatibilité avec le code existant
    get id() { return this.model.id; }
    get x() { return this.model.x; }
    get y() { return this.model.y; }
    get target() { return this.model.target; }
    get damage() { return this.model.damage; }
    get color() { return this.model.color; }
    get speed() { return this.model.speed; }
    get splashRadius() { return this.model.splashRadius; }
    get splashDamagePercent() { return this.model.splashDamagePercent; }
    get level() { return this.model.level; }
    get hit() { return this.model.hit; }
}