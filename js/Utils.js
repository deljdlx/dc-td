class Utils {
    /**
     * Calcule la distance entre deux points
     * @param {Object} point1 Premier point {x, y}
     * @param {Object} point2 Deuxième point {x, y}
     * @returns {number} Distance entre les deux points
     */
    static distance(point1, point2) {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Vérifie si un point est dans un tableau de points
     * @param {Object} point Point à vérifier {x, y}
     * @param {Array} pointsArray Tableau de points [{x, y}, ...]
     * @returns {boolean} Vrai si le point est dans le tableau
     */
    static isPointInArray(point, pointsArray) {
        return pointsArray.some(p => p.x === point.x && p.y === point.y);
    }

    /**
     * Génère un ID unique
     * @returns {string} ID unique
     */
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
}