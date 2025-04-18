/**
 * Constantes globales pour le jeu
 * Centralise toutes les valeurs fixes pour faciliter les modifications
 */
export const Constants = {
    // Délais et timers
    UPDATE_INTERVAL: 16, // ~60 FPS
    ENEMY_SPAWN_DELAY: 1000, // ms
    
    // Valeurs par défaut
    DEFAULT_LIVES: 20,
    DEFAULT_MONEY: 100,
    
    // Échelles et dimensions
    TILE_SIZE: 64,
    TOWER_SCALE: 0.8,
    ENEMY_SCALE: 0.7,
    PROJECTILE_SIZE: 8,
    
    // Couleurs
    COLORS: {
        PATH: '#A57939',
        GRASS: '#7CFC00',
        RANGE_INDICATOR: 'rgba(120, 120, 255, 0.3)',
        PROJECTILE: '#FF0000',
        HEALTH_BAR_BG: '#333333',
        HEALTH_BAR_FG: '#00FF00',
        TOWER_PLACEHOLDER: 'rgba(0, 255, 0, 0.3)',
        TOWER_INVALID: 'rgba(255, 0, 0, 0.3)'
    },
    
    // Types d'événements
    EVENTS: {
        WAVE_START: 'waveStart',
        WAVE_END: 'waveEnd',
        ENEMY_DEFEATED: 'enemyDefeated',
        ENEMY_REACHED_END: 'enemyReachedEnd',
        TOWER_BUILT: 'towerBuilt',
        TOWER_SOLD: 'towerSold',
        GAME_OVER: 'gameOver',
        GAME_WIN: 'gameWin'
    }
};