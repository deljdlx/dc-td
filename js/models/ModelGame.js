/**
 * Modèle représentant la logique du jeu
 */
class ModelGame {
    /**
     * Crée un nouveau modèle de jeu
     */
    constructor() {
        this.gameConfig = null;
        this.enemies = [];
        this.money = 200;
        this.lives = 20;
        this.wave = 0;
        this.waveInProgress = false;
        
        this.lastTime = 0;
        this.enemySpawnTime = 0;
        this.enemySpawnIndex = 0;
        this.currentWaveConfig = null;
        this.currentEnemyType = null;
        
        // Références aux gestionnaires sans éléments DOM
        this.map = null;
        this.towerManager = null;
    }
    
    /**
     * Initialise le jeu avec la configuration chargée
     * @param {Object} config Configuration du jeu
     */
    init(config) {
        this.gameConfig = config;
    }
    
    /**
     * Configure la carte
     * @param {Map} map Référence à la carte
     */
    setMap(map) {
        this.map = map;
    }
    
    /**
     * Configure le gestionnaire de tours
     * @param {TowerManager} towerManager Référence au gestionnaire de tours
     */
    setTowerManager(towerManager) {
        this.towerManager = towerManager;
    }
    
    /**
     * Démarre la prochaine vague d'ennemis
     * @returns {Object} Informations sur la vague démarrée
     */
    startNextWave() {
        if (this.waveInProgress) {
            return { success: false, message: "Une vague est déjà en cours" };
        }
        
        this.wave++;
        
        // Vérifier si toutes les vagues sont terminées
        if (this.wave > this.gameConfig.waves.length) {
            return { success: false, message: "Toutes les vagues sont terminées", gameCompleted: true };
        }
        
        this.waveInProgress = true;
        this.enemySpawnTime = 0;
        this.enemySpawnIndex = 0;
        this.currentWaveConfig = this.gameConfig.waves[this.wave - 1];
        this.currentEnemyType = null;
        
        return { success: true, wave: this.wave };
    }
    
    /**
     * Ajoute un ennemi à la liste des ennemis
     * @param {Enemy} enemy Ennemi à ajouter
     */
    addEnemy(enemy) {
        this.enemies.push(enemy);
    }
    
    /**
     * Supprime un ennemi de la liste
     * @param {number} index Index de l'ennemi à supprimer
     */
    removeEnemy(index) {
        if (index >= 0 && index < this.enemies.length) {
            this.enemies.splice(index, 1);
        }
    }
    
    /**
     * Gère la défaite d'un ennemi (donne de l'or)
     * @param {number} reward Récompense en or
     */
    enemyDefeated(reward) {
        this.money += reward;
    }
    
    /**
     * Gère l'arrivée d'un ennemi à la fin du chemin (perd des vies)
     * @param {number} damage Dégâts infligés
     * @returns {Object} État du jeu après les dégâts
     */
    enemyReachedEnd(damage) {
        this.lives -= damage;
        
        return {
            lives: this.lives,
            gameOver: this.lives <= 0
        };
    }
    
    /**
     * Vérifie si le joueur peut acheter une tour
     * @param {number} cost Coût de la tour
     * @returns {boolean} Vrai si le joueur a assez d'argent
     */
    canAfford(cost) {
        return this.money >= cost;
    }
    
    /**
     * Dépense de l'or pour une tour
     * @param {number} cost Coût de la tour
     * @returns {boolean} Vrai si la transaction a réussi
     */
    spendMoney(cost) {
        if (this.canAfford(cost)) {
            this.money -= cost;
            return true;
        }
        return false;
    }
    
    /**
     * Donne une récompense d'or pour avoir terminé une vague
     */
    waveCompleted() {
        // Donner un bonus d'or pour avoir terminé la vague
        this.money += 25 + this.wave * 5;
        this.waveInProgress = false;
    }
    
    /**
     * Réinitialise le jeu
     */
    reset() {
        this.enemies = [];
        this.money = 200;
        this.lives = 20;
        this.wave = 0;
        this.waveInProgress = false;
        this.enemySpawnTime = 0;
        this.enemySpawnIndex = 0;
        this.currentWaveConfig = null;
        this.currentEnemyType = null;
    }
    
    /**
     * Récupère les tours du gestionnaire de tourelles
     * @returns {Array} Liste des tours
     */
    get towers() {
        return this.towerManager ? this.towerManager.towers : [];
    }
}