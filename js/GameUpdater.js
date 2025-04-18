/**
 * Classe responsable de la mise à jour de l'état du jeu à chaque frame
 * Utilise un modèle pour la logique métier
 */
class GameUpdater {
    /**
     * Crée un nouvel updater pour le jeu
     * @param {Game} game Référence à l'instance du jeu
     */
    constructor(game) {
        this.game = game;
        // Créer le modèle d'updater
        this.model = new ModelGameUpdater(this.game.model);
    }

    /**
     * Met à jour l'état du jeu pour une frame
     * @param {number} timestamp Horodatage actuel
     * @param {number} deltaTime Temps écoulé depuis la dernière frame en ms
     */
    update(timestamp, deltaTime) {
        // Si une vague est en cours, générer des ennemis
        if (this.game.waveInProgress) {
            this.updateWaveProgress(deltaTime);
        }
        
        // Mettre à jour les ennemis
        this.updateEnemies(deltaTime);
        
        // Mise à jour des tours via le gestionnaire de tourelles
        this.updateTowers(timestamp, deltaTime);
    }
    
    /**
     * Met à jour les tours et leurs projectiles
     * @param {number} timestamp Horodatage actuel
     * @param {number} deltaTime Temps écoulé depuis la dernière frame en ms
     */
    updateTowers(timestamp, deltaTime) {
        // Appeler la mise à jour du gestionnaire de tourelles
        if (this.game.towerManager) {
            this.game.towerManager.update(timestamp, deltaTime, this.game.enemies);
        }
    }

    /**
     * Met à jour la progression de la vague en cours
     * @param {number} deltaTime Temps écoulé depuis la dernière frame en ms
     */
    updateWaveProgress(deltaTime) {
        // Déléguer le calcul de la progression au modèle
        const waveResult = this.model.calculateWaveProgress(deltaTime);
        
        // Si un ennemi doit être généré
        if (waveResult.spawnedEnemy && waveResult.enemyConfig) {
            this.game.spawnEnemy(waveResult.enemyConfig);
        }
        
        // Si la vague est terminée
        if (waveResult.waveCompleted) {
            console.log("Vague terminée!");
            this.game.waveCompleted();
        }
    }
    
    /**
     * Met à jour les ennemis
     * @param {number} deltaTime Temps écoulé depuis la dernière frame en ms
     */
    updateEnemies(deltaTime) {
        // D'abord, mettre à jour la position de tous les ennemis actifs
        for (const enemy of this.game.enemies) {
            if (enemy.isAlive()) {
                enemy.update(deltaTime);
            }
        }
        
        // Ensuite, analyser les changements d'état des ennemis
        const enemyResults = this.model.analyzeEnemies(deltaTime);
        
        // Traiter les ennemis vaincus (qui ont été tués)
        for (const defeated of enemyResults.defeatedEnemies) {
            this.game.enemyDefeated(defeated.index, defeated.enemy.reward);
        }
        
        // Traiter les ennemis qui ont atteint la fin du chemin
        for (const endReached of enemyResults.endReachedEnemies) {
            this.game.enemyReachedEnd(endReached.index, endReached.enemy.damage);
        }
        
        // Vérifier si le jeu est terminé
        if (enemyResults.gameOver) {
            alert("Game Over! Vous avez perdu toutes vos vies!");
            this.game.resetGame();
        }
    }
}