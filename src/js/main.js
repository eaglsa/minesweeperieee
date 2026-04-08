/*----- constants -----*/
import { db } from '../firebase.js';
import { ref, get, update } from 'firebase/database';
import { Cell } from './cell.js';

var bombImage = '<img src="images/bomb.png">';
var flagImage = '<img src="images/flag.png">';
var wrongBombImage = '<img src="images/wrong-bomb.png">';
var sizeLookup = {
  '9': { totalBombs: 10, tableWidth: '360px' } 
};
var colors = ['', '#0000FA', '#4B802D', '#DB1300', '#202081', '#690400', '#457A7A', '#1B1B1B', '#7A7A7A'];

/*----- Auth & Game Session -----*/
const playerName = sessionStorage.getItem('minesweeper_player');
if (!playerName) {
    window.location.href = '/login.html';
} else {
    // Verify player is allowed to play (One-Shot Logic)
    get(ref(db, `players/${playerName}`)).then((snap) => {
        if (snap.exists() && snap.val().status === 'finished') {
            window.location.href = '/result.html';
        }
    });
}

/*----- app's state (variables) -----*/
var size = 9; 
var board;
var bombCount;
var elapsedTime;
var timerId;
var winner;
var flagMode = false;
window.hitBomb = false; 
let snapshotCellsOpened = -1;

/*----- cached element references -----*/
var boardEl = document.getElementById('board');

/*----- event listeners -----*/
document.getElementById('flag-toggle').addEventListener('click', function (e) {
  flagMode = !flagMode;
  var btn = e.target.closest('button');
  btn.innerHTML = `Flag Mode: <strong>${flagMode ? 'ON' : 'OFF'}</strong> <img src="images/flag.png" style="vertical-align: middle;">`;
  btn.style.backgroundColor = flagMode ? 'lightgreen' : 'lightgray';
});

// Mobile long press logic for fat-finger / touch devices
let touchTimer;
let touchDuration = 500; // 500ms for long press
boardEl.addEventListener('touchstart', function(e) {
  if (winner || window.hitBomb) return;
  const target = e.target.tagName.toLowerCase() === 'img' ? e.target.parentElement : e.target;
  if (target.classList.contains('game-cell')) {
      touchTimer = setTimeout(() => {
          handleCellInteraction(target, true); // force flag
          touchTimer = null;
      }, touchDuration);
  }
}, {passive: true});

boardEl.addEventListener('touchend', function(e) {
  if (touchTimer) {
      clearTimeout(touchTimer);
      touchTimer = null;
  }
});
boardEl.addEventListener('touchmove', function(e) {
  if (touchTimer) {
      clearTimeout(touchTimer);
      touchTimer = null;
  }
});

boardEl.addEventListener('click', function (e) {
  if (winner || window.hitBomb) return;
  var clickedEl;
  clickedEl = e.target.tagName.toLowerCase() === 'img' ? e.target.parentElement : e.target;
  handleCellInteraction(clickedEl, e.shiftKey || flagMode);
});

function handleCellInteraction(clickedEl, isFlagAction) {
  if (clickedEl.classList.contains('game-cell')) {
    if (!timerId) setTimer();
    var row = parseInt(clickedEl.dataset.row);
    var col = parseInt(clickedEl.dataset.col);
    var cell = board[row][col];
    
    if (isFlagAction && !cell.revealed) {
      if (cell.flagged || bombCount > 0) {
        bombCount += cell.flag() ? -1 : 1;
      }
    } else if (!cell.flagged) {
      window.hitBomb = cell.reveal();
      if (window.hitBomb) {
        snapshotCellsOpened = 0;
        runCodeForAllCells(c => {
          if (c.revealed && !c.bomb) snapshotCellsOpened++;
        });
        revealAll();
        clearInterval(timerId);
        clickedEl.style.backgroundColor = 'red';
      }
    }
    winner = getWinner();
    render();
  }
}

/*----- functions -----*/
function setTimer() {
  timerId = setInterval(function () {
    elapsedTime += 1;
    document.getElementById('timer').innerText = elapsedTime.toString().padStart(3, '0');
  }, 1000);
}

function revealAll() {
  board.forEach(function (rowArr) {
    rowArr.forEach(function (cell) {
      cell.reveal();
    });
  });
}

function buildTable() {
  var topRow = `
  <tr>
    <td class="menu" id="window-title-bar" colspan="${size}">
      <div id="window-title"><img src="images/mine-menu-icon.png"> IEEE Minesweeper</div>
      <div id="window-controls"><img src="images/window-controls.png"></div>
    </td>
  </tr>
    <tr>
      <td class="menu" colspan="${size}">
          <section id="status-bar">
            <div id="bomb-counter">000</div>
            <div id="reset"><img src="images/smiley-face.png"></div>
            <div id="timer">000</div>
          </section>
      </td>
    </tr>
    `;
  boardEl.innerHTML = topRow + `<tr>${'<td class="game-cell"></td>'.repeat(size)}</tr>`.repeat(size);
  boardEl.style.width = sizeLookup[size].tableWidth;
  
  var cells = Array.from(document.querySelectorAll('td:not(.menu)'));
  cells.forEach(function (cell, idx) {
    cell.setAttribute('data-row', Math.floor(idx / size));
    cell.setAttribute('data-col', idx % size);
  });
}

function buildArrays() {
  var arr = Array(size).fill(null);
  arr = arr.map(function () {
    return new Array(size).fill(null);
  });
  return arr;
}

function buildCells() {
  board.forEach(function (rowArr, rowIdx) {
    rowArr.forEach(function (slot, colIdx) {
      board[rowIdx][colIdx] = new Cell(rowIdx, colIdx, board);
    });
  });
  addBombs();
  runCodeForAllCells(function (cell) {
    cell.calcAdjBombs();
  });
}

function init() {
  buildTable();
  board = buildArrays();
  buildCells();
  bombCount = getBombCount();
  elapsedTime = 0;
  clearInterval(timerId);
  timerId = null;
  window.hitBomb = false;
  winner = false;
  snapshotCellsOpened = -1;
}

function getBombCount() {
  var count = 0;
  board.forEach(function (row) {
    count += row.filter(function (cell) {
      return cell.bomb;
    }).length
  });
  return count;
}

function addBombs() {
  var currentTotalBombs = sizeLookup[`${size}`].totalBombs;
  while (currentTotalBombs !== 0) {
    var row = Math.floor(Math.random() * size);
    var col = Math.floor(Math.random() * size);
    var currentCell = board[row][col]
    if (!currentCell.bomb) {
      currentCell.bomb = true
      currentTotalBombs -= 1
    }
  }
}

function getWinner() {
  let totalFlags = 0;
  let correctFlags = 0;
  for (var row = 0; row < board.length; row++) {
    for (var col = 0; col < board[0].length; col++) {
      var cell = board[row][col];
        if (cell.flagged) {
            totalFlags++;
            if (cell.bomb) correctFlags++;
        }
    }
  }
  return (totalFlags === 10 && correctFlags === 10);
}

async function finalizeGame() {
    clearInterval(timerId);
    let cellsOpened = 0;
    if (snapshotCellsOpened !== -1) {
        cellsOpened = snapshotCellsOpened;
    } else {
        runCodeForAllCells(c => {
            if (c.revealed && !c.bomb) cellsOpened++;
        });
    }

    let correctFlags = 0;
    let totalFlags = 0;
    runCodeForAllCells(c => {
        if (c.flagged) {
            totalFlags++;
            if (c.bomb) correctFlags++;
        }
    });
    
    // All or nothing logic for WinBonus and Status
    let winBonus = 0;
    let statusWin = false;
    if (correctFlags === 10 && totalFlags === 10) {
        winBonus = 2000;
        statusWin = true;
    } else {
        winBonus = 0;
        statusWin = false;
    }
    
    // Formula: FinalScore = max(0, (CellsOpened / 71 * 1000) + (CorrectFlags * 50) + WinBonus - (Seconds * 2))
    let cellProgressScore = Math.floor((cellsOpened / 71) * 1000);
    let flagBonusPnts = correctFlags * 50;
    let finalScore = Math.floor(cellProgressScore + flagBonusPnts + winBonus - (elapsedTime * 2));
    finalScore = Math.max(0, finalScore);
    
    sessionStorage.setItem('minesweeper_score_breakdown', JSON.stringify({
        cellsOpened,
        cellProgressScore,
        correctFlags,
        winBonus,
        elapsedTime,
        finalScore,
        win: statusWin
    }));
    
    if (playerName) {
        await update(ref(db, `players/${playerName}`), {
            status: 'finished',
            score: finalScore,
            cellsOpened: cellsOpened,
            timeElapsed: elapsedTime,
            win: statusWin
        });
    }
    
    setTimeout(() => {
        window.location.href = '/result.html';
    }, 2000); // 2 second delay before kick
}

let isFinalizing = false;
function render() {
  document.getElementById('bomb-counter').innerText = bombCount.toString().padStart(3, '0');
  var tdList = Array.from(document.querySelectorAll('[data-row]'));
  tdList.forEach(function (td) {
    var rowIdx = parseInt(td.getAttribute('data-row'));
    var colIdx = parseInt(td.getAttribute('data-col'));
    var cell = board[rowIdx][colIdx];
    if (cell.flagged) {
      td.innerHTML = flagImage;
    } else if (cell.revealed) {
      if (cell.bomb) {
        td.innerHTML = bombImage;
      } else if (cell.adjBombs) {
        td.className = 'revealed'
        td.style.color = colors[cell.adjBombs];
        td.textContent = cell.adjBombs;
      } else {
        td.className = 'revealed'
      }
    } else {
      td.innerHTML = '';
    }
  });
  
  if (window.hitBomb) {
    document.getElementById('reset').innerHTML = '<img src=images/dead-face.png>';
    runCodeForAllCells(function (cell) {
      if (!cell.bomb && cell.flagged) {
        var td = document.querySelector(`[data-row="${cell.row}"][data-col="${cell.col}"]`);
        td.innerHTML = wrongBombImage;
      }
    });
    if(!isFinalizing) {
        isFinalizing = true;
        finalizeGame();
    }
  } else if (winner) {
    document.getElementById('reset').innerHTML = '<img src=images/cool-face.png>';
    if(!isFinalizing) {
        isFinalizing = true;
        finalizeGame();
    }
  }
}

function runCodeForAllCells(cb) {
  board.forEach(function (rowArr) {
    rowArr.forEach(function (cell) {
      cb(cell);
    });
  });
}

init();
render();