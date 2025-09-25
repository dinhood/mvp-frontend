// script.js - frontend completo integrando autenticação + despesas + metas
const baseURL = "http://127.0.0.1:5000";

const mensagemEl = document.getElementById("mensagem");

// containers
const loginContainer = document.getElementById("login-container");
const cadastroContainer = document.getElementById("cadastro-container");
const appContainer = document.getElementById("app-container");

// login elements
const loginIdent = document.getElementById("login-identificador");
const loginSenha = document.getElementById("login-senha");
const btnLogin = document.getElementById("btn-login");
const linkCadastro = document.getElementById("link-cadastro");

// cadastro elements
const cadastroNome = document.getElementById("cadastro-nome");
const cadastroEmail = document.getElementById("cadastro-email");
const cadastroCPF = document.getElementById("cadastro-cpf");
const cadastroSenha = document.getElementById("cadastro-senha");
const btnCadastrar = document.getElementById("btn-cadastrar");
const linkLogin = document.getElementById("link-login");

// app elements
const usuarioNomeEl = document.getElementById("usuario-nome");
const btnLogout = document.getElementById("btn-logout");
const descricaoInput = document.getElementById("descricao");
const valorInput = document.getElementById("valor");
const dataInput = document.getElementById("data");
const btnAdicionar = document.getElementById("btn-adicionar");
const containerTabelas = document.getElementById("containerTabelas");
const anoFiltro = document.getElementById("anoFiltro");
const mesFiltro = document.getElementById("mesFiltro");
const btnFiltrar = document.getElementById("btn-filtrar");
const btnMostrarTodas = document.getElementById("btn-mostrar-todas");

// elementos de meta
const metaAnoInput = document.getElementById("meta-ano");
const metaMesInput = document.getElementById("meta-mes");
const metaValorInput = document.getElementById("meta-valor");
const btnSalvarMeta = document.getElementById("btn-salvar-meta");

// -------------------- util --------------------
function showMessage(text, type="") {
    mensagemEl.textContent = text || "";
    mensagemEl.className = type;
    if (text) {
        setTimeout(() => { mensagemEl.textContent = ""; mensagemEl.className = ""; }, 5000);
    }
}

function formatarData(dataISO) {
    const data = new Date(dataISO);
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

function getUsuarioLogado() {
    return JSON.parse(localStorage.getItem("usuarioLogado") || "null");
}

function setUsuarioLogado(user) {
    localStorage.setItem("usuarioLogado", JSON.stringify(user));
}

function clearUsuarioLogado() {
    localStorage.removeItem("usuarioLogado");
}

// metas em memória (objeto: {userId:{ "YYYY-MM": valor } })
let metas = {};

// -------------------- views --------------------
function mostrarLogin() {
    loginContainer.classList.remove("hidden");
    cadastroContainer.classList.add("hidden");
    appContainer.classList.add("hidden");
}
function mostrarCadastro() {
    loginContainer.classList.add("hidden");
    cadastroContainer.classList.remove("hidden");
    appContainer.classList.add("hidden");
}
function mostrarApp() {
    loginContainer.classList.add("hidden");
    cadastroContainer.classList.add("hidden");
    appContainer.classList.remove("hidden");
}

// -------------------- auth (frontend -> backend) --------------------
btnLogin.addEventListener("click", async () => {
    const identificador = loginIdent.value.trim();
    const senha = loginSenha.value.trim();
    if (!identificador || !senha) { showMessage("Preencha identificador e senha", "error"); return; }

    try {
        const res = await fetch(`${baseURL}/login`, {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({ identificador, senha })
        });
        const data = await res.json();
        if (!res.ok) { showMessage(data.erro || "Erro no login", "error"); return; }
        setUsuarioLogado(data.user);
        loginIdent.value = ""; loginSenha.value = "";
        showMessage("Login efetuado!", "success");
        inicializarApp();
    } catch (err) {
        showMessage("Erro de conexão ao tentar logar", "error");
        console.error(err);
    }
});

linkCadastro.addEventListener("click", (e) => { e.preventDefault(); mostrarCadastro(); });
linkLogin.addEventListener("click", (e) => { e.preventDefault(); mostrarLogin(); });

btnCadastrar.addEventListener("click", async () => {
    const nome = cadastroNome.value.trim();
    const email = cadastroEmail.value.trim();
    const cpf = cadastroCPF.value.trim();
    const senha = cadastroSenha.value.trim();
    if (!nome || !email || !cpf || !senha) { showMessage("Preencha todos os campos do cadastro", "error"); return; }

    try {
        const res = await fetch(`${baseURL}/register`, {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({ nome, email, cpf, senha })
        });
        const data = await res.json();
        if (!res.ok) { showMessage(data.erro || "Erro ao cadastrar", "error"); return; }
        showMessage("Cadastro realizado! Faça login.", "success");
        cadastroNome.value = cadastroEmail.value = cadastroCPF.value = cadastroSenha.value = "";
        mostrarLogin();
    } catch (err) {
        showMessage("Erro de conexão ao cadastrar", "error");
        console.error(err);
    }
});

btnLogout.addEventListener("click", () => {
    clearUsuarioLogado();
    mostrarLogin();
    showMessage("Desconectado", "success");
});

// -------------------- despesas --------------------
function criarTabelaMes(ano, mes, despesasMes) {
    const div = document.createElement("div");
    const titulo = document.createElement("h3");
    titulo.textContent = `Despesas de ${String(mes).padStart(2,'0')}/${ano}`;
    div.appendChild(titulo);

    const tabela = document.createElement("table");
    tabela.innerHTML = `
        <thead>
            <tr>
                <th>ID</th><th>Descrição</th><th>Valor</th><th>Data</th><th>Ações</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    const tbody = tabela.querySelector("tbody");
    let total = 0;
    despesasMes.forEach(d => {
        total += Number(d.valor);
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${d.id}</td>
            <td>${d.descricao}</td>
            <td>R$ ${Number(d.valor).toFixed(2)}</td>
            <td>${formatarData(d.data)}</td>
            <td class="actions">
                <button onclick="editarDespesa(${d.id})">Editar</button>
                <button onclick="deletarDespesa(${d.id})">Excluir</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // linha total
    const trTotal = document.createElement("tr");
    trTotal.innerHTML = `<td colspan="2"><strong>Total do mês</strong></td><td colspan="3"><strong>R$ ${total.toFixed(2)}</strong></td>`;
    tbody.appendChild(trTotal);

    // mostrar meta se existir
    const user = getUsuarioLogado();
    if(user && metas[user.id]) {
        const key = `${ano}-${String(mes).padStart(2,'0')}`;
        const valorMeta = metas[user.id][key];
        if(valorMeta !== undefined) {
            const trMeta = document.createElement("tr");
            trMeta.innerHTML = `<td colspan="2"><strong>Meta do mês</strong></td><td colspan="3"><strong>R$ ${Number(valorMeta).toFixed(2)}</strong></td>`;
            tbody.appendChild(trMeta);
        }
    }

    div.appendChild(tabela);
    return div;
}

async function carregarDespesas() {
    const user = getUsuarioLogado();
    if (!user) return;

    try {
        const [resDespesas, resMetas] = await Promise.all([
            fetch(`${baseURL}/despesas?user_id=${user.id}`),
            fetch(`${baseURL}/metas?user_id=${user.id}`)
        ]);

        const dataDespesas = await resDespesas.json();
        const dataMetas = await resMetas.json();

        if (!resDespesas.ok) { showMessage(dataDespesas.erro || "Erro ao carregar despesas", "error"); return; }
        if (!resMetas.ok) { showMessage(dataMetas.erro || "Erro ao carregar metas", "error"); return; }

        metas[user.id] = {};
        dataMetas.metas.forEach(m => {
            const key = `${m.ano}-${String(m.mes).padStart(2,'0')}`;
            metas[user.id][key] = m.valor;
        });

        const agrupadas = {};
        dataDespesas.despesas.forEach(d => {
            const dt = new Date(d.data);
            const mes = dt.getMonth() + 1;
            const ano = dt.getFullYear();
            const key = `${ano}-${String(mes).padStart(2,'0')}`;
            if (!agrupadas[key]) agrupadas[key] = [];
            agrupadas[key].push(d);
        });

        containerTabelas.innerHTML = "";
        const keys = Object.keys(agrupadas).sort((a,b) => b.localeCompare(a));
        keys.forEach(k => {
            const [ano, mes] = k.split("-");
            const div = criarTabelaMes(ano, Number(mes), agrupadas[k]);
            containerTabelas.appendChild(div);
        });

    } catch (err) {
        showMessage("Erro de conexão ao carregar despesas/metas", "error");
        console.error(err);
    }
}

// -------------------- adicionar despesa --------------------
btnAdicionar.addEventListener("click", async () => {
    const descricao = descricaoInput.value.trim();
    const valor = valorInput.value;
    const data = dataInput.value;
    if (!descricao || !valor || !data) { showMessage("Preencha todos os campos!", "error"); return; }

    const user = getUsuarioLogado();
    if (!user) { showMessage("Usuário não logado", "error"); return; }

    try {
        const res = await fetch(`${baseURL}/despesas`, {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({ user_id: user.id, descricao, valor, data })
        });
        const resposta = await res.json();
        if (!res.ok) { showMessage(resposta.erro || "Erro ao adicionar", "error"); return; }
        showMessage(resposta.message || "Despesa adicionada", "success");
        descricaoInput.value = ""; valorInput.value = ""; dataInput.value = "";
        carregarDespesas();
    } catch (err) {
        showMessage("Erro de conexão ao adicionar despesa", "error");
        console.error(err);
    }
});

// -------------------- deletar / editar --------------------
async function deletarDespesa(id) {
    const user = getUsuarioLogado();
    if (!user) return showMessage("Usuário não logado", "error");
    if (!confirm("Confirma exclusão da despesa?")) return;

    try {
        const res = await fetch(`${baseURL}/despesas/${id}?user_id=${user.id}`, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok) { showMessage(data.erro || "Erro ao remover", "error"); return; }
        showMessage(data.message || "Removido", "success");
        carregarDespesas();
    } catch (err) {
        showMessage("Erro ao conectar ao servidor", "error");
        console.error(err);
    }
}

window.editarDespesa = async function(id) {
    const novoDesc = prompt("Nova descrição:");
    if (novoDesc === null) return;
    const novoValor = prompt("Novo valor:");
    if (novoValor === null) return;

    if (!novoDesc.trim() || !novoValor.trim()) { showMessage("Campos inválidos", "error"); return; }
    const user = getUsuarioLogado();
    if (!user) return showMessage("Usuário não logado", "error");

    try {
        const res = await fetch(`${baseURL}/despesas/${id}`, {
            method: "PUT",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({ user_id: user.id, descricao: novoDesc, valor: novoValor })
        });
        const data = await res.json();
        if (!res.ok) { showMessage(data.erro || "Erro ao editar", "error"); return; }
        showMessage(data.message || "Atualizado", "success");
        carregarDespesas();
    } catch (err) {
        showMessage("Erro ao editar despesa", "error");
        console.error(err);
    }
};

// -------------------- filtrar --------------------
btnFiltrar.addEventListener("click", async () => {
    const ano = anoFiltro.value;
    const mes = mesFiltro.value;
    if (!ano || !mes) { showMessage("Preencha ano e mês para filtrar", "error"); return; }
    const user = getUsuarioLogado();
    if (!user) return showMessage("Usuário não logado", "error");

    try {
        const res = await fetch(`${baseURL}/despesas?user_id=${user.id}`);
        const data = await res.json();
        if (!res.ok) { showMessage(data.erro || "Erro ao buscar", "error"); return; }

        const filtradas = data.despesas.filter(d => {
            const dt = new Date(d.data);
            return (dt.getFullYear() == Number(ano) && (dt.getMonth() + 1) == Number(mes));
        });

        containerTabelas.innerHTML = "";
        const div = criarTabelaMes(ano, Number(mes), filtradas);
        containerTabelas.appendChild(div);
    } catch (err) {
        showMessage("Erro ao filtrar", "error");
        console.error(err);
    }
});

btnMostrarTodas.addEventListener("click", () => {
    anoFiltro.value = ""; mesFiltro.value = "";
    carregarDespesas();
});

// -------------------- metas --------------------
btnSalvarMeta.addEventListener("click", async () => {
    const ano = metaAnoInput.value;
    const mes = metaMesInput.value;
    const valor = metaValorInput.value;
    if (!ano || !mes || !valor) { showMessage("Preencha ano, mês e valor da meta", "error"); return; }

    const user = getUsuarioLogado();
    if (!user) return showMessage("Usuário não logado", "error");

    try {
        const res = await fetch(`${baseURL}/metas`, {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({ user_id: user.id, ano, mes, valor })
        });
        const data = await res.json();
        if (!res.ok) { showMessage(data.erro || "Erro ao salvar meta", "error"); return; }

        if (!metas[user.id]) metas[user.id] = {};
        const key = `${ano}-${String(mes).padStart(2,'0')}`;
        metas[user.id][key] = Number(valor);

        showMessage(data.message || `Meta salva para ${String(mes).padStart(2,'0')}/${ano}`, "success");
        carregarDespesas();
    } catch (err) {
        showMessage("Erro ao salvar meta", "error");
        console.error(err);
    }
});

// -------------------- inicialização --------------------
function inicializarApp() {
    const user = getUsuarioLogado();
    if (!user) {
        mostrarLogin();
        return;
    }
    usuarioNomeEl.textContent = `Olá, ${user.nome}`;
    mostrarApp();
    const hoje = new Date();
    const yyyy = hoje.getFullYear();
    const mm = String(hoje.getMonth()+1).padStart(2,'0');
    const dd = String(hoje.getDate()).padStart(2,'0');
    dataInput.value = `${yyyy}-${mm}-${dd}`;

    carregarDespesas();
}

window.addEventListener("load", () => {
    inicializarApp();
});