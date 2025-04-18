/**
 * Classe responsable de la mise à jour de l'état du jeu à chaque frame
 */
class GameUpdater {
    /**
     * Crée un nouvel updater pour le jeu
     * @param {Game} game Référence à l'instance du jeu
     */
    constructor(game) {
        this.game = game;
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
        this.game.towerManager.update(timestamp, this.game.enemies);
        
        // Mettre à jour les tours et leurs projectiles
        // this.updateTowers(timestamp);
    }
    
    /**
     * Met à jour la progression de la vague en cours
     * @param {number} deltaTime Temps écoulé depuis la dernière frame en ms
     */
    updateWaveProgress(deltaTime) {
        this.game.enemySpawnTime += deltaTime;
        
        // Trouver le type d'ennemi actuel à générer
        if (!this.game.currentEnemyType && this.game.currentWaveConfig.enemies.length > 0) {
            this.game.currentEnemyType = this.game.currentWaveConfig.enemies[0];
            this.game.enemySpawnIndex = 0;
        }
        
        // Générer un nouvel ennemi si c'est le moment
        if (this.game.currentEnemyType && this.game.enemySpawnTime > this.game.currentEnemyType.delay * 1000) {
            const enemyConfig = this.game.gameConfig.enemies.find(enemy => enemy.id === this.game.currentEnemyType.type);
            
            if (enemyConfig) {
                this.game.spawnEnemy(enemyConfig);
                this.game.enemySpawnIndex++;
                this.game.enemySpawnTime = 0;
                
                // Si tous les ennemis de ce type sont générés, passer au type suivant
                if (this.game.enemySpawnIndex >= this.game.currentEnemyType.count) {
                    const currentIndex = this.game.currentWaveConfig.enemies.indexOf(this.game.currentEnemyType);
                    
                    if (currentIndex < this.game.currentWaveConfig.enemies.length - 1) {
                        this.game.currentEnemyType = this.game.currentWaveConfig.enemies[currentIndex + 1];
                        this.game.enemySpawnIndex = 0;
                    } else {
                        this.game.currentEnemyType = null;
                    }
                }
            }
        }
        
        // Vérifier si la vague est terminée
        if (!this.game.currentEnemyType && this.game.enemies.length === 0) {
            this.game.waveInProgress = false;
            console.log("Vague terminée!");
            
            // Donner un bonus d'or pour avoir terminé la vague
            this.game.money += 25 + this.game.wave * 5;
            document.getElementById('money').textContent = this.game.money;
        }
    }
    
    /**
     * Met à jour les ennemis
     * @param {number} deltaTime Temps écoulé depuis la dernière frame en ms
     */
    updateEnemies(deltaTime) {
        for (let i = this.game.enemies.length - 1; i >= 0; i--) {
            const enemy = this.game.enemies[i];
            
            // Si l'ennemi est mort, le supprimer et donner de l'or
            if (!enemy.isAlive()) {
                if (!enemy.hasReachedEnd()) {
                    this.game.money += enemy.reward;
                    document.getElementById('money').textContent = this.game.money;
                } else {
                    // L'ennemi a atteint la fin du chemin
                    this.game.lives -= enemy.damage;
                    document.getElementById('lives').textContent = this.game.lives;
                    
                    // Vérifier si le joueur a perdu
                    if (this.game.lives <= 0) {
                        alert("Game Over! Vous avez perdu toutes vos vies!");
                        this.game.resetGame();
                        return;
                    }
                }
                
                this.game.enemies.splice(i, 1);
                continue;
            }
            
            // Mettre à jour la position de l'ennemi
            enemy.update(deltaTime);
        }
    }
    
    /**
     * Met à jour les tours et leurs projectiles
     * @param {number} timestamp Horodatage actuel
     */
    // updateTowers(timestamp) {
    //     // La mise à jour principale des tours est gérée par TowerManager dans Game.update()
    //     // Cependant, cette méthode reste nécessaire pour gérer les projectiles dans le cas où
    //     // des projectiles existeraient encore mais que la tour aurait été supprimée ou vendue

    //     // Récupérer toutes les tours depuis le TowerManager
    //     const towers = this.game.towers;

    //     // S'assurer que tous les projectiles sont correctement mis à jour
    //     for (const tower of towers) {
    //         // Vérifier si la tour a des projectiles actifs
    //         if (tower.projectiles && tower.projectiles.length > 0) {
    //             // Les projectiles sont déjà mis à jour lors de l'appel à tower.update()
    //             // Mais on pourrait ajouter ici des traitements spécifiques supplémentaires
    //             // liés à la gestion globale des projectiles si nécessaire
    //         }
    //     }
    // }
}