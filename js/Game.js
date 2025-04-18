class Game {
    /**
     * Crée une nouvelle partie
     * @param {HTMLElement} gameBoard Élément conteneur du jeu
     */
    constructor(gameBoard) {
        this.gameBoard = gameBoard;
        this.gameConfig = null;
        this.map = null;
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
        
        // Le gestionnaire de tourelles sera initialisé une fois la carte créée
        this.towerManager = null;
        
        this.setupEventListeners();
        this.loadGameConfig();
    }
    
    /**
     * Configure les écouteurs d'événements
     */
    setupEventListeners() {
        // Bouton pour démarrer une vague
        document.getElementById('start-wave').addEventListener('click', () => {
            if (!this.waveInProgress) {
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
                this.gameConfig = data;
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
        this.map = new Map(this.gameConfig.map, this.gameBoard);
        
        // Création du gestionnaire de tourelles
        this.towerManager = new TowerManager(this, this.gameBoard, this.map);
        
        // Création des boutons pour les tours
        this.towerManager.createTowerButtons(this.gameConfig.towers);
        
        // Mettre à jour l'affichage initial
        document.getElementById('money').textContent = this.money;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('wave').textContent = this.wave;
        
        // Démarrer la boucle de jeu
        this.gameLoop();
    }
    
    /**
     * Démarre la prochaine vague d'ennemis
     */
    startNextWave() {
        if (this.waveInProgress) {
            return;
        }
        
        this.wave++;
        
        // Vérifier si toutes les vagues sont terminées
        if (this.wave > this.gameConfig.waves.length) {
            alert("Félicitations! Vous avez vaincu toutes les vagues d'ennemis!");
            return;
        }
        
        this.waveInProgress = true;
        this.enemySpawnTime = 0;
        this.enemySpawnIndex = 0;
        this.currentWaveConfig = this.gameConfig.waves[this.wave - 1];
        this.currentEnemyType = null;
        
        // Mettre à jour l'affichage de la vague
        document.getElementById('wave').textContent = this.wave;
    }
    
    /**
     * Met à jour l'état du jeu
     * @param {number} timestamp Horodatage actuel
     */
    update(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        // Utiliser GameUpdater pour effectuer les mises à jour
        if (!this.updater) {
            this.updater = new GameUpdater(this);
        }
        
        this.updater.update(timestamp, deltaTime);
        
        // Mise à jour des tours via le gestionnaire de tourelles
        this.towerManager.update(timestamp, this.enemies);
    }
    
    /**
     * Génère un nouvel ennemi
     * @param {Object} enemyConfig Configuration de l'ennemi
     */
    spawnEnemy(enemyConfig) {
        const pathCoordinates = this.map.getPathCoordinates();
        const enemy = new Enemy(enemyConfig, pathCoordinates, this.gameBoard);
        this.enemies.push(enemy);
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
        for (const enemy of this.enemies) {
            enemy.remove();
        }
        
        // Réinitialiser les tableaux et les propriétés
        this.enemies = [];
        this.money = 100;
        this.lives = 20;
        this.wave = 0;
        this.waveInProgress = false;
        
        // Mettre à jour l'affichage
        document.getElementById('money').textContent = this.money;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('wave').textContent = this.wave;
    }
    
    /**
     * Boucle principale du jeu
     * @param {number} timestamp Horodatage actuel
     */
    gameLoop(timestamp = 0) {
        // Mettre à jour l'état du jeu
        this.update(timestamp);
        
        // Rendre tous les éléments du jeu
        this.render();
        
        // Planifier la prochaine frame
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    /**
     * Dessine tous les éléments du jeu
     */
    render() {
        // Cette méthode reste vide car le rendu est géré par les différentes classes
    }
    
    /**
     * Récupère les tours du gestionnaire de tourelles
     * @returns {Array} Liste des tours
     */
    get towers() {
        return this.towerManager ? this.towerManager.towers : [];
    }
}