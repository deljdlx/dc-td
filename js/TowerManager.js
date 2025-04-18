/**
 * Classe responsable de la gestion des tourelles (achat, placement, déplacement)
 */
class TowerManager {
    /**
     * Crée un nouveau gestionnaire de tourelles
     * @param {Game} game Référence au jeu
     * @param {HTMLElement} gameBoard Élément conteneur du jeu
     * @param {Map} map Référence à la carte du jeu
     */
    constructor(game, gameBoard, map) {
        this.game = game;
        this.gameBoard = gameBoard;
        this.map = map;
        
        // Propriétés pour les tours
        this.towers = [];
        this.selectedTowerType = null;
        this.selectedTower = null;
        
        // Propriétés pour le drag and drop des tours
        this.isDragging = false;
        this.dragTower = null;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.placeholderTower = null;
        
        this.setupEventListeners();
    }
    
    /**
     * Configure les écouteurs d'événements pour la gestion des tourelles
     */
    setupEventListeners() {
        // Gestion des clics sur le plateau de jeu
        this.gameBoard.addEventListener('click', (e) => {
            // Ne pas traiter les clics si on est en train de faire un drag and drop
            if (this.isDragging) return;
            
            const rect = this.gameBoard.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.handleBoardClick(x, y);
        });
        
        // Événements pour le drag and drop
        this.gameBoard.addEventListener('mousedown', (e) => {
            const rect = this.gameBoard.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.handleMouseDown(x, y);
        });
        
        this.gameBoard.addEventListener('mousemove', (e) => {
            const rect = this.gameBoard.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.handleMouseMove(x, y);
        });
        
        this.gameBoard.addEventListener('mouseup', (e) => {
            const rect = this.gameBoard.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.handleMouseUp(x, y);
        });
        
        // Gérer aussi le cas où la souris sort du plateau pendant le drag
        this.gameBoard.addEventListener('mouseleave', () => {
            if (this.isDragging) {
                this.cancelDrag();
            }
        });
        
        // Drag and drop depuis les boutons de tours
        document.getElementById('tower-buttons').addEventListener('mousedown', (e) => {
            if (e.target.closest('.tower-button')) {
                const button = e.target.closest('.tower-button');
                const towerId = button.dataset.towerId;
                this.startDragFromButton(towerId, e.clientX, e.clientY);
                e.preventDefault(); // Empêcher la sélection de texte
            }
        });
    }
    
    /**
     * Crée les boutons pour sélectionner les tours
     * @param {Array} towerConfigs Configuration des tours disponibles
     */
    createTowerButtons(towerConfigs) {
        const container = document.getElementById('tower-buttons');
        container.innerHTML = '';
        
        towerConfigs.forEach(tower => {
            const button = document.createElement('button');
            button.classList.add('tower-button');
            button.innerHTML = `
                <div>${tower.name}</div>
                <div>Coût: ${tower.cost}</div>
            `;
            
            button.addEventListener('click', () => {
                this.selectTowerType(tower.id);
            });
            
            button.dataset.towerId = tower.id;
            container.appendChild(button);
        });
    }
    
    /**
     * Sélectionne un type de tour à construire
     * @param {string} towerId ID du type de tour
     */
    selectTowerType(towerId) {
        // Désélectionner la tour actuellement sélectionnée
        if (this.selectedTower) {
            this.selectedTower.setSelected(false);
            this.selectedTower = null;
        }
        
        // Mettre à jour le bouton sélectionné
        document.querySelectorAll('.tower-button').forEach(button => {
            button.classList.remove('selected');
            if (button.dataset.towerId === towerId) {
                button.classList.add('selected');
            }
        });
        
        this.selectedTowerType = towerId;
    }
    
    /**
     * Commence le drag d'une tour depuis un bouton
     * @param {string} towerId ID du type de tour
     * @param {number} clientX Position X du curseur dans la page
     * @param {number} clientY Position Y du curseur dans la page
     */
    startDragFromButton(towerId, clientX, clientY) {
        const towerConfig = this.game.gameConfig.towers.find(tower => tower.id === towerId);
        
        if (!towerConfig) {
            console.error(`Type de tour inconnu: ${towerId}`);
            return;
        }
        
        // Vérifier si le joueur a assez d'argent
        if (this.game.money < towerConfig.cost) {
            console.log("Pas assez d'or pour construire cette tour!");
            return;
        }
        
        // Créer une tour temporaire pour le drag
        this.isDragging = true;
        this.selectedTowerType = towerId;
        
        // Taille de la tour
        const towerSize = this.map.cellSize * 0.7;
        
        // Calculer la position initiale (relative au plateau)
        const rect = this.gameBoard.getBoundingClientRect();
        const boardX = clientX - rect.left;
        const boardY = clientY - rect.top;
        
        // Créer un élément visuel pour représenter la tour pendant le drag
        this.createPlaceholderTower(towerConfig, boardX, boardY, towerSize);
        
        // Désélectionner la tour actuellement sélectionnée
        if (this.selectedTower) {
            this.selectedTower.setSelected(false);
            this.selectedTower = null;
        }
        
        // Ajout d'une classe au document pour indiquer qu'on est en train de faire un drag
        document.body.classList.add('dragging-tower');
        
        // S'assurer que les gestionnaires d'événements ne sont pas ajoutés plusieurs fois
        document.removeEventListener('mousemove', this.handleDocumentMouseMove);
        document.removeEventListener('mouseup', this.handleDocumentMouseUp);
        
        // Ajouter des gestionnaires d'événements au document pour gérer le drag
        document.addEventListener('mousemove', this.handleDocumentMouseMove);
        document.addEventListener('mouseup', this.handleDocumentMouseUp);
    }
    
    /**
     * Crée un élément visuel pour représenter la tour pendant le drag
     */
    createPlaceholderTower(towerConfig, x, y, size) {
        // Supprimer l'ancien placeholderTower s'il existe
        if (this.placeholderTower) {
            this.placeholderTower.remove();
        }
        
        // Créer un nouvel élément pour représenter la tour en cours de drag
        this.placeholderTower = document.createElement('div');
        this.placeholderTower.className = 'placeholder-tower';
        this.placeholderTower.style.width = `${size}px`;
        this.placeholderTower.style.height = `${size}px`;
        this.placeholderTower.style.backgroundColor = towerConfig.color;
        this.placeholderTower.style.left = `${x - size / 2}px`;
        this.placeholderTower.style.top = `${y - size / 2}px`;
        
        // Créer un élément pour représenter la portée
        const rangeElement = document.createElement('div');
        rangeElement.className = 'tower-range';
        rangeElement.style.width = `${towerConfig.range * 2}px`;
        rangeElement.style.height = `${towerConfig.range * 2}px`;
        rangeElement.style.left = `${x - towerConfig.range}px`;
        rangeElement.style.top = `${y - towerConfig.range}px`;
        
        // Ajouter les éléments au jeu
        this.gameBoard.appendChild(this.placeholderTower);
        this.gameBoard.appendChild(rangeElement);
        
        // Stocker une référence à l'élément de portée
        this.placeholderTower.rangeElement = rangeElement;
        
        // Stocker la configuration et la taille pour pouvoir y accéder plus tard
        this.placeholderTower.config = towerConfig;
        this.placeholderTower.size = size;
    }
    
    /**
     * Met à jour la position du placeholder de la tour
     */
    updatePlaceholderPosition(x, y) {
        if (this.placeholderTower) {
            const size = this.placeholderTower.size;
            const range = this.placeholderTower.config.range;
            
            // Récupérer la cellule sous le curseur
            const cell = this.map.getCellFromCoordinates(x, y);
            const isValid = this.map.isBuildable(cell.x, cell.y) && !this.towerExistsAt(cell.x, cell.y);
            
            // Obtenir le centre de la cellule si l'emplacement est valide
            let posX = x;
            let posY = y;
            
            if (isValid) {
                // Utiliser les coordonnées du centre de la cellule pour afficher le placeholder
                const cellCenter = this.map.getCellCenter(cell.x, cell.y);
                posX = cellCenter.x;
                posY = cellCenter.y;
            }
            
            // Mettre à jour la position visuelle du placeholder
            this.placeholderTower.style.left = `${posX - size / 2}px`;
            this.placeholderTower.style.top = `${posY - size / 2}px`;
            
            if (this.placeholderTower.rangeElement) {
                this.placeholderTower.rangeElement.style.left = `${posX - range}px`;
                this.placeholderTower.rangeElement.style.top = `${posY - range}px`;
            }
            
            // Supprimer tous les marquages précédents
            this.map.clearCellMarkers();
            
            // Ajouter le nouveau marquage
            this.map.markCell(cell.x, cell.y, isValid);
        }
    }
    
    /**
     * Supprime le placeholder de la tour
     */
    removePlaceholderTower() {
        if (this.placeholderTower) {
            if (this.placeholderTower.rangeElement) {
                this.placeholderTower.rangeElement.remove();
            }
            this.placeholderTower.remove();
            this.placeholderTower = null;
            
            // Supprimer tous les marquages de cellules
            this.map.clearCellMarkers();
        }
    }
    
    /**
     * Gère le mousedown sur le plateau
     * @param {number} x Coordonnée X de la souris
     * @param {number} y Coordonnée Y de la souris
     */
    handleMouseDown(x, y) {
        // Vérifier si on sélectionne une tour existante pour la déplacer
        for (const tower of this.towers) {
            const distance = Utils.distance(
                {x, y},
                {x: tower.x, y: tower.y}
            );
            
            if (distance < tower.size / 2) {
                this.isDragging = true;
                this.dragTower = tower;
                
                // Calculer l'offset comme la différence entre la position du clic et le centre de la tour
                this.dragStartX = x - tower.x;
                this.dragStartY = y - tower.y;
                
                // Désélectionner la tour précédente
                if (this.selectedTower && this.selectedTower !== tower) {
                    this.selectedTower.setSelected(false);
                }
                
                // Sélectionner cette tour
                tower.setSelected(true);
                this.selectedTower = tower;
                this.selectedTowerType = null;
                
                // Désélectionner les boutons de tour
                document.querySelectorAll('.tower-button').forEach(button => {
                    button.classList.remove('selected');
                });
                
                document.body.classList.add('dragging-tower');
                return;
            }
        }
    }
    
    /**
     * Gère le mousemove sur le plateau
     * @param {number} x Coordonnée X de la souris
     * @param {number} y Coordonnée Y de la souris
     */
    handleMouseMove(x, y) {
        if (this.isDragging && this.dragTower) {
            // Déplacer la tour en drag
            this.dragTower.x = x - this.dragStartX;
            this.dragTower.y = y - this.dragStartY;
            
            // Mettre à jour la position visuelle de la tour
            this.dragTower.updatePosition();
            
            // Mettre à jour le marquage de cellule pour indiquer si l'emplacement est valide
            const cell = this.map.getCellFromCoordinates(x - this.dragStartX, y - this.dragStartY);
            const isValid = this.map.isBuildable(cell.x, cell.y) && !this.towerExistsAt(cell.x, cell.y, this.dragTower);
            
            // Supprimer tous les marquages précédents
            this.map.clearCellMarkers();
            
            // Ajouter le nouveau marquage
            this.map.markCell(cell.x, cell.y, isValid);
        }
    }
    
    /**
     * Gère le mouseup sur le plateau
     * @param {number} x Coordonnée X de la souris
     * @param {number} y Coordonnée Y de la souris
     */
    handleMouseUp(x, y) {
        if (!this.isDragging) return;
        
        if (this.dragTower) {
            // Si c'est une tour existante qu'on déplace
            const cell = this.map.getCellFromCoordinates(this.dragTower.x, this.dragTower.y);
            
            if (this.map.isBuildable(cell.x, cell.y) && !this.towerExistsAt(cell.x, cell.y, this.dragTower)) {
                // Mettre à jour la position de la tour
                const cellCenter = this.map.getCellCenter(cell.x, cell.y);
                this.dragTower.x = cellCenter.x;
                this.dragTower.y = cellCenter.y;
                this.dragTower.updatePosition();
            } else {
                // Remettre la tour à sa position d'origine
                const originalCell = this.map.getCellFromCoordinates(this.dragTower.x, this.dragTower.y);
                const cellCenter = this.map.getCellCenter(originalCell.x, originalCell.y);
                this.dragTower.x = cellCenter.x;
                this.dragTower.y = cellCenter.y;
                this.dragTower.updatePosition();
            }
        } else if (this.placeholderTower) {
            // Si c'est une nouvelle tour qu'on place depuis un bouton
            const cell = this.map.getCellFromCoordinates(x, y);
            
            if (this.map.isBuildable(cell.x, cell.y) && !this.towerExistsAt(cell.x, cell.y)) {
                this.placeTower(cell.x, cell.y);
            }
        }
        
        // Supprimer tous les marquages de cellules
        this.map.clearCellMarkers();
        
        this.cancelDrag();
    }
    
    /**
     * Place une nouvelle tour sur la cellule spécifiée
     * @param {number} cellX Coordonnée X de la cellule
     * @param {number} cellY Coordonnée Y de la cellule
     */
    placeTower(cellX, cellY) {
        // Calculer les coordonnées exactes du centre de la cellule
        const cellCenter = this.map.getCellCenter(cellX, cellY);
        
        // Créer une animation pour montrer le placement de la tour
        const placingAnimation = document.createElement('div');
        placingAnimation.className = 'tower-placing-animation';
        placingAnimation.style.width = `${this.map.cellSize}px`;
        placingAnimation.style.height = `${this.map.cellSize}px`;
        placingAnimation.style.left = `${cellX * this.map.cellSize}px`;
        placingAnimation.style.top = `${cellY * this.map.cellSize}px`;
        this.gameBoard.appendChild(placingAnimation);
        
        // Supprimer l'animation après qu'elle soit terminée
        setTimeout(() => {
            placingAnimation.remove();
        }, 300);
        
        // Construire la tour immédiatement au centre de la cellule
        const towerConfig = this.game.gameConfig.towers.find(tower => tower.id === this.selectedTowerType);
        
        if (towerConfig && this.game.money >= towerConfig.cost) {
            // Créer la tour directement
            const tower = new Tower(
                towerConfig,
                cellCenter.x,
                cellCenter.y,
                this.gameBoard,
                this.map.cellSize
            );
            
            // Ajouter la tour et déduire le coût
            this.towers.push(tower);
            this.game.money -= towerConfig.cost;
            
            // Mettre à jour l'affichage de l'or
            document.getElementById('money').textContent = this.game.money;
            
            // Indiquer que l'action a été complétée avec succès
            console.log(`Tour ${towerConfig.name} placée avec succès`);
        }
    }
    
    /**
     * Gestionnaire de mousemove sur le document pour le drag depuis les boutons
     */
    handleDocumentMouseMove = (e) => {
        if (this.isDragging) {
            const rect = this.gameBoard.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Mettre à jour la position du placeholder
            if (this.placeholderTower) {
                this.updatePlaceholderPosition(x, y);
            }
        }
    }
    
    /**
     * Gestionnaire de mouseup sur le document pour le drag depuis les boutons
     */
    handleDocumentMouseUp = (e) => {
        if (!this.isDragging || !this.placeholderTower) return;
            
        const rect = this.gameBoard.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Vérifier si le mouseup est dans le plateau
        if (x >= 0 && x < this.gameBoard.offsetWidth && y >= 0 && y < this.gameBoard.offsetHeight) {
            const cell = this.map.getCellFromCoordinates(x, y);
            
            if (this.map.isBuildable(cell.x, cell.y) && !this.towerExistsAt(cell.x, cell.y)) {
                this.placeTower(cell.x, cell.y);
            }
        }
        
        // Nettoyage
        this.removePlaceholderTower();
        this.isDragging = false;
        document.body.classList.remove('dragging-tower');
        
        // Supprimer les gestionnaires d'événements du document
        document.removeEventListener('mousemove', this.handleDocumentMouseMove);
        document.removeEventListener('mouseup', this.handleDocumentMouseUp);
        
        // Supprimer tous les marquages de cellules
        this.map.clearCellMarkers();
    }
    
    /**
     * Annule l'opération de drag en cours
     */
    cancelDrag() {
        this.isDragging = false;
        this.dragTower = null;
        
        // Supprimer le placeholder si présent
        this.removePlaceholderTower();
        
        document.body.classList.remove('dragging-tower');
        
        // Supprimer les gestionnaires d'événements du document
        document.removeEventListener('mousemove', this.handleDocumentMouseMove);
        document.removeEventListener('mouseup', this.handleDocumentMouseUp);
        
        // Supprimer tous les marquages de cellules
        this.map.clearCellMarkers();
    }
    
    /**
     * Gère les clics sur le plateau
     * @param {number} x Coordonnée X du clic
     * @param {number} y Coordonnée Y du clic
     */
    handleBoardClick(x, y) {
        // Vérifier si on sélectionne une tour existante
        for (const tower of this.towers) {
            const distance = Utils.distance(
                {x, y},
                {x: tower.x, y: tower.y}
            );
            
            if (distance < tower.size / 2) {
                // Désélectionner la tour précédente
                if (this.selectedTower) {
                    this.selectedTower.setSelected(false);
                }
                
                // Sélectionner cette tour
                tower.setSelected(true);
                this.selectedTower = tower;
                this.selectedTowerType = null;
                
                // Désélectionner les boutons de tour
                document.querySelectorAll('.tower-button').forEach(button => {
                    button.classList.remove('selected');
                });
                
                return;
            }
        }
        
        // Si un type de tour est sélectionné, essayer de le construire
        if (this.selectedTowerType) {
            const cell = this.map.getCellFromCoordinates(x, y);
            
            if (this.map.isBuildable(cell.x, cell.y) && !this.towerExistsAt(cell.x, cell.y)) {
                this.buildTower(this.selectedTowerType, cell.x, cell.y);
            }
        } else {
            // Désélectionner la tour actuelle si on clique ailleurs
            if (this.selectedTower) {
                this.selectedTower.setSelected(false);
                this.selectedTower = null;
            }
        }
    }
    
    /**
     * Construit une tour sur la carte
     * @param {string} towerId ID du type de tour
     * @param {number} x Position X (cellule)
     * @param {number} y Position Y (cellule)
     */
    buildTower(towerId, x, y) {
        const towerConfig = this.game.gameConfig.towers.find(tower => tower.id === towerId);
        
        if (!towerConfig) {
            console.error(`Type de tour inconnu: ${towerId}`);
            return;
        }
        
        // Vérifier si le joueur a assez d'argent
        if (this.game.money < towerConfig.cost) {
            console.log("Pas assez d'or pour construire cette tour!");
            return;
        }
        
        // Vérifier si une tour existe déjà à cet emplacement
        if (this.towerExistsAt(x, y)) {
            console.log("Une tour existe déjà à cet emplacement!");
            return;
        }
        
        // Calculer les coordonnées exactes du centre de la cellule
        const cellCenter = this.map.getCellCenter(x, y);
        
        // Créer la tour
        const tower = new Tower(
            towerConfig,
            cellCenter.x,
            cellCenter.y,
            this.gameBoard,
            this.map.cellSize
        );
        
        // Ajouter la tour et déduire le coût
        this.towers.push(tower);
        this.game.money -= towerConfig.cost;
        
        // Mettre à jour l'affichage de l'or
        document.getElementById('money').textContent = this.game.money;
    }
    
    /**
     * Vérifie si une tour existe déjà à un emplacement donné
     * @param {number} x Coordonnée X de la cellule
     * @param {number} y Coordonnée Y de la cellule
     * @param {Tower} excludeTower Tour à exclure de la vérification (pour déplacement)
     * @returns {boolean} Vrai si une tour existe à cet emplacement
     */
    towerExistsAt(x, y, excludeTower = null) {
        return this.towers.some(tower => {
            if (tower === excludeTower) return false;
            
            const towerCell = this.map.getCellFromCoordinates(tower.x, tower.y);
            return towerCell.x === x && towerCell.y === y;
        });
    }
    
    /**
     * Réinitialise le gestionnaire de tours
     */
    reset() {
        // Supprimer toutes les tours du DOM
        for (const tower of this.towers) {
            tower.remove();
        }
        
        // Réinitialiser les propriétés
        this.towers = [];
        this.selectedTowerType = null;
        this.selectedTower = null;
        this.isDragging = false;
        this.dragTower = null;
        
        // Désélectionner tous les boutons de tour
        document.querySelectorAll('.tower-button').forEach(button => {
            button.classList.remove('selected');
        });
    }

    /**
     * Mettre à jour les tours
     * @param {number} timestamp Horodatage actuel
     * @param {number} deltaTime Temps écoulé depuis la dernière frame en ms
     * @param {Array} enemies Liste des ennemis pour ciblage
     */
    update(timestamp, deltaTime, enemies) {
        // Mettre à jour chaque tour
        for (const tower of this.towers) {
            tower.update(enemies, timestamp, deltaTime);
        }
    }
}