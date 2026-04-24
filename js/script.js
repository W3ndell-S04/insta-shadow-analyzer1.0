const scanBtn = document.getElementById("scanBtn");
const followersInput = document.getElementById("followersFile");
const followingInput = document.getElementById("followingFile");

const resultsDiv = document.getElementById("results");
const statusDiv = document.getElementById("status");

const totalFollowersEl = document.getElementById("totalFollowers");
const totalFollowingEl = document.getElementById("totalFollowing");
const notFollowingEl = document.getElementById("notFollowing");
const userListEl = document.getElementById("userList");

const STORAGE_KEY = "instaScanData";
const SCAN_KEY = "instaScanLastResult";

let currentFilter = "all";
let originalList = [];

// =============================
// 📦 LOCAL STORAGE (DECISÕES)
// =============================
function loadSaved() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// =============================
// ☁️ STORAGE DO SCAN
// =============================
function saveScan(data) {
    localStorage.setItem(SCAN_KEY, JSON.stringify(data));
}

function loadScan() {
    return JSON.parse(localStorage.getItem(SCAN_KEY));
}

// =============================
// 🔍 EXTRAÇÃO
// =============================
function extractUsers(content, ext) {
    let users = new Set();

    if (ext === "html") {
        let parser = new DOMParser();
        let doc = parser.parseFromString(content, "text/html");

        doc.querySelectorAll("a, td").forEach(el => {
            let text = el.textContent.trim();
            if (text) users.add(text);
        });
    } else {
        let regex = /(?<=_u\/)[a-zA-Z0-9._]+|(?<="value": ")[a-zA-Z0-9._]+/g;
        let found = content.match(regex) || [];

        if (found.length === 0) {
            found = content.match(/\b[a-zA-Z0-9._]{3,30}\b/g) || [];
        }

        found.forEach(u => users.add(u));
    }

    let cleanUsers = new Set();
    users.forEach(u => {
        let username = u.split("/").pop().replace("_u/", "").trim();
        if (
            !["login", "instagram", "threads", "about"].includes(username.toLowerCase()) &&
            isNaN(username)
        ) {
            cleanUsers.add(username);
        }
    });

    return cleanUsers;
}

// =============================
// 📂 FILE READER
// =============================
function readFile(file) {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

// =============================
// 🎯 FILTRO
// =============================
function applyFilter(users) {
    const savedData = loadSaved();

    if (currentFilter === "all") return users;

    return users.filter(user => savedData[user]?.tag === currentFilter);
}

// =============================
// 🎯 RENDER LISTA
// =============================
function renderList(users) {
    const savedData = loadSaved();
    const filteredUsers = applyFilter(users);

    userListEl.innerHTML = "";

    filteredUsers.forEach(user => {
        let li = document.createElement("li");

        if (savedData[user]) {
            li.classList.add("saved");
        }

        // Checkbox
        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = savedData[user]?.checked || false;

        checkbox.addEventListener("change", () => {
            savedData[user] = savedData[user] || {};
            savedData[user].checked = checkbox.checked;
            saveData(savedData);
        });

        // Link
        let link = document.createElement("a");
        link.href = `https://www.instagram.com/${user}`;
        link.target = "_blank";
        link.innerText = user;

        // Tags
        let tagContainer = document.createElement("div");
        tagContainer.className = "tag";

        const tags = [
            { key: "keep", label: "Manter" },
            { key: "maybe", label: "Duvidoso" },
            { key: "remove", label: "Remover" }
        ];

        tags.forEach(t => {
            let btn = document.createElement("button");
            btn.innerText = t.label;
            btn.classList.add(t.key);

            if (savedData[user]?.tag === t.key) {
                btn.classList.add("active");
            }

            btn.addEventListener("click", () => {
                savedData[user] = savedData[user] || {};
                savedData[user].tag = t.key;

                tagContainer.querySelectorAll("button").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");

                li.classList.add("saved");

                saveData(savedData);

                // 🔄 re-render com filtro ativo
                renderList(originalList);
            });

            tagContainer.appendChild(btn);
        });

        li.appendChild(checkbox);
        li.appendChild(link);
        li.appendChild(tagContainer);

        userListEl.appendChild(li);
    });
}

// =============================
// 🎛️ FILTROS
// =============================
document.querySelectorAll(".filters button").forEach(btn => {
    btn.addEventListener("click", () => {
        currentFilter = btn.dataset.filter;

        document.querySelectorAll(".filters button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        renderList(originalList);
    });
});

// =============================
// 🚀 SCAN
// =============================
scanBtn.addEventListener("click", async () => {
    const followersFile = followersInput.files[0];
    const followingFile = followingInput.files[0];

    if (!followersFile || !followingFile) {
        alert("Envie os dois arquivos!");
        return;
    }

    statusDiv.innerText = "⏳ Processando...";

    try {
        const followersContent = await readFile(followersFile);
        const followingContent = await readFile(followingFile);

        const followers = extractUsers(
            followersContent,
            followersFile.name.split(".").pop().toLowerCase()
        );

        const following = extractUsers(
            followingContent,
            followingFile.name.split(".").pop().toLowerCase()
        );

        const notFollowing = [...following].filter(u => !followers.has(u)).sort();

        originalList = notFollowing;

        // métricas
        totalFollowersEl.innerText = followers.size;
        totalFollowingEl.innerText = following.size;
        notFollowingEl.innerText = notFollowing.length;

        // salvar scan
        saveScan({
            list: notFollowing,
            followersCount: followers.size,
            followingCount: following.size
        });

        renderList(originalList);

        statusDiv.innerText = "✅ Análise concluída!";
        resultsDiv.classList.remove("hidden");

    } catch (err) {
        console.error(err);
        statusDiv.innerText = "❌ Erro ao processar arquivos.";
    }
});

// =============================
// 🔄 AUTO LOAD
// =============================
window.addEventListener("load", () => {
    const savedScan = loadScan();

    if (savedScan) {
        originalList = savedScan.list;

        totalFollowersEl.innerText = savedScan.followersCount;
        totalFollowingEl.innerText = savedScan.followingCount;
        notFollowingEl.innerText = savedScan.list.length;

        renderList(originalList);

        resultsDiv.classList.remove("hidden");
        statusDiv.innerText = "📂 Última análise carregada automaticamente";
    }
});