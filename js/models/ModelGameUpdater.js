/**
 * Modèle responsable de la logique de mise à jour du jeu
 */
class ModelGameUpdater {
    /**
     * Crée un nouveau modèle d'updater pour le jeu
     * @param {ModelGame} modelGame Référence au modèle du jeu
     */
    constructor(modelGame) {
        this.modelGame = modelGame;
    }

    /**
     * Calcule la progression de la vague en cours
     * @param {number} deltaTime Temps écoulé depuis la dernière frame en ms
     * @returns {Object} Informations sur la mise à jour de la vague
     */
    calculateWaveProgress(deltaTime) {
        // Mettre à jour le temps d'apparition
        this.modelGame.enemySpawnTime += deltaTime;
        
        let result = {
            spawnedEnemy: false,
            enemyConfig: null,
            waveCompleted: false
        };
        
        // Trouver le type d'ennemi actuel à générer
        if (!this.modelGame.currentEnemyType && this.modelGame.currentWaveConfig.enemies.length > 0) {
            this.modelGame.currentEnemyType = this.modelGame.currentWaveConfig.enemies[0];
            this.modelGame.enemySpawnIndex = 0;
        }
        
        // Vérifier s'il faut générer un nouvel ennemi
        if (this.modelGame.currentEnemyType && 
            this.modelGame.enemySpawnTime > this.modelGame.currentEnemyType.delay * 1000) {
            
            const enemyConfig = this.modelGame.gameConfig.enemies.find(
                enemy => enemy.id === this.modelGame.currentEnemyType.type
            );
            
            if (enemyConfig) {
                // Marquer qu'un ennemi doit être créé
                result.spawnedEnemy = true;
                result.enemyConfig = enemyConfig;
                
                // Mettre à jour les compteurs
                this.modelGame.enemySpawnIndex++;
                this.modelGame.enemySpawnTime = 0;
                
                // Si tous les ennemis de ce type sont générés, passer au type suivant
                if (this.modelGame.enemySpawnIndex >= this.modelGame.currentEnemyType.count) {
                    const currentIndex = this.modelGame.currentWaveConfig.enemies.indexOf(
                        this.modelGame.currentEnemyType
                    );
                    
                    if (currentIndex < this.modelGame.currentWaveConfig.enemies.length - 1) {
                        this.modelGame.currentEnemyType = this.modelGame.currentWaveConfig.enemies[currentIndex + 1];
                        this.modelGame.enemySpawnIndex = 0;
                    } else {
                        this.modelGame.currentEnemyType = null;
                    }
                }
            }
        }
        
        // Vérifier si la vague est terminée
        if (!this.modelGame.currentEnemyType && this.modelGame.enemies.length === 0 && 
            this.modelGame.waveInProgress) {
            result.waveCompleted = true;
        }
        
        return result;
    }
    
    /**
     * Analyse l'état de tous les ennemis pour déterminer les actions à prendre
     * @param {number} deltaTime Temps écoulé depuis la dernière frame en ms
     * @returns {Object} Informations sur les mises à jour des ennemis
     */
    analyzeEnemies(deltaTime) {
        const result = {
            // Ennemis à supprimer
            removedEnemies: [],
            
            // Ennemis qui ont atteint la fin
            endReachedEnemies: [],
            
            // Ennemis vaincus
            defeatedEnemies: [],
            
            // Informations sur le game over
            gameOver: false
        };
        
        // Analyser chaque ennemi
        for (let i = this.modelGame.enemies.length - 1; i >= 0; i--) {
            const enemy = this.modelGame.enemies[i];
            
            // Si l'ennemi est mort, le marquer pour suppression
            if (!enemy.isAlive()) {
                if (!enemy.hasReachedEnd()) {
                    // Ennemi vaincu
                    result.defeatedEnemies.push({
                        index: i,
                        enemy: enemy
                    });
                } else {
                    // L'ennemi a atteint la fin du chemin
                    result.endReachedEnemies.push({
                        index: i,
                        enemy: enemy
                    });
                    
                    // Vérifier si le joueur a perdu
                    const lives = this.modelGame.lives - enemy.damage;
                    if (lives <= 0) {
                        result.gameOver = true;
                    }
                }
                
                result.removedEnemies.push(i);
            }
        }
        
        return result;
    }
}