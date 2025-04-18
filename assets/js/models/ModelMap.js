import { Utils } from '../Utils.js';

/**
 * Modèle représentant la logique d'une carte
 */
export class ModelMap {
    /**
     * Crée un nouveau modèle de carte
     * @param {Object} mapConfig Configuration de la carte
     */
    constructor(mapConfig) {
        this.width = mapConfig.width;
        this.height = mapConfig.height;
        this.cellSize = mapConfig.cellSize;
        this.startPoint = mapConfig.startPoint;
        this.endPoint = mapConfig.endPoint;
        this.path = mapConfig.path;
        this.cells = [];
        
        this.initCells();
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
     * Vérifie si une position est dans les limites de la carte
     * @param {number} x Coordonnée X
     * @param {number} y Coordonnée Y
     * @returns {boolean} Vrai si la position est dans les limites
     */
    isInBounds(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }
    
    /**
     * Vérifie si une position est constructible
     * @param {number} x Coordonnée X
     * @param {number} y Coordonnée Y
     * @returns {boolean} Vrai si la position est constructible
     */
    isBuildable(x, y) {
        if (!this.isInBounds(x, y)) {
            return false;
        }
        
        const cell = this.cells.find(c => c.x === x && c.y === y);
        return cell && cell.isBuildable;
    }
    
    /**
     * Obtient la cellule à une position spécifiée
     * @param {number} x Coordonnée X
     * @param {number} y Coordonnée Y
     * @returns {Object|null} La cellule ou null si hors limites
     */
    getCell(x, y) {
        if (!this.isInBounds(x, y)) {
            return null;
        }
        
        return this.cells.find(c => c.x === x && c.y === y);
    }
    
    /**
     * Convertit les coordonnées en indices de cellule
     * @param {number} coordX Coordonnée X
     * @param {number} coordY Coordonnée Y
     * @returns {Object} Indices de la cellule {x, y}
     */
    getCellFromCoordinates(coordX, coordY) {
        const x = Math.floor(coordX / this.cellSize);
        const y = Math.floor(coordY / this.cellSize);
        return {x, y};
    }
    
    /**
     * Obtient les coordonnées du centre d'une cellule
     * @param {number} x Indice X de la cellule
     * @param {number} y Indice Y de la cellule
     * @returns {Object} Coordonnées du centre {x, y}
     */
    getCellCenter(x, y) {
        return {
            x: (x + 0.5) * this.cellSize,
            y: (y + 0.5) * this.cellSize
        };
    }
    
    /**
     * Obtient le chemin sous forme de coordonnées de centre de cellules
     * @returns {Array} Tableau de coordonnées du chemin
     */
    getPathCoordinates() {
        return this.path.map(point => this.getCellCenter(point.x, point.y));
    }
    
    /**
     * Obtient toutes les cellules de la carte
     * @returns {Array} Tableau de cellules
     */
    getAllCells() {
        return [...this.cells];
    }
}