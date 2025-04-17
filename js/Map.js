class Map {
    /**
     * Crée une nouvelle carte
     * @param {Object} mapConfig Configuration de la carte
     * @param {HTMLElement} gameBoard Élément conteneur du jeu
     */
    constructor(mapConfig, gameBoard) {
        this.width = mapConfig.width;
        this.height = mapConfig.height;
        this.cellSize = mapConfig.cellSize;
        this.startPoint = mapConfig.startPoint;
        this.endPoint = mapConfig.endPoint;
        this.path = mapConfig.path;
        this.gameBoard = gameBoard;
        this.mapContainer = null;
        this.cells = [];
        this.cellElements = [];
        
        // Initialiser le conteneur du jeu à la bonne taille
        this.gameBoard.style.width = `${this.width * this.cellSize}px`;
        this.gameBoard.style.height = `${this.height * this.cellSize}px`;
        
        this.createMapElements();
    }
    
    /**
     * Crée les éléments DOM de la carte
     */
    createMapElements() {
        // Créer le conteneur de la carte
        this.mapContainer = document.createElement('div');
        this.mapContainer.className = 'map-container';
        this.gameBoard.appendChild(this.mapContainer);
        
        // Initialiser les cellules
        this.initCells();
        
        // Créer les éléments DOM pour chaque cellule
        this.cellElements = this.cells.map(cell => {
            const cellElement = document.createElement('div');
            cellElement.className = `cell ${cell.isPath ? 'path' : 'buildable'}`;
            cellElement.style.width = `${this.cellSize}px`;
            cellElement.style.height = `${this.cellSize}px`;
            cellElement.style.left = `${cell.x * this.cellSize}px`;
            cellElement.style.top = `${cell.y * this.cellSize}px`;
            
            // Ajouter un attribut data pour faciliter l'identification
            cellElement.dataset.x = cell.x;
            cellElement.dataset.y = cell.y;
            
            this.mapContainer.appendChild(cellElement);
            return cellElement;
        });
        
        // Créer les points de départ et d'arrivée
        this.createSpecialPoints();
    }
    
    /**
     * Initialise les cellules de la carte
     */
    initCells() {
        this.cells = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const isPath = Utils.isPointInArray({x, y}, this.path);
                this.cells.push({
                    x,
                    y,
                    isPath,
                    isBuildable: !isPath
                });
            }
        }
    }
    
    /**
     * Crée les points spéciaux (départ et arrivée)
     */
    createSpecialPoints() {
        // Point de départ
        const startCenter = this.getCellCenter(this.startPoint.x, this.startPoint.y);
        const startPointElement = document.createElement('div');
        startPointElement.className = 'start-point';
        startPointElement.style.width = `${this.cellSize / 2}px`;
        startPointElement.style.height = `${this.cellSize / 2}px`;
        startPointElement.style.left = `${startCenter.x - this.cellSize / 4}px`;
        startPointElement.style.top = `${startCenter.y - this.cellSize / 4}px`;
        startPointElement.style.position = 'absolute';
        this.mapContainer.appendChild(startPointElement);
        
        // Point d'arrivée
        const endCenter = this.getCellCenter(this.endPoint.x, this.endPoint.y);
        const endPointElement = document.createElement('div');
        endPointElement.className = 'end-point';
        endPointElement.style.width = `${this.cellSize / 2}px`;
        endPointElement.style.height = `${this.cellSize / 2}px`;
        endPointElement.style.left = `${endCenter.x - this.cellSize / 4}px`;
        endPointElement.style.top = `${endCenter.y - this.cellSize / 4}px`;
        endPointElement.style.position = 'absolute';
        this.mapContainer.appendChild(endPointElement);
    }
    
    /**
     * Marque une cellule comme valide ou invalide pour le placement d'une tour
     * @param {number} x Coordonnée X de la cellule
     * @param {number} y Coordonnée Y de la cellule
     * @param {boolean} isValid Si la cellule est valide
     */
    markCell(x, y, isValid) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return;
        }
        
        const cell = this.cellElements.find(
            cellElement => parseInt(cellElement.dataset.x) === x && parseInt(cellElement.dataset.y) === y
        );
        
        if (cell) {
            // Supprimer les classes précédentes
            cell.classList.remove('valid-cell', 'invalid-cell');
            
            // Ajouter la nouvelle classe si nécessaire
            if (isValid !== undefined) {
                cell.classList.add(isValid ? 'valid-cell' : 'invalid-cell');
            }
        }
    }
    
    /**
     * Efface tous les marquages de cellules
     */
    clearCellMarkers() {
        this.cellElements.forEach(cell => {
            cell.classList.remove('valid-cell', 'invalid-cell');
        });
    }
    
    /**
     * Convertit les coordonnées de la souris en indices de cellule
     * @param {number} mouseX Coordonnée X de la souris
     * @param {number} mouseY Coordonnée Y de la souris
     * @returns {Object} Coordonnées de la cellule {x, y}
     */
    getCellFromCoordinates(mouseX, mouseY) {
        const x = Math.floor(mouseX / this.cellSize);
        const y = Math.floor(mouseY / this.cellSize);
        return {x, y};
    }
    
    /**
     * Vérifie si une position est constructible
     * @param {number} x Coordonnée X
     * @param {number} y Coordonnée Y
     * @returns {boolean} Vrai si la position est constructible
     */
    isBuildable(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return false;
        }
        
        const cell = this.cells.find(c => c.x === x && c.y === y);
        return cell && cell.isBuildable;
    }
    
    /**
     * Obtient les coordonnées d'une cellule
     * @param {number} x Indice X de la cellule
     * @param {number} y Indice Y de la cellule
     * @returns {Object} Coordonnées {x, y} du centre de la cellule
     */
    getCellCenter(x, y) {
        return {
            x: (x + 0.5) * this.cellSize,
            y: (y + 0.5) * this.cellSize
        };
    }
    
    /**
     * Obtient le chemin sous forme de coordonnées
     * @returns {Array} Tableau de coordonnées du chemin
     */
    getPathCoordinates() {
        return this.path.map(point => this.getCellCenter(point.x, point.y));
    }
}