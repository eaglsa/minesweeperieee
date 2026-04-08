document.addEventListener('DOMContentLoaded', () => {
    const rawData = sessionStorage.getItem('minesweeper_score_breakdown');
    if (!rawData) {
        document.querySelector('.card').innerHTML = '<h2>No match data found.</h2><a href="/login.html" class="btn">Go to Login</a>';
        return;
    }

    const data = JSON.parse(rawData);

    // Calculate derived fields precisely
    const cellScore = Math.floor((data.cellsOpened / 81) * 1000);
    const timePenalty = -(data.elapsedTime * 2);

    document.getElementById('cell-score').textContent = cellScore;
    document.getElementById('win-bonus').textContent = `+${data.winBonus}`;
    document.getElementById('time-penalty').textContent = timePenalty;
    document.getElementById('final-score').textContent = data.finalScore;
    
    // Attempted to clear session so it can't be repeatedly reloaded if we wanted, 
    // but useful to keep for user if they refresh the result page.
});
