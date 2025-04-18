/**
 * Classe responsable de l'affichage et de l'interaction d'une carte
 * Utilise un modèle pour les données et la logique métier
 */
class Map {
    /**
     * Crée une nouvelle carte
     * @param {Object} mapConfig Configuration de la carte
     * @param {HTMLElement} gameBoard Élément conteneur du jeu
     */
    constructor(mapConfig, gameBoard) {
        // Créer le modèle de la carte
        this.model = new ModelMap(mapConfig);
        
        // Propriétés d'affichage
        this.gameBoard = gameBoard;
        this.mapContainer = null;
        this.cellElements = [];
        
        // Initialiser le conteneur du jeu à la bonne taille
        this.gameBoard.style.width = `${this.model.width * this.model.cellSize}px`;
        this.gameBoard.style.height = `${this.model.height * this.model.cellSize}px`;
        
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
        
        // Créer les éléments DOM pour chaque cellule
        const cells = this.model.getAllCells();
        this.cellElements = cells.map(cell => {
            const cellElement = document.createElement('div');
            cellElement.className = `cell ${cell.isPath ? 'path' : 'buildable'}`;
            cellElement.style.width = `${this.model.cellSize}px`;
            cellElement.style.height = `${this.model.cellSize}px`;
            cellElement.style.left = `${cell.x * this.model.cellSize}px`;
            cellElement.style.top = `${cell.y * this.model.cellSize}px`;
            
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
     * Crée les points spéciaux (départ et arrivée)
     */
    createSpecialPoints() {
        // Point de départ
        const startPoint = this.model.startPoint;
        const startCenter = this.model.getCellCenter(startPoint.x, startPoint.y);
        const startPointElement = document.createElement('div');
        startPointElement.className = 'start-point';
        startPointElement.style.width = `${this.model.cellSize / 2}px`;
        startPointElement.style.height = `${this.model.cellSize / 2}px`;
        startPointElement.style.left = `${startCenter.x - this.model.cellSize / 4}px`;
        startPointElement.style.top = `${startCenter.y - this.model.cellSize / 4}px`;
        startPointElement.style.position = 'absolute';
        this.mapContainer.appendChild(startPointElement);
        
        // Point d'arrivée
        const endPoint = this.model.endPoint;
        const endCenter = this.model.getCellCenter(endPoint.x, endPoint.y);
        const endPointElement = document.createElement('div');
        endPointElement.className = 'end-point';
        endPointElement.style.width = `${this.model.cellSize / 2}px`;
        endPointElement.style.height = `${this.model.cellSize / 2}px`;
        endPointElement.style.left = `${endCenter.x - this.model.cellSize / 4}px`;
        endPointElement.style.top = `${endCenter.y - this.model.cellSize / 4}px`;
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
        if (!this.model.isInBounds(x, y)) {
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
    
    // Méthodes déléguées au modèle
    
    /**
     * Convertit les coordonnées de la souris en indices de cellule
     * @param {number} mouseX Coordonnée X de la souris
     * @param {number} mouseY Coordonnée Y de la souris
     * @returns {Object} Coordonnées de la cellule {x, y}
     */
    getCellFromCoordinates(mouseX, mouseY) {
        return this.model.getCellFromCoordinates(mouseX, mouseY);
    }
    
    /**
     * Vérifie si une position est constructible
     * @param {number} x Coordonnée X
     * @param {number} y Coordonnée Y
     * @returns {boolean} Vrai si la position est constructible
     */
    isBuildable(x, y) {
        return this.model.isBuildable(x, y);
    }
    
    /**
     * Obtient les coordonnées d'une cellule
     * @param {number} x Indice X de la cellule
     * @param {number} y Indice Y de la cellule
     * @returns {Object} Coordonnées {x, y} du centre de la cellule
     */
    getCellCenter(x, y) {
        return this.model.getCellCenter(x, y);
    }
    
    /**
     * Obtient le chemin sous forme de coordonnées
     * @returns {Array} Tableau de coordonnées du chemin
     */
    getPathCoordinates() {
        return this.model.getPathCoordinates();
    }
    
    // Getters pour accéder aux propriétés du modèle
    get width() { return this.model.width; }
    get height() { return this.model.height; }
    get cellSize() { return this.model.cellSize; }
    get startPoint() { return this.model.startPoint; }
    get endPoint() { return this.model.endPoint; }
    get path() { return this.model.path; }
    get cells() { return this.model.getAllCells(); }
}