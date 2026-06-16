// ── Conversation History (in-memory for current session) ──
window.__chatHistory = [];  // [{role: "user"|"assistant", content: "..."}, ...]

function formatTime() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0'+minutes : minutes;
    return hours + ':' + minutes + ' ' + ampm;
}

function clearChat() {
    // Save current session to history before clearing (only if there are messages)
    const messagesEl = document.getElementById('messages');
    if (messagesEl.innerHTML.trim() !== '') {
        saveCurrentSessionToHistory();
    }

    // Clear the chat UI
    messagesEl.innerHTML = '';
    document.getElementById('uploadContainer').style.display = 'flex';
    document.getElementById('dropZone').style.display = 'flex';
    document.getElementById('fileInput').value = '';
    document.getElementById('filePreview').classList.add('hidden');
    
    // Clear in-memory state
    window.__analysis = null;
    window.__chatHistory = [];
    
    // Make sure we go back to the chat tab
    switchTab('chat');
}

function clearAllHistory() {
    localStorage.removeItem('zcare_chat_history');
    renderHistoryView();
}

function saveCurrentSessionToHistory() {
    const messagesHtml = document.getElementById('messages').innerHTML;
    if (!messagesHtml.trim()) return; // Nothing to save

    const history = JSON.parse(localStorage.getItem('zcare_chat_history') || '[]');
    
    // Build a title from the first user message or fallback
    let sessionTitle = 'Chat Session';
    if (window.__chatHistory.length > 0) {
        const firstUserMsg = window.__chatHistory.find(m => m.role === 'user');
        if (firstUserMsg) {
            sessionTitle = firstUserMsg.content.substring(0, 60) + (firstUserMsg.content.length > 60 ? '...' : '');
        }
    }

    history.unshift({
        id: Date.now(),
        date: new Date().toLocaleString(),
        title: sessionTitle,
        html: messagesHtml,
        analysis: window.__analysis,
        chatHistory: [...window.__chatHistory]
    });
    
    // Keep last 20 sessions max
    if (history.length > 20) history.pop();
    localStorage.setItem('zcare_chat_history', JSON.stringify(history));
}

function loadSession(id) {
    const history = JSON.parse(localStorage.getItem('zcare_chat_history') || '[]');
    const session = history.find(s => s.id === id);
    if (session) {
        // Restore chat
        document.getElementById('messages').innerHTML = session.html;
        window.__analysis = session.analysis;
        window.__chatHistory = session.chatHistory || [];
        
        // Hide upload container since it's a past chat
        document.getElementById('uploadContainer').style.display = 'none';
        
        switchTab('chat');
        
        // Scroll to bottom
        const chatContainer = document.getElementById('chatContainer');
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

function deleteSession(id, event) {
    event.stopPropagation(); // Don't trigger loadSession
    let history = JSON.parse(localStorage.getItem('zcare_chat_history') || '[]');
    history = history.filter(s => s.id !== id);
    localStorage.setItem('zcare_chat_history', JSON.stringify(history));
    renderHistoryView();
}

function handleKeyPress(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
}

function switchTab(tabName) {
    // Update active nav item
    const navChat = document.getElementById('nav-chat');
    if (navChat) navChat.classList.remove('active');
    const navReports = document.getElementById('nav-reports');
    if (navReports) navReports.classList.remove('active');
    const navHistory = document.getElementById('nav-history');
    if (navHistory) navHistory.classList.remove('active');
    
    if (document.getElementById('nav-' + tabName)) {
        document.getElementById('nav-' + tabName).classList.add('active');
    }

    // Toggle views
    const chatContainer = document.getElementById('chatContainer');
    const inputWrapper = document.getElementById('inputWrapper');
    const reportsContainer = document.getElementById('reportsContainer');
    const historyContainer = document.getElementById('historyContainer');

    if (tabName === 'chat') {
        chatContainer.classList.remove('hidden');
        inputWrapper.classList.remove('hidden');
        reportsContainer.classList.add('hidden');
        historyContainer.classList.add('hidden');
    } else if (tabName === 'reports') {
        chatContainer.classList.add('hidden');
        inputWrapper.classList.add('hidden');
        reportsContainer.classList.remove('hidden');
        historyContainer.classList.add('hidden');
        renderReportView();
    } else if (tabName === 'history') {
        chatContainer.classList.add('hidden');
        inputWrapper.classList.add('hidden');
        reportsContainer.classList.add('hidden');
        historyContainer.classList.remove('hidden');
        renderHistoryView();
    }
}

function renderHistoryView() {
    const history = JSON.parse(localStorage.getItem('zcare_chat_history') || '[]');
    const container = document.getElementById('historyContent');
    
    if (history.length === 0) {
        container.innerHTML = `
            <div class="no-report">
                <i data-lucide="history" class="empty-icon"></i>
                <p>No chat history available. Start a new chat to see history here.</p>
            </div>
        `;
        if (window.lucide) { lucide.createIcons(); }
        return;
    }

    let html = `
        <div class="history-actions">
            <button class="clear-all-history-btn" onclick="clearAllHistory()">
                <i data-lucide="trash-2"></i> Clear All History
            </button>
        </div>
    `;
    
    history.forEach((session, index) => {
        const title = session.title || `Chat Session ${history.length - index}`;
        const msgCount = (session.chatHistory || []).length;
        html += `
            <div class="history-item" onclick="loadSession(${session.id})">
                <div class="history-item-details">
                    <h4>${title}</h4>
                    <p>${session.date}${msgCount > 0 ? ` · ${msgCount} messages` : ''}</p>
                </div>
                <div class="history-item-actions">
                    <button class="history-delete-btn" onclick="deleteSession(${session.id}, event)" title="Delete session">
                        <i data-lucide="x"></i>
                    </button>
                    <i data-lucide="chevron-right"></i>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    if (window.lucide) { lucide.createIcons(); }
}

function renderReportView() {
    const content = document.getElementById('reportsContent');
    const data = window.__analysis;
    
    if (!data) {
        content.innerHTML = `
            <div class="no-report">
                <i data-lucide="file-question" class="empty-icon"></i>
                <p>No report uploaded yet. Please upload a report in the Chat tab.</p>
            </div>
        `;
        if (window.lucide) { lucide.createIcons(); }
        return;
    }

    let html = '';

    // Summary Box
    if (data.patient_friendly_summary) {
        let summaryText = data.patient_friendly_summary.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html += `<div class="report-summary-box">${summaryText}</div>`;
    }

    // Helper to generate list section
    const createListSection = (title, items, icon) => {
        if (!items || items.length === 0 || items[0] === "Not found") return '';
        let listHtml = `<div class="report-section"><h3><i data-lucide="${icon}"></i> ${title}</h3><ul>`;
        items.forEach(item => {
            let text = item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            listHtml += `<li>${text}</li>`;
        });
        listHtml += `</ul></div>`;
        return listHtml;
    };

    html += createListSection('Key Findings', data.key_findings, 'search');
    html += createListSection('Abnormal Values', data.abnormal_values, 'activity');
    html += createListSection('Diagnoses', data.diagnoses, 'stethoscope');
    html += createListSection('Recommendations', data.recommendations, 'clipboard-check');

    if (data.patient_details && Object.keys(data.patient_details).length > 0) {
        let detailsHtml = `<div class="report-section"><h3><i data-lucide="user"></i> Patient Details</h3><ul>`;
        for (const [key, value] of Object.entries(data.patient_details)) {
            let formattedKey = key.replace('_', ' ').toUpperCase();
            detailsHtml += `<li><strong>${formattedKey}:</strong> ${value}</li>`;
        }
        detailsHtml += `</ul></div>`;
        html += detailsHtml;
    }

    content.innerHTML = html;
    if (window.lucide) { lucide.createIcons(); }
}

// Add event listener to file input
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('fileInput').addEventListener('change', uploadReport);
});

async function uploadReport() {
    const fileInput = document.getElementById('fileInput');
    const files = fileInput.files;

    if (!files || files.length === 0) {
        return;
    }
    
    if (files.length > 5) {
        alert("You can only upload up to 5 files at once.");
        fileInput.value = '';
        return;
    }

    // Show preview
    const filePreview = document.getElementById('filePreview');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    if (filePreview && fileName && fileSize) {
        const fileNames = Array.from(files).map(f => f.name).join(', ');
        const totalSize = Array.from(files).reduce((acc, f) => acc + f.size, 0);
        
        fileName.innerText = fileNames;
        fileSize.innerText = (totalSize / (1024 * 1024)).toFixed(1) + ' MB';
        
        // Hide dropzone, show preview
        document.getElementById('dropZone').style.display = 'none';
        filePreview.classList.remove('hidden');
    }

    const messages = document.getElementById('messages');
    messages.innerHTML = '';
    
    // Reset history for new upload
    window.__chatHistory = [];
    
    addBotMessage('Uploading and analyzing your documents...');

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
    }

    try {
        const response = await fetch("/api/upload", {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            window.__analysis = result.data;
            // Remove the loading message
            messages.innerHTML = '';
            displayAnalysisInChat(result.data);
        } else {
            messages.innerHTML = '';
            addBotMessage("Error: " + (result.detail || "Analysis failed."));
            // Revert upload UI
            document.getElementById('dropZone').style.display = 'flex';
            document.getElementById('filePreview').classList.add('hidden');
            document.getElementById('fileInput').value = '';
        }
    } catch (error) {
        messages.innerHTML = '';
        addBotMessage("Network Error: Could not connect to the backend.");
        console.error(error);
        // Revert upload UI
        document.getElementById('dropZone').style.display = 'flex';
        document.getElementById('filePreview').classList.add('hidden');
        document.getElementById('fileInput').value = '';
    }
}

function displayAnalysisInChat(data) {
    // Attempting to match the UI output in the image
    const summary = data.patient_friendly_summary || "I've analyzed your report. Here are the key findings:";
    
    let keyFindingsHTML = "";
    if (data.key_findings && data.key_findings.length > 0) {
        keyFindingsHTML = "<ul style='margin-left: 20px; margin-top: 10px; margin-bottom: 10px; list-style-type: disc;'>";
        data.key_findings.forEach(f => {
            // Replace bold syntax if present, or just display
            let text = f.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            keyFindingsHTML += `<li style='margin-bottom: 6px;'>${text}</li>`;
        });
        keyFindingsHTML += "</ul>";
    }

    const recommendations = (data.recommendations && data.recommendations.length > 0) 
        ? `<div style="margin-top: 12px; font-size: 13px;">Overall, ${data.recommendations.join(' ')}</div>` 
        : '';

    const content = `<div>${summary}</div>${keyFindingsHTML}${recommendations}`;
    addBotMessage(content);
    
    // Track the initial analysis in history as an assistant message
    window.__chatHistory.push({
        role: "assistant",
        content: summary
    });
}

function addBotMessage(content) {
    const messages = document.getElementById('messages');
    
    // Replace newlines with breaks
    let formattedHTML = content.replace(/\n/g, '<br>');
    // Parse markdown-like bold
    formattedHTML = formattedHTML.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    const html = `
        <div class="message-wrapper bot">
            <div class="avatar bot">
                <i data-lucide="bot"></i>
            </div>
            <div class="message-content">
                <div class="message bot">${formattedHTML}</div>
                <div class="message-time">${formatTime()} <i data-lucide="check-check"></i></div>
            </div>
        </div>
    `;
    messages.insertAdjacentHTML('beforeend', html);
    if (window.lucide) { lucide.createIcons(); }
    
    // Scroll to bottom
    const chatContainer = document.getElementById('chatContainer');
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function addUserMessage(text) {
    const messages = document.getElementById('messages');
    const html = `
        <div class="message-wrapper user">
            <div class="message-content">
                <div class="message user">${text}</div>
                <div class="message-time">${formatTime()} <i data-lucide="check-check"></i></div>
            </div>
        </div>
    `;
    messages.insertAdjacentHTML('beforeend', html);
    if (window.lucide) { lucide.createIcons(); }
    
    const chatContainer = document.getElementById('chatContainer');
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;

    addUserMessage(text);
    input.value = '';
    
    // Track user message in history
    window.__chatHistory.push({ role: "user", content: text });

    const payload = {
        message: text,
        analysis_data: window.__analysis || null,
        history: window.__chatHistory.slice(0, -1)  // Send history BEFORE current message (backend adds current)
    };

    try {
        const resp = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await resp.json();
        if (resp.ok) {
            const reply = data.reply || 'No reply from the server.';
            addBotMessage(reply);
            
            // Track assistant reply in history
            window.__chatHistory.push({ role: "assistant", content: reply });
        } else {
            addBotMessage('Error: ' + (data.detail || 'Chat failed.'));
        }
    } catch (e) {
        addBotMessage('Network error: could not reach server.');
        console.error(e);
    }
}

// Auto-save session when user navigates away
window.addEventListener('beforeunload', () => {
    const messagesEl = document.getElementById('messages');
    if (messagesEl && messagesEl.innerHTML.trim() !== '') {
        saveCurrentSessionToHistory();
    }
});