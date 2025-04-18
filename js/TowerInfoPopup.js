/**
 * Classe qui gère l'affichage des popups d'informations des tours
 */
class TowerInfoPopup {
    /**
     * Crée une nouvelle instance de popup d'informations
     * @param {Tower} tower La tour associée à cette popup
     * @param {HTMLElement} gameBoard Élément conteneur du jeu
     */
    constructor(tower, gameBoard) {
        this.tower = tower;
        this.gameBoard = gameBoard;
        this.element = null;
        
        this.create();
    }
    
    /**
     * Crée l'élément DOM du popup
     */
    create() {
        // Créer le popup d'information (initialement caché)
        this.element = document.createElement('div');
        this.element.className = 'tower-info-popup';
        this.element.style.display = 'none';
        this.update(); // Mettre à jour le contenu initial
        
        // Ajouter l'élément au jeu
        this.gameBoard.appendChild(this.element);
    }
    
    /**
     * Met à jour le contenu HTML du popup
     */
    update() {
        if (this.element) {
            this.element.innerHTML = this.generateHTML();
        }
    }
    
    /**
     * Génère le contenu HTML du popup d'information
     * @returns {string} Le HTML formaté pour le popup
     */
    generateHTML() {
        // Calculer les dégâts par seconde (DPS)
        const dps = (this.tower.damage * this.tower.fireRate).toFixed(1);
        
        // Construire les informations sur l'amélioration possible
        let upgradeInfo = '';
        if (this.tower.level < this.tower.maxLevel) {
            const nextDamage = Math.round(this.tower.damage * this.tower.upgradeMultiplier);
            const nextRange = Math.round(this.tower.range * this.tower.upgradeMultiplier);
            const nextFireRate = +(this.tower.fireRate * this.tower.upgradeMultiplier).toFixed(1);
            const nextDps = (nextDamage * nextFireRate).toFixed(1);
            
            upgradeInfo = `
                <div class="tower-upgrade-info">
                    <h4>Niveau suivant :</h4>
                    <div><span>Dégâts:</span> ${nextDamage} (+${Math.round((nextDamage-this.tower.damage))})</div>
                    <div><span>Portée:</span> ${nextRange} (+${Math.round((nextRange-this.tower.range))})</div>
                    <div><span>Cadence:</span> ${nextFireRate}/s (+${(nextFireRate-this.tower.fireRate).toFixed(1)})</div>
                    <div><span>DPS:</span> ${nextDps} (+${(nextDps-dps).toFixed(1)})</div>
                    <div class="upgrade-cost">Coût: ${this.tower.upgradeCost}</div>
                </div>
            `;
        } else {
            upgradeInfo = '<div class="tower-max-level">Niveau maximum atteint</div>';
        }
        
        // Formatage du contenu du popup avec les détails de la tour
        return `
            <h3>${this.tower.name} <span class="tower-level-badge">Niv. ${this.tower.level}</span></h3>
            <div class="tower-info-stats">
                <div><span>Dégâts:</span> ${this.tower.damage}</div>
                <div><span>Portée:</span> ${this.tower.range}</div>
                <div><span>Cadence:</span> ${this.tower.fireRate}/s</div>
                <div><span>DPS:</span> ${dps}</div>
                ${this.tower.splashRadius > 0 ? `<div><span>Zone:</span> ${this.tower.splashRadius}</div>` : ''}
                ${this.tower.multiShot > 1 ? `<div><span>Projectiles:</span> ${this.tower.multiShot}</div>` : ''}
            </div>
            ${upgradeInfo}
        `;
    }
    
    /**
     * Met à jour la position du popup par rapport à la tour
     */
    updatePosition() {
        if (!this.element) return;
        
        // Positionner le popup au-dessus de la tour
        const popupHeight = this.element.offsetHeight;
        const popupWidth = this.element.offsetWidth;
        
        // Ajustement de position pour éviter que le popup sorte de l'écran
        let left = this.tower.x - popupWidth / 2;
        let top = this.tower.y - popupHeight - 20; // 20px au-dessus de la tour
        
        // Vérifier les limites du plateau de jeu
        const boardRect = this.gameBoard.getBoundingClientRect();
        
        // Ajuster horizontalement si nécessaire
        if (left < 0) {
            left = 0;
        } else if (left + popupWidth > boardRect.width) {
            left = boardRect.width - popupWidth;
        }
        
        // Ajuster verticalement si nécessaire
        if (top < 0) {
            // Si pas assez d'espace au-dessus, afficher en dessous
            top = this.tower.y + this.tower.size / 2 + 10;
        }
        
        this.element.style.left = `${left}px`;
        this.element.style.top = `${top}px`;
    }
    
    /**
     * Affiche le popup
     */
    show() {
        if (this.element) {
            this.element.style.display = 'block';
            this.updatePosition();
        }
    }
    
    /**
     * Cache le popup
     */
    hide() {
        if (this.element) {
            this.element.style.display = 'none';
        }
    }
    
    /**
     * Supprime le popup et son élément DOM
     */
    remove() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
            this.element = null;
        }
    }
}