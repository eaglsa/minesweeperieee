import { db } from '../firebase.js';
import { ref, get, set } from 'firebase/database';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const errorMsg = document.getElementById('errorMsg');
    const username = document.getElementById('username').value.trim();
    
    if (!username) return;

    btn.disabled = true;
    btn.textContent = 'Loading...';
    errorMsg.textContent = '';

    try {
        const userRef = ref(db, `players/${username}`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
            const data = snapshot.val();
            if (data.status === 'playing') {
                // If they disconnected briefly, allow them back in.
                sessionStorage.setItem('minesweeper_player', username);
                window.location.href = '/index.html';
            } else {
                errorMsg.textContent = 'You have already played!';
            }
        } else {
            // New player
            await set(userRef, {
                status: 'playing',
                startTime: Date.now(),
                score: 0,
            });
            sessionStorage.setItem('minesweeper_player', username);
            window.location.href = '/index.html';
        }
    } catch (error) {
        console.error(error);
        errorMsg.textContent = 'Error connecting to database.';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Start Game';
    }
});
