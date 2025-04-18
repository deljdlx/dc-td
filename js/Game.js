/**
 * Classe responsable de l'affichage et de l'interaction du jeu
 * Utilise un modèle pour les données et la logique métier
 */
import { ModelGame } from './models/ModelGame.js';
import { Map } from './Map.js';
import { TowerManager } from './TowerManager.js';
import { GameUpdater } from './GameUpdater.js';
import { Enemy } from './Enemy.js';

export class Game {
    /**
     * Crée une nouvelle partie
     * @param {HTMLElement} gameBoard Élément conteneur du jeu
     */
    constructor(gameBoard) {
        // Propriétés d'affichage et d'interaction
        this.gameBoard = gameBoard;
        this.updater = null;
        
        // Créer le modèle du jeu
        this.model = new ModelGame();
        
        this.setupEventListeners();
        this.loadGameConfig();
        
        // Rendre l'instance accessible globalement pour les effets de splash
        window.gameInstance = this;
    }
    
    /**
     * Configure les écouteurs d'événements
     */
    setupEventListeners() {
        document.getElementById('start-wave').addEventListener('click', () => {
            if (!this.model.waveInProgress) {
                this.startNextWave();
            }
        });
    }
    
    /**
     * Charge la configuration du jeu depuis le fichier JSON
     */
    loadGameConfig() {
        fetch('assets/game-config.json')
            .then(response => response.json())
            .then(data => {
                this.model.init(data);
                this.initGame();
            })
            .catch(error => {
                console.error('Erreur lors du chargement de la configuration:', error);
            });
    }
    
    /**
     * Initialise le jeu avec la configuration chargée
     */
    initGame() {
        // Création de la carte
        this.map = new Map(this.model.gameConfig.map, this.gameBoard);
        this.model.setMap(this.map);
        
        // Création du gestionnaire de tourelles
        this.towerManager = new TowerManager(this, this.gameBoard, this.map);
        this.model.setTowerManager(this.towerManager);
        
        // Création des boutons pour les tours
        this.towerManager.createTowerButtons(this.model.gameConfig.towers);
        
        // Mettre à jour l'affichage initial
        this.updateDisplay();
        
        // Démarrer la boucle de jeu
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    /**
     * Met à jour l'affichage des informations du jeu
     */
    updateDisplay() {
        document.getElementById('money').textContent = this.model.money;
        document.getElementById('lives').textContent = this.model.lives;
        document.getElementById('wave').textContent = this.model.wave;
    }
    
    /**
     * Démarre la prochaine vague d'ennemis
     */
    startNextWave() {
        const waveResult = this.model.startNextWave();
        
        if (waveResult.success) {
            // Mettre à jour l'affichage de la vague
            document.getElementById('wave').textContent = waveResult.wave;
        } else if (waveResult.gameCompleted) {
            alert("Félicitations! Vous avez vaincu toutes les vagues d'ennemis!");
        }
    }
    
    /**
     * Met à jour l'état du jeu
     * @param {number} timestamp Horodatage actuel
     */
    update(timestamp) {
        const deltaTime = timestamp - this.model.lastTime;
        this.model.lastTime = timestamp;
        
        // Initialiser l'updater si nécessaire
        if (!this.updater) {
            this.updater = new GameUpdater(this);
        }
        
        this.updater.update(timestamp, deltaTime);
    }

    /**
     * Génère un nouvel ennemi
     * @param {Object} enemyConfig Configuration de l'ennemi
     */
    spawnEnemy(enemyConfig) {
        const pathCoordinates = this.map.getPathCoordinates();
        const enemy = new Enemy(enemyConfig, pathCoordinates, this.gameBoard);
        this.model.addEnemy(enemy);
    }
    
    /**
     * Gère la défaite d'un ennemi
     * @param {number} index Index de l'ennemi
     * @param {number} reward Récompense en or
     */
    enemyDefeated(index, reward) {
        this.model.enemyDefeated(reward);
        this.model.removeEnemy(index);
        this.updateDisplay();
    }
    
    /**
     * Gère l'arrivée d'un ennemi à la fin du chemin
     * @param {number} index Index de l'ennemi
     * @param {number} damage Dégâts infligés
     */
    enemyReachedEnd(index, damage) {
        const result = this.model.enemyReachedEnd(damage);
        this.model.removeEnemy(index);
        
        // Mettre à jour l'affichage
        document.getElementById('lives').textContent = result.lives;
        
        // Vérifier si le joueur a perdu
        if (result.gameOver) {
            alert("Game Over! Vous avez perdu toutes vos vies!");
            this.resetGame();
        }
    }
    
    /**
     * Signale qu'une vague est terminée
     */
    waveCompleted() {
        this.model.waveCompleted();
        this.updateDisplay();
    }
    
    /**
     * Vérifie si le joueur peut acheter une tour
     * @param {number} cost Coût de la tour
     * @returns {boolean} Vrai si le joueur a assez d'argent
     */
    canAfford(cost) {
        return this.model.canAfford(cost);
    }
    
    /**
     * Dépense de l'or pour une tour
     * @param {number} cost Coût de la tour
     * @returns {boolean} Vrai si la transaction a réussi
     */
    spendMoney(cost) {
        const success = this.model.spendMoney(cost);
        if (success) {
            this.updateDisplay();
        }
        return success;
    }
    
    /**
     * Réinitialise le jeu
     */
    resetGame() {
        // Réinitialiser le gestionnaire de tourelles
        if (this.towerManager) {
            this.towerManager.reset();
        }
        
        // Supprimer tous les ennemis du DOM
        for (const enemy of this.model.enemies) {
            enemy.remove();
        }
        
        // Réinitialiser le modèle
        this.model.reset();
        
        // Mettre à jour l'affichage
        this.updateDisplay();
    }
    
    /**
     * Boucle principale du jeu
     * @param {number} timestamp Horodatage actuel
     */
    gameLoop(timestamp = 0) {
        this.update(timestamp);
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    // Getters pour accéder aux propriétés du modèle
    get gameConfig() { return this.model.gameConfig; }
    get enemies() { return this.model.enemies; }
    get money() { return this.model.money; }
    get lives() { return this.model.lives; }
    get wave() { return this.model.wave; }
    get waveInProgress() { return this.model.waveInProgress; }
    get lastTime() { return this.model.lastTime; }
    get enemySpawnTime() { return this.model.enemySpawnTime; }
    get enemySpawnIndex() { return this.model.enemySpawnIndex; }
    get currentWaveConfig() { return this.model.currentWaveConfig; }
    get currentEnemyType() { return this.model.currentEnemyType; }
    get towers() { return this.model.towers; }

    // Setters pour les propriétés qui doivent être modifiables de l'extérieur
    set enemySpawnTime(value) { this.model.enemySpawnTime = value; }
    set enemySpawnIndex(value) { this.model.enemySpawnIndex = value; }
    set currentEnemyType(value) { this.model.currentEnemyType = value; }
    set waveInProgress(value) { this.model.waveInProgress = value; }
}