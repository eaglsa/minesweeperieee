import { db } from '../firebase.js';
import { ref, onValue } from 'firebase/database';

document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.getElementById('leaderboard-body');
    const playersRef = ref(db, 'players');

    onValue(playersRef, (snapshot) => {
        tbody.innerHTML = ''; // clear loading
        const data = snapshot.val();
        
        if (!data) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No players yet</td></tr>';
            return;
        }

        const players = [];
        for (const [name, stats] of Object.entries(data)) {
            players.push({ name, ...stats });
        }

        // Sort: Finished players by score descending, then playing
        players.sort((a, b) => {
            if (a.status === 'finished' && b.status !== 'finished') return -1;
            if (a.status !== 'finished' && b.status === 'finished') return 1;
            if (a.status === 'finished' && b.status === 'finished') {
                return (b.score || 0) - (a.score || 0); // Descending score
            }
            return 0;
        });

        let rank = 1;
        players.forEach(p => {
            const tr = document.createElement('tr');
            
            const rTd = document.createElement('td');
            rTd.textContent = p.status === 'finished' ? rank++ : '-';
            
            const nTd = document.createElement('td');
            nTd.textContent = p.name;
            
            const sTd = document.createElement('td');
            sTd.textContent = p.status === 'finished' ? (p.score || 0) : '---';

            const stTd = document.createElement('td');
            if (p.status === 'playing') {
                stTd.textContent = 'In Match';
                stTd.className = 'status-playing';
            } else {
                stTd.textContent = 'Completed';
                stTd.className = 'status-finished';
            }

            tr.appendChild(rTd);
            tr.appendChild(nTd);
            tr.appendChild(sTd);
            tr.appendChild(stTd);
            tbody.appendChild(tr);
        });
    });
});
