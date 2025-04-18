/**
 * Classe responsable de la gestion centralisée des événements
 * Permet d'éviter la duplication de code et de faciliter la maintenance
 */
export class EventManager {
    constructor() {
        this.handlers = {};
        this.onceHandlers = {};
    }

    /**
     * Ajoute un écouteur d'événement
     * @param {string} eventName Nom de l'événement
     * @param {Function} handler Fonction de gestion
     * @param {Object} options Options supplémentaires
     * @param {number} options.priority Priorité de l'écouteur (plus la valeur est élevée, plus la priorité est haute)
     */
    addListener(eventName, handler, options = {}) {
        if (!this.handlers[eventName]) {
            this.handlers[eventName] = [];
        }
        
        const handlerObj = {
            fn: handler,
            priority: options.priority || 0
        };
        
        this.handlers[eventName].push(handlerObj);
        
        // Trier les gestionnaires par priorité (décroissante)
        this.handlers[eventName].sort((a, b) => b.priority - a.priority);
    }

    /**
     * Ajoute un écouteur d'événement qui ne s'exécutera qu'une seule fois
     * @param {string} eventName Nom de l'événement
     * @param {Function} handler Fonction de gestion
     * @param {Object} options Options supplémentaires
     * @param {number} options.priority Priorité de l'écouteur
     */
    once(eventName, handler, options = {}) {
        if (!this.onceHandlers[eventName]) {
            this.onceHandlers[eventName] = [];
        }
        
        const handlerObj = {
            fn: handler,
            priority: options.priority || 0
        };
        
        this.onceHandlers[eventName].push(handlerObj);
        
        // Trier les gestionnaires par priorité (décroissante)
        this.onceHandlers[eventName].sort((a, b) => b.priority - a.priority);
    }

    /**
     * Supprime un écouteur d'événement
     * @param {string} eventName Nom de l'événement
     * @param {Function} handler Fonction de gestion à supprimer
     */
    removeListener(eventName, handler) {
        if (!this.handlers[eventName]) return;
        this.handlers[eventName] = this.handlers[eventName].filter(h => h.fn !== handler);
        
        if (this.onceHandlers[eventName]) {
            this.onceHandlers[eventName] = this.onceHandlers[eventName].filter(h => h.fn !== handler);
        }
    }

    /**
     * Déclenche un événement
     * @param {string} eventName Nom de l'événement
     * @param {Object} data Données associées à l'événement
     * @returns {boolean} Vrai si au moins un gestionnaire a été exécuté
     */
    emit(eventName, data = {}) {
        let handled = false;
        
        // Exécuter les gestionnaires normaux
        if (this.handlers[eventName]) {
            for (const handler of this.handlers[eventName]) {
                handler.fn(data);
                handled = true;
            }
        }
        
        // Exécuter les gestionnaires à usage unique
        if (this.onceHandlers[eventName]) {
            for (const handler of this.onceHandlers[eventName]) {
                handler.fn(data);
                handled = true;
            }
            // Vider les gestionnaires à usage unique pour cet événement
            this.onceHandlers[eventName] = [];
        }
        
        return handled;
    }

    /**
     * Supprime tous les écouteurs d'un événement
     * @param {string} eventName Nom de l'événement (si non spécifié, supprime tous les écouteurs)
     */
    clearListeners(eventName) {
        if (eventName) {
            this.handlers[eventName] = [];
            this.onceHandlers[eventName] = [];
        } else {
            this.handlers = {};
            this.onceHandlers = {};
        }
    }
    
    /**
     * Vérifie si un événement a des écouteurs
     * @param {string} eventName Nom de l'événement
     * @returns {boolean} Vrai si l'événement a au moins un écouteur
     */
    hasListeners(eventName) {
        return (
            (this.handlers[eventName] && this.handlers[eventName].length > 0) ||
            (this.onceHandlers[eventName] && this.onceHandlers[eventName].length > 0)
        );
    }
}