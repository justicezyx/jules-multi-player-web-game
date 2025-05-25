// Initialize Socket.IO client
const socket = io();

socket.on('connect', () => {
  console.log('Connected to WebSocket server with ID:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket server.');
});

let clientBoard = [ // This will be updated by the server
  [0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0]
];
let isGameOver = false;

// This is the puzzle the client starts with before server connection or first update
const localInitialPuzzle = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9]
];


socket.on('update_board', (newBoard) => {
  console.log('Received board update:', newBoard);
  clientBoard = newBoard; // Update the client-side board state
  renderBoard(clientBoard); // Re-render the board with the new state
});

socket.on('move_invalid', (data) => {
  console.warn('Invalid move:', data);
  alert(`Invalid Move: ${data.message}\nCell: [${data.row}, ${data.col}]\nValue: ${data.value !== undefined ? data.value : 'N/A'}`);
  // The board will be corrected by the next 'update_board' if the server rejected the move.
  // Or, we could force a re-render with current clientBoard immediately if desired,
  // but the server's 'update_board' is the ultimate source of truth.
});

socket.on('game_over', (data) => {
  console.log('Game Over:', data.message);
  alert(`Game Over! ${data.message}`);
  isGameOver = true;
  renderBoard(clientBoard); // Re-render to disable inputs
});

function renderBoard(board) {
  const gridContainer = document.getElementById('sudoku-grid-container');
  gridContainer.innerHTML = ''; // Clear existing content

  // Use the global clientBoard for rendering, which is updated by 'update_board'
  const currentBoardToRender = board || clientBoard;


  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cellDiv = document.createElement('div');
      cellDiv.classList.add('grid-cell');

      // Check against the localInitialPuzzle to determine if a cell was part of the original puzzle
      // This is for styling fixed cells correctly on the client side.
      // The server's `initialPuzzle` is the source of truth for move validation.
      const isFixedByInitial = localInitialPuzzle[r][c] !== 0;


      if (currentBoardToRender[r][c] !== 0) {
        cellDiv.textContent = currentBoardToRender[r][c];
        // Add 'fixed' class if it was part of the *original* puzzle, not just any non-zero number
        if (isFixedByInitial) {
          cellDiv.classList.add('fixed');
        }
      } else {
        const input = document.createElement('input');
        input.type = 'number';
        input.min = '1';
        input.max = '9';
        input.dataset.row = r; // Store row index
        input.dataset.col = c; // Store column index

        if (isGameOver || isFixedByInitial) {
          input.disabled = true;
          // If it's a fixed cell that somehow became 0 on currentBoardToRender (should not happen if server logic is correct)
          // we should display its original fixed value. But renderBoard is called with server's board.
          // For now, if it's 0 and fixed, it means it's an input field that should be disabled and show nothing.
          // This logic primarily focuses on disabling inputs on game over.
        }

        input.addEventListener('input', function() {
          // Restrict input to a single digit
          if (this.value.length > 1) {
            this.value = this.value.slice(0, 1);
          }
        });

        input.addEventListener('change', function() {
            if (isGameOver) return; // Don't process moves if game is over

            const row = parseInt(this.dataset.row);
            const col = parseInt(this.dataset.col);
            let value = parseInt(this.value);

            if (this.value === "") {
              value = 0; // Treat empty string as clearing the cell
            }

            // Client-side check to prevent sending obviously invalid data, server validates too
            if (!isNaN(value) && value >= 0 && value <= 9) {
              console.log(`Sending move: Row ${row}, Col ${col}, Value ${value}`);
              socket.emit('new_move', { row, col, value });
            } else {
              console.log(`Invalid input by user: Row ${row}, Col ${col}, Value ${this.value}. Not sending.`);
              // Optionally, clear the input or revert to clientBoard[row][col]
              this.value = clientBoard[row][col] !== 0 ? clientBoard[row][col] : '';
            }
        });
        cellDiv.appendChild(input);
      }
      
      // Store row and col on the cellDiv for easy access if needed
      cellDiv.dataset.row = r;
      cellDiv.dataset.col = c;

      // Apply CSS classes for 3x3 subgrid borders
      if (c === 2 || c === 5) { // Columns 2 and 5 (0-indexed)
        cellDiv.classList.add('border-right');
      }
      if (r === 2 || r === 5) { // Rows 2 and 5 (0-indexed)
        cellDiv.classList.add('border-bottom');
      }

      gridContainer.appendChild(cellDiv);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Initial render with a local puzzle. Server will send 'update_board' soon after connection.
  clientBoard = JSON.parse(JSON.stringify(localInitialPuzzle)); // Start with a local copy
  renderBoard(clientBoard);
});
