import { db } from '../firebase.js';
import { ref, onValue, remove } from 'firebase/database';

document.addEventListener('DOMContentLoaded', () => {
    // Obfuscated password: "ieee" in base64 is aWVlZQ==
    // Obfuscated master password "CS_Society_2026" is Q1NfU29jaWV0eV8yMDI2
    const targetHash = "Q1NfU29jaWV0eV8yMDI2"; 

    // Prompt logic
    setTimeout(() => {
        const attempt = prompt("Enter ExeCom Password:");
        if (!attempt || btoa(attempt) !== targetHash) {
            document.getElementById('auth-check').textContent = "Access Denied.";
            return;
        }

        // Access Granted
        document.getElementById('auth-check').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
        loadData();
    }, 100);
});

function loadData() {
    const tbody = document.getElementById('admin-body');
    const playersRef = ref(db, 'players');

    onValue(playersRef, (snapshot) => {
        tbody.innerHTML = '';
        const data = snapshot.val();
        
        if (!data) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No players in database</td></tr>';
            return;
        }

        const players = [];
        for (const [name, stats] of Object.entries(data)) {
            players.push({ name, ...stats });
        }

        players.sort((a, b) => {
            // Sort by start time or just name
            return a.name.localeCompare(b.name);
        });

        players.forEach(p => {
            const tr = document.createElement('tr');
            
            const nTd = document.createElement('td');
            nTd.textContent = p.name;
            
            const sTd = document.createElement('td');
            sTd.textContent = p.score ?? '---';

            const cTd = document.createElement('td');
            cTd.textContent = p.cellsOpened ?? '---';

            const stTd = document.createElement('td');
            stTd.textContent = p.status;

            const aTd = document.createElement('td');
            const delBtn = document.createElement('button');
            delBtn.textContent = 'Reset';
            delBtn.className = 'btn-del';
            delBtn.onclick = () => {
                if (confirm(`Are you sure you want to delete ${p.name}'s record and allow them to play again?`)) {
                    remove(ref(db, `players/${p.name}`));
                }
            };
            aTd.appendChild(delBtn);

            tr.appendChild(nTd);
            tr.appendChild(sTd);
            tr.appendChild(cTd);
            tr.appendChild(stTd);
            tr.appendChild(aTd);
            tbody.appendChild(tr);
        });
    });
}
