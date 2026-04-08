document.addEventListener('DOMContentLoaded', () => {
    const rawData = sessionStorage.getItem('minesweeper_score_breakdown');
    if (!rawData) {
        document.querySelector('.card').innerHTML = '<h2>No match data found.</h2><a href="/login.html" class="btn">Go to Login</a>';
        return;
    }

    const data = JSON.parse(rawData);

    const msg = document.getElementById('status-msg');
    if (data.win) {
        msg.textContent = "MISSION COMPLETE";
        msg.style.color = "#4CAF50";
    } else {
        msg.textContent = "MISSION FAILED";
        msg.style.color = "#e74c3c";
    }

    // Calculate derived fields precisely
    const cellScore = data.cellProgressScore || 0;
    const flagBonus = (data.correctFlags || 0) * 50;
    const timePenalty = -(data.elapsedTime * 2);

    document.getElementById('cell-score').textContent = cellScore;
    document.getElementById('flag-bonus').textContent = `+${flagBonus} (for ${data.correctFlags || 0} correct flags)`;
    document.getElementById('win-bonus').textContent = `+${data.winBonus}`;
    document.getElementById('time-penalty').textContent = timePenalty;
    document.getElementById('final-score').textContent = data.finalScore;
    
    // Attempted to clear session so it can't be repeatedly reloaded if we wanted, 
    // but useful to keep for user if they refresh the result page.
});
