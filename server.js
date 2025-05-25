const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const { generatePuzzle, isValidMove, isSolved } = require('./game/sudoku.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { /* options if needed */ });

// Initialize game state
// Create a deep copy for the initial puzzle to compare against for fixed cells
const initialPuzzle = JSON.parse(JSON.stringify(generatePuzzle()));
// Create a deep copy for the current board state that will be modified
let currentBoard = JSON.parse(JSON.stringify(generatePuzzle()));


// Serve static files from the 'public' directory
app.use(express.static('public'));

// Route for the homepage
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Start the server
const PORT = process.env.PORT || 3000;

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Send the current board to the newly connected client
  socket.emit('update_board', currentBoard);

  // Handle new moves from clients
  socket.on('new_move', (data) => {
    console.log('Received move:', data);
    const { row, col, value } = data;

    // Validate the move data structure and types
    if (typeof row !== 'number' || typeof col !== 'number' || typeof value !== 'number' ||
        row < 0 || row >= 9 || col < 0 || col >= 9 || value < 0 || value > 9) {
      console.error('Invalid move data received (format/range):', data);
      socket.emit('move_invalid', { row, col, value, message: 'Invalid data format or range.' });
      return;
    }

    // Check if the cell is part of the original puzzle (fixed cell)
    if (initialPuzzle[row][col] !== 0) {
      console.log('Attempt to change a fixed cell:', data);
      socket.emit('move_invalid', { row, col, value, message: 'Cannot change a fixed number.' });
      return;
    }
    
    // If value is 0, it's a clear move.
    // If value is 1-9, it's a placement, check its validity.
    if (value === 0 || isValidMove(currentBoard, row, col, value)) {
      currentBoard[row][col] = value; // Update the board
      console.log('Board updated. Broadcasting to all clients.');
      io.emit('update_board', currentBoard); // Broadcast the entire new board

      // Check if the puzzle is solved, only if a number was placed (not cleared)
      if (value !== 0 && isSolved(currentBoard)) {
        io.emit('game_over', { message: 'Sudoku Solved! Congratulations!' });
        console.log('Game Over! Puzzle Solved!');
      }
    } else {
      console.log('Invalid move (rule violation):', data);
      socket.emit('move_invalid', { row, col, value, message: 'This move violates Sudoku rules.' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
