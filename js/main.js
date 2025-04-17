// Attendre que le DOM soit complètement chargé
document.addEventListener('DOMContentLoaded', () => {
    // Récupérer l'élément conteneur du jeu
    const gameBoard = document.getElementById('gameBoard');
    
    // Vérifier si l'élément a été trouvé
    if (!gameBoard) {
        console.error("Élément gameBoard non trouvé dans le document.");
        return;
    }
    
    // Initialiser le jeu
    const game = new Game(gameBoard);
    
    // Afficher des instructions pour le joueur
    console.log("Jeu de Tower Defense initialisé! Sélectionnez une tour et placez-la sur la carte pour défendre contre les vagues d'ennemis.");
});