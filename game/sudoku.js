function generatePuzzle() {
  return [
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
}

function isValidMove(board, row, col, num) {
  // Check if the cell is empty
  if (board[row][col] !== 0) {
    return false;
  }

  // Check row constraint
  for (let c = 0; c < 9; c++) {
    if (board[row][c] === num) {
      return false;
    }
  }

  // Check column constraint
  for (let r = 0; r < 9; r++) {
    if (board[r][col] === num) {
      return false;
    }
  }

  // Check 3x3 subgrid constraint
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (board[startRow + r][startCol + c] === num) {
        return false;
      }
    }
  }

  return true;
}

function isSolved(board) {
  // Check for empty cells and validate each cell
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        return false; // Board is not solved if there's an empty cell
      }
      // Temporarily set cell to 0 to use isValidMove for checking constraints
      const num = board[r][c];
      board[r][c] = 0; 
      if (!isValidMove(board, r, c, num)) {
        board[r][c] = num; // Reset cell value
        return false; // Invalid placement found
      }
      board[r][c] = num; // Reset cell value
    }
  }
  return true;
}

module.exports = {
  generatePuzzle,
  isValidMove,
  isSolved
};
