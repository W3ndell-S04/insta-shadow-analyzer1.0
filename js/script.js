
// ========================================
// INSTAGRAM SHADOW ANALYZER
// ========================================

// ELEMENTOS DO HTML
const scanBtn = document.getElementById("scanBtn");
const followersInput = document.getElementById("followersFile");
const followingInput = document.getElementById("followingFile");

const resultsDiv = document.getElementById("results");
const statusDiv = document.getElementById("status");

const totalFollowersEl = document.getElementById("totalFollowers");
const totalFollowingEl = document.getElementById("totalFollowing");
const notFollowingEl = document.getElementById("notFollowing");

const userListEl = document.getElementById("userList");
const listCounterEl = document.getElementById("listCounter");
const clearScanBtn = document.getElementById("clearScan");

// LOCAL STORAGE
const STORAGE_KEY = "instaScanData";
const SCAN_KEY = "instaScanLastResult";

// ESTADO DA APLICAÇÃO
let relationshipFilter = "following";
let tagFilter = "all";

let scanData = {
    followers: [],
    following: [],
    notFollowing: []
};

// ========================================
// LOCAL STORAGE - CLASSIFICAÇÕES
// ========================================

function loadSaved() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (error) {
        console.error("Erro ao carregar classificações:", error);
        return {};
    }
}

function saveData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error("Erro ao salvar classificações:", error);
        statusDiv.innerText = "⚠️ Não foi possível salvar os dados no navegador.";
    }
}

// ========================================
// LOCAL STORAGE - SCAN
// ========================================

function saveScan(data) {
    try {
        localStorage.setItem(SCAN_KEY, JSON.stringify(data));
    } catch (error) {
        console.error("Erro ao salvar análise:", error);
        statusDiv.innerText = "⚠️ Não foi possível salvar a análise.";
    }
}

function loadScan() {
    try {
        return JSON.parse(localStorage.getItem(SCAN_KEY));
    } catch (error) {
        console.error("Erro ao recuperar análise:", error);
        return null;
    }
}

// ========================================
// NORMALIZAÇÃO DE USUÁRIOS
// ========================================

function normalizeUsername(value) {
    if (typeof value !== "string") return null;

    let username = value.trim();

    if (!username) return null;

    // Trata URLs do Instagram
    if (/^https?:\/\//i.test(username)) {
        try {
            const url = new URL(username);

            if (!url.hostname.toLowerCase().includes("instagram.com")) {
                return null;
            }

            const parts = url.pathname.split("/").filter(Boolean);

            if (parts[0] === "_u") {
                parts.shift();
            }

            username = parts[0] || "";
        } catch {
            return null;
        }
    }

    username = username
        .replace(/^@/, "")
        .replace(/^\/+|\/+$/g, "")
        .trim();

    if (
        !username ||
        username.includes("/") ||
        username.length > 30 ||
        !/^[a-zA-Z0-9._]+$/.test(username)
    ) {
        return null;
    }

    const reserved = [
        "login",
        "logout",
        "instagram",
        "threads",
        "about",
        "explore",
        "accounts",
        "direct",
        "p",
        "reel",
        "reels",
        "stories",
        "developer",
        "legal",
        "privacy",
        "terms"
    ];

    if (reserved.includes(username.toLowerCase())) {
        return null;
    }

    return username.toLowerCase();
}

// ========================================
// EXTRAÇÃO - HTML
// ========================================

function extractFromHTML(content) {
    const users = new Set();

    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");

    doc.querySelectorAll("a[href]").forEach(element => {
        const href = element.getAttribute("href");

        const usernameFromLink = normalizeUsername(href);

        if (usernameFromLink) {
            users.add(usernameFromLink);
            return;
        }

        const usernameFromText = normalizeUsername(
            element.textContent
        );

        if (usernameFromText) {
            users.add(usernameFromText);
        }
    });

    return users;
}

// ========================================
// EXTRAÇÃO - JSON
// ========================================

function extractFromJSON(content) {
    const users = new Set();

    try {
        const data = JSON.parse(content);

        function processObject(object) {
            if (!object || typeof object !== "object") {
                return;
            }

            if (Array.isArray(object)) {
                object.forEach(processObject);
                return;
            }

            if (Array.isArray(object.string_list_data)) {
                object.string_list_data.forEach(item => {
                    const username =
                        normalizeUsername(item.value) ||
                        normalizeUsername(item.href);

                    if (username) {
                        users.add(username);
                    }
                });
            }

            if (typeof object.title === "string") {
                const username = normalizeUsername(object.title);

                if (username) {
                    users.add(username);
                }
            }

            if (typeof object.username === "string") {
                const username = normalizeUsername(object.username);

                if (username) {
                    users.add(username);
                }
            }

            Object.values(object).forEach(value => {
                if (value && typeof value === "object") {
                    processObject(value);
                }
            });
        }

        processObject(data);

    } catch (error) {
        console.warn("Não foi possível interpretar o JSON:", error);
    }

    return users;
}

// ========================================
// EXTRAÇÃO - TXT / CSV
// ========================================

function extractFromText(content) {
    const users = new Set();

    const links = content.match(
        /https?:\/\/(?:www\.)?instagram\.com\/(?:_u\/)?[a-zA-Z0-9._]+\/?/gi
    ) || [];

    links.forEach(link => {
        const username = normalizeUsername(link);

        if (username) users.add(username);
    });

    const patterns = [
        /"value"\s*:\s*"([^"]+)"/gi,
        /_u\/([a-zA-Z0-9._]+)/gi
    ];

    patterns.forEach(pattern => {
        let match;

        while ((match = pattern.exec(content)) !== null) {
            const username = normalizeUsername(match[1]);

            if (username) users.add(username);
        }
    });

    content.split(/\r?\n/).forEach(line => {
        const value = line
            .trim()
            .replace(/^["']|["']$/g, "");

        const username = normalizeUsername(value);

        if (username) users.add(username);
    });

    return users;
}

// ========================================
// EXTRAÇÃO PRINCIPAL
// ========================================

function extractUsers(content, extension) {
    const ext = extension.toLowerCase();

    if (ext === "html" || ext === "htm") {
        return extractFromHTML(content);
    }

    if (ext === "json") {
        return extractFromJSON(content);
    }

    return extractFromText(content);
}

// ========================================
// LEITURA DOS ARQUIVOS
// ========================================

function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);

        reader.readAsText(file);
    });
}

// ========================================
// LISTA DO RELACIONAMENTO ATUAL
// ========================================

function getCurrentList() {
    return scanData[relationshipFilter] || [];
}

// ========================================
// FILTRO DE CLASSIFICAÇÃO
// ========================================

function applyTagFilter(users) {
    const savedData = loadSaved();

    if (tagFilter === "all") {
        return users;
    }

    return users.filter(user => {
        return savedData[user]?.tag === tagFilter;
    });
}

// ========================================
// ATUALIZAÇÃO DOS BOTÕES
// ========================================

function updateFilterButtons() {
    document
        .querySelectorAll(".relation-filters button")
        .forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.relation === relationshipFilter
            );
        });

    document
        .querySelectorAll(".tag-filters button")
        .forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.filter === tagFilter
            );
        });
}

// ========================================
// RENDERIZAÇÃO DA LISTA
// ========================================

function renderList() {
    const users = getCurrentList();
    const filteredUsers = applyTagFilter(users);
    const savedData = loadSaved();

    userListEl.innerHTML = "";

    if (filteredUsers.length === 0) {
        const emptyItem = document.createElement("li");

        emptyItem.className = "empty-state";

        emptyItem.innerText =
            users.length === 0
                ? "Nenhum usuário encontrado nesta categoria."
                : "Nenhum usuário encontrado com essa classificação.";

        userListEl.appendChild(emptyItem);
    }

    filteredUsers.forEach(user => {
        const li = document.createElement("li");

        // CHECKBOX
        const checkbox = document.createElement("input");

        checkbox.type = "checkbox";
        checkbox.checked = savedData[user]?.checked || false;
        checkbox.setAttribute(
            "aria-label",
            `Marcar ${user} como analisado`
        );

        li.classList.toggle("saved", checkbox.checked);

        checkbox.addEventListener("change", () => {
            const updatedData = loadSaved();

            updatedData[user] = updatedData[user] || {};
            updatedData[user].checked = checkbox.checked;

            saveData(updatedData);

            li.classList.toggle("saved", checkbox.checked);
        });

        // LINK DO INSTAGRAM
        const link = document.createElement("a");

        link.href = `https://www.instagram.com/${encodeURIComponent(user)}/`;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.innerText = `@${user}`;

        // TAGS
        const tagContainer = document.createElement("div");

        tagContainer.className = "tag";

        const tags = [
            { key: "keep", label: "Manter" },
            { key: "maybe", label: "Duvidoso" },
            { key: "remove", label: "Remover" }
        ];

        tags.forEach(tag => {
            const button = document.createElement("button");

            button.type = "button";
            button.innerText = tag.label;
            button.classList.add(tag.key);

            if (savedData[user]?.tag === tag.key) {
                button.classList.add("active");
            }

            button.addEventListener("click", () => {
                const updatedData = loadSaved();

                updatedData[user] = updatedData[user] || {};
                updatedData[user].tag = tag.key;

                saveData(updatedData);

                renderList();
            });

            tagContainer.appendChild(button);
        });

        li.appendChild(checkbox);
        li.appendChild(link);
        li.appendChild(tagContainer);

        userListEl.appendChild(li);
    });

    // CONTADOR
    if (listCounterEl) {
        listCounterEl.innerText =
            `Exibindo ${filteredUsers.length} de ${users.length} usuários`;
    }
}

// ========================================
// MÉTRICAS
// ========================================

function updateMetrics() {
    totalFollowersEl.innerText = scanData.followers.length;
    totalFollowingEl.innerText = scanData.following.length;
    notFollowingEl.innerText = scanData.notFollowing.length;
}

// ========================================
// FILTROS DE RELACIONAMENTO
// ========================================

document
    .querySelectorAll(".relation-filters button")
    .forEach(button => {
        button.addEventListener("click", () => {
            relationshipFilter = button.dataset.relation;

            updateFilterButtons();
            renderList();
        });
    });

// ========================================
// FILTROS DE CLASSIFICAÇÃO
// ========================================

document
    .querySelectorAll(".tag-filters button")
    .forEach(button => {
        button.addEventListener("click", () => {
            tagFilter = button.dataset.filter;

            updateFilterButtons();
            renderList();
        });
    });

// ========================================
// SCAN PRINCIPAL
// ========================================

scanBtn.addEventListener("click", async () => {
    const followersFile = followersInput.files[0];
    const followingFile = followingInput.files[0];

    if (!followersFile || !followingFile) {
        alert("Envie os arquivos de seguidores e seguindo!");
        return;
    }

    scanBtn.disabled = true;
    scanBtn.innerText = "⏳ Processando...";

    statusDiv.innerText = "⏳ Lendo arquivos do Instagram...";

    try {
        const followersContent = await readFile(followersFile);
        const followingContent = await readFile(followingFile);

        const followersExtension = followersFile.name
            .split(".").pop().toLowerCase();

        const followingExtension = followingFile.name
            .split(".").pop().toLowerCase();

        const followersSet = extractUsers(
            followersContent,
            followersExtension
        );

        const followingSet = extractUsers(
            followingContent,
            followingExtension
        );

        const followers = [...followersSet].sort();
        const following = [...followingSet].sort();

        const notFollowing = following
            .filter(user => !followersSet.has(user))
            .sort();

        // ATUALIZA DADOS
        scanData = {
            followers,
            following,
            notFollowing
        };

        relationshipFilter = "following";
        tagFilter = "all";

        // ATUALIZA INTERFACE
        updateMetrics();
        updateFilterButtons();
        renderList();

        // SALVA ANÁLISE COMPLETA
        saveScan({
            followers,
            following,
            notFollowing,
            followersCount: followers.length,
            followingCount: following.length,
            date: new Date().toISOString()
        });

        resultsDiv.classList.remove("hidden");

        statusDiv.innerText =
            `✅ Análise concluída! ${following.length} seguindo, ` +
            `${followers.length} seguidores e ` +
            `${notFollowing.length} não retribuem.`;

    } catch (error) {
        console.error("Erro durante o scan:", error);

        statusDiv.innerText =
            "❌ Erro ao processar os arquivos. Verifique os arquivos enviados.";

    } finally {
        scanBtn.disabled = false;

        scanBtn.innerHTML =
            '<i class="fa-solid fa-rocket"></i> Iniciar Scan';
    }
});

// ========================================
// CARREGAR ÚLTIMA ANÁLISE
// ========================================

window.addEventListener("load", () => {
    const savedScan = loadScan();

    if (!savedScan) return;

    const hasFollowersArray = Array.isArray(savedScan.followers);
    const hasFollowingArray = Array.isArray(savedScan.following);

    const isLegacyScan =
        !hasFollowersArray || !hasFollowingArray;

    scanData = {
        followers: hasFollowersArray ? savedScan.followers : [],
        following: hasFollowingArray ? savedScan.following : [],
        notFollowing: Array.isArray(savedScan.notFollowing)
            ? savedScan.notFollowing
            : Array.isArray(savedScan.list)
                ? savedScan.list
                : []
    };

    // Define o filtro inicial
    relationshipFilter = isLegacyScan
        ? "notFollowing"
        : "following";

    tagFilter = "all";

    // Atualiza métricas com os dados disponíveis
    updateMetrics();

    // PRESERVA AS MÉTRICAS DAS ANÁLISES ANTIGAS
    if (isLegacyScan) {
        totalFollowersEl.innerText =
            savedScan.followersCount ?? 0;

        totalFollowingEl.innerText =
            savedScan.followingCount ?? 0;

        notFollowingEl.innerText =
            scanData.notFollowing.length;
    }

    updateFilterButtons();
    renderList();

    resultsDiv.classList.remove("hidden");

    if (isLegacyScan) {
        statusDiv.innerText =
            "📂 Análise antiga carregada. Faça um novo scan para visualizar todas as listas.";
    } else {
        statusDiv.innerText =
            "📂 Última análise carregada automaticamente.";
    }
});

// ========================================
// LIMPAR ANÁLISE
// ========================================

clearScanBtn.addEventListener("click", () => {
    const confirmed = confirm(
        "Tem certeza que deseja limpar a análise atual?\n\n" +
        "Suas classificações e usuários marcados serão preservados."
    );

    if (!confirmed) return;

    // Remove somente os dados do scan
    localStorage.removeItem(SCAN_KEY);

    // Reinicia os dados
    scanData = {
        followers: [],
        following: [],
        notFollowing: []
    };

    relationshipFilter = "following";
    tagFilter = "all";

    // Limpa arquivos selecionados
    followersInput.value = "";
    followingInput.value = "";

    // Atualiza interface
    updateMetrics();
    updateFilterButtons();

    userListEl.innerHTML = "";

    if (listCounterEl) {
        listCounterEl.innerText = "";
    }

    resultsDiv.classList.add("hidden");

    statusDiv.innerText =
        "🗑️ Análise limpa. Suas classificações foram preservadas.";
});
