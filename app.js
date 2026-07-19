import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBDO7buBIdEoImh-LDPrZdd0Ic-240VYe8",
  authDomain: "financamay.firebaseapp.com",
  projectId: "financamay",
  storageBucket: "financamay.firebasestorage.app",
  messagingSenderId: "73695993541",
  appId: "1:73695993541:web:f43de30c23e3666e579aac"
};

const db = getFirestore(initializeApp(firebaseConfig));
const form = document.getElementById('form-financa');
const lista = document.getElementById('lista-transacoes');
const saldoEl = document.getElementById('saldo-total');

// Formatação profissional
const formatar = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

// Submit com Validação
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        await addDoc(collection(db, "transacoes"), {
            descricao: document.getElementById('descricao').value,
            valor: parseFloat(document.getElementById('valor').value),
            tipo: document.getElementById('tipo').value,
            data: document.getElementById('data').value,
            timestamp: Date.now()
        });
        Swal.fire('Sucesso!', 'Transação registrada com sucesso.', 'success');
        form.reset();
    } catch (err) {
        Swal.fire('Erro!', 'Falha ao conectar com o banco.', 'error');
    }
});

// Deleção com confirmação (Modal)
lista.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-btn')) {
        const id = e.target.dataset.id;
        const result = await Swal.fire({ title: 'Excluir?', text: "Esta ação é irreversível", icon: 'warning', showCancelButton: true });
        if (result.isConfirmed) await deleteDoc(doc(db, "transacoes", id));
    }
});

// Renderização dinâmica
onSnapshot(query(collection(db, "transacoes"), orderBy("data", "desc")), (snap) => {
    let saldo = 0;
    lista.innerHTML = '';
    snap.forEach((doc) => {
        const t = doc.data();
        saldo += (t.tipo === 'entrada' ? t.valor : -t.valor);
        lista.innerHTML += `
            <tr class="border-b">
                <td class="p-3">${t.data}</td>
                <td class="p-3">${t.descricao}</td>
                <td class="p-3 font-bold ${t.tipo === 'entrada' ? 'text-green-500' : 'text-red-500'}">${t.tipo.toUpperCase()}</td>
                <td class="p-3 text-right font-mono">${formatar(t.valor)}</td>
                <td class="p-3 text-center"><button class="delete-btn text-red-400" data-id="${doc.id}">🗑️</button></td>
            </tr>
        `;
    });
    saldoEl.innerText = formatar(saldo);
});
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
