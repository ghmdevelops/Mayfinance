// Importações modulares do Firebase via CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy } 
from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// Sua configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBDO7buBIdEoImh-LDPrZdd0Ic-240VYe8",
  authDomain: "financamay.firebaseapp.com",
  projectId: "financamay",
  storageBucket: "financamay.firebasestorage.app",
  messagingSenderId: "73695993541",
  appId: "1:73695993541:web:f43de30c23e3666e579aac"
};

// Inicializando Firebase e Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Referências aos elementos do DOM
const form = document.getElementById('form-financa');
const listaTransacoes = document.getElementById('lista-transacoes');
const saldoTotalEl = document.getElementById('saldo-total');
const ctx = document.getElementById('graficoEconomia').getContext('2d');

let meuGrafico;

// Função para adicionar nova transação
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const descricao = document.getElementById('descricao').value;
    const valor = parseFloat(document.getElementById('valor').value);
    const tipo = document.getElementById('tipo').value;
    const data = document.getElementById('data').value;

    try {
        await addDoc(collection(db, "transacoes"), {
            descricao,
            valor,
            tipo,
            data,
            timestamp: new Date().getTime()
        });
        form.reset();
    } catch (error) {
        console.error("Erro ao adicionar transação: ", error);
        alert("Erro ao salvar dados!");
    }
});

// Listener em tempo real
const q = query(collection(db, "transacoes"), orderBy("data", "desc"));
onSnapshot(q, (snapshot) => {
    let saldoTotal = 0;
    const dadosMensais = {};
    listaTransacoes.innerHTML = '';

    snapshot.forEach((doc) => {
        const transacao = doc.data();
        
        const tr = document.createElement('tr');
        tr.className = "border-b";
        const corValor = transacao.tipo === 'entrada' ? 'text-green-600' : 'text-red-600';
        const sinal = transacao.tipo === 'entrada' ? '+' : '-';
        
        tr.innerHTML = `
            <td class="p-3">${transacao.data.split('-').reverse().join('/')}</td>
            <td class="p-3">${transacao.descricao}</td>
            <td class="p-3 capitalize">${transacao.tipo}</td>
            <td class="p-3 font-semibold ${corValor}">${sinal} R$ ${transacao.valor.toFixed(2)}</td>
        `;
        listaTransacoes.appendChild(tr);

        if (transacao.tipo === 'entrada') {
            saldoTotal += transacao.valor;
        } else {
            saldoTotal -= transacao.valor;
        }

        const mesAno = transacao.data.substring(0, 7);
        if (!dadosMensais[mesAno]) {
            dadosMensais[mesAno] = { entradas: 0, saidas: 0 };
        }
        if (transacao.tipo === 'entrada') {
            dadosMensais[mesAno].entradas += transacao.valor;
        } else {
            dadosMensais[mesAno].saidas += transacao.valor;
        }
    });

    saldoTotalEl.innerText = `R$ ${saldoTotal.toFixed(2)}`;
    saldoTotalEl.className = saldoTotal >= 0 ? "font-bold text-green-300" : "font-bold text-red-300";

    atualizarGrafico(dadosMensais);
});

function atualizarGrafico(dadosMensais) {
    const labels = Object.keys(dadosMensais).sort();
    const entradas = labels.map(label => dadosMensais[label].entradas);
    const saidas = labels.map(label => dadosMensais[label].saidas);

    if (meuGrafico) {
        meuGrafico.destroy();
    }

    meuGrafico = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.map(l => l.split('-').reverse().join('/')),
            datasets: [
                {
                    label: 'Entradas (R$)',
                    data: entradas,
                    backgroundColor: 'rgba(34, 197, 94, 0.6)',
                    borderColor: 'rgb(34, 197, 94)',
                    borderWidth: 1
                },
                {
                    label: 'Saídas (R$)',
                    data: saidas,
                    backgroundColor: 'rgba(239, 68, 68, 0.6)',
                    borderColor: 'rgb(239, 68, 68)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}
