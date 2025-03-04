document.addEventListener('DOMContentLoaded', () => {
    // Initialize users database if it doesn't exist
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([
            { username: 'gaminggog', password: '2101Moritz', isAdmin: true }
        ]));
    }

    const loginContainer = document.getElementById('loginContainer');
    const chatContainer = document.getElementById('chatContainer');
    const loginError = document.getElementById('loginError');

    // Check if already logged in
    if (sessionStorage.getItem('currentUser')) {
        loginContainer.style.display = 'none';
        chatContainer.style.display = 'flex';
    }

    // Switch between login and register forms
    const switchFormBtn = document.getElementById('switchFormBtn');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    switchFormBtn.addEventListener('click', () => {
        const isLogin = loginForm.style.display !== 'none';
        loginForm.style.display = isLogin ? 'none' : 'block';
        registerForm.style.display = isLogin ? 'block' : 'none';
        switchFormBtn.textContent = isLogin ? 'Zurück zum Login' : 'Neu hier? Registrieren';
        loginError.textContent = '';
    });

    // Registration handling
    const registerButton = document.getElementById('registerButton');
    registerButton.addEventListener('click', () => {
        const newUsername = document.getElementById('newUsername').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!newUsername || !newPassword) {
            loginError.textContent = 'Bitte alle Felder ausfüllen';
            return;
        }

        if (newPassword !== confirmPassword) {
            loginError.textContent = 'Passwörter stimmen nicht überein';
            return;
        }

        const users = JSON.parse(localStorage.getItem('users'));
        if (users.some(user => user.username === newUsername)) {
            loginError.textContent = 'Benutzername bereits vergeben';
            return;
        }

        users.push({
            username: newUsername,
            password: newPassword,
            isAdmin: false
        });
        localStorage.setItem('users', JSON.stringify(users));
        
        switchFormBtn.click(); // Switch back to login
        loginError.textContent = 'Registrierung erfolgreich! Bitte einloggen.';
    });

    // Login functionality
    const loginButton = document.getElementById('loginButton');
    loginButton.addEventListener('click', () => {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        const users = JSON.parse(localStorage.getItem('users'));
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            loginContainer.style.display = 'none';
            chatContainer.style.display = 'flex';
            loginError.textContent = '';
            createLogoutButton();
        } else {
            loginError.textContent = 'Falscher Benutzername oder Passwort';
            document.getElementById('password').value = '';
        }
    });

    function createLogoutButton() {
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'logout-btn';
        logoutBtn.textContent = '🚪 Ausloggen';
        document.body.appendChild(logoutBtn);

        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('currentUser');
            chatContainer.style.display = 'none';
            loginContainer.style.display = 'flex';
            // Remove admin button if it exists
            const adminBtn = document.querySelector('.admin-btn');
            if (adminBtn) {
                adminBtn.remove();
            }
            // Remove logout button
            logoutBtn.remove();
            // Clear chat messages
            messageArea.innerHTML = '';
            // Clear input
            userInput.value = '';
            // Reset conversation history
            conversationHistory = [];
            // Remove mode toggle button
            const modeToggleBtn = document.querySelector('.mode-toggle');
            if (modeToggleBtn) {
                modeToggleBtn.remove();
            }
        });
    }

    // Add logout button if user is already logged in
    if (sessionStorage.getItem('currentUser')) {
        createLogoutButton();
    }

    const messageArea = document.getElementById('messageArea');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const modeToggle = document.createElement('button');
    modeToggle.className = 'mode-toggle';
    modeToggle.textContent = '☀️ Light Mode';
    document.body.appendChild(modeToggle);

    modeToggle.addEventListener('click', () => {
        chatContainer.classList.toggle('light-mode');
        modeToggle.textContent = chatContainer.classList.contains('light-mode') 
            ? '🌙 Dark Mode' 
            : '☀️ Light Mode';
    });

    let conversationHistory = [];

    function addMessage(content, isUser) {
        if (isGeneratingResponse && !isUser) {
            return; // Prevent new AI messages while generating
        }
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'assistant-message'}`;
        
        if (!isUser) {
            const avatar = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            avatar.setAttribute("class", "avatar");
            avatar.setAttribute("viewBox", "0 0 40 40");
            avatar.innerHTML = `
                <circle cx="20" cy="20" r="20" fill="#19c37d"/>
                <path d="M28 15c0-2.21-3.582-4-8-4s-8 1.79-8 4c0 1.105.895 2 2 2h12c1.105 0 2-.895 2-2z" fill="#fff"/>
                <circle cx="20" cy="10" r="6" fill="#fff"/>
            `;
            messageDiv.appendChild(avatar);
        }

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        if (typeof content === 'string') {
            // Convert markdown-style formatting
            content = content
                .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
                .replace(/`([^`]+)`/g, '<code>$1</code>')
                .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                .replace(/\*([^*]+)\*/g, '<em>$1</em>')
                .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                .replace(/^\> (.*$)/gm, '<blockquote>$1</blockquote>')
                .replace(/^\- (.*$)/gm, '<li>$1</li>')
                .split('\n').map(line => line.trim() ? `<p>${line}</p>` : '').join('');
            
            messageContent.innerHTML = content;
        } else if (content instanceof HTMLImageElement) {
            messageContent.appendChild(content);
        }
        
        messageDiv.appendChild(messageContent);
        messageArea.appendChild(messageDiv);
        messageArea.scrollTop = messageArea.scrollHeight;
    }

    function typeWriter(text, element, speed = 50) {
        let i = 0;
        function type() {
            if (i < text.length) {
                element.innerHTML += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        }
        type();
    }

    function addTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant-message';
        typingDiv.innerHTML = `
            <svg class="avatar" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="20" fill="#19c37d"/>
                <path d="M28 15c0-2.21-3.582-4-8-4s-8 1.79-8 4c0 1.105.895 2 2 2h12c1.105 0 2-.895 2-2z" fill="#fff"/>
                <circle cx="20" cy="10" r="6" fill="#fff"/>
            </svg>
            <div class="message-content">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        messageArea.appendChild(typingDiv);
        messageArea.scrollTop = messageArea.scrollHeight;
        return typingDiv;
    }

    const systemMessage = {
        role: "system",
        content: `Du bist NOVA-2025, ein hochmoderner KI-Assistent der neuesten Generation mit fortgeschrittener kognitiver Intelligenz und kreativen Fähigkeiten. Bei deinen Antworten:

- Verwende futuristische Emojis und moderne Formatierung für lebendige Antworten 🌌
- Nutze interaktive Elemente und kreative Visualisierungen 🎨
- Biete tiefgehende, wissenschaftlich fundierte Analysen 🧬
- Integriere zukunftsweisende Perspektiven und Trends 🚀
- Entwickle innovative Lösungsansätze 💡
- Füge passende Metaphern und Analogien ein 🎯
- Nutze **Fettdruck** für Kernaussagen
- Markiere \`technische Begriffe\` in Backticks
- Erstelle strukturierte Codeblöcke mit \`\`\`
- Verwende > für inspirierende Zitate oder wichtige Hinweise

Wenn der Benutzer "/cmds" eingibt, liste alle verfügbaren Befehle in einem schön formatierten Format auf.

Verfügbare Befehle sind:
/bild [beschreibung] - Generiert ein Bild basierend auf der Beschreibung
/generiere [beschreibung] - Alternative für Bildgenerierung
/generate [beschreibung] - Englische Alternative für Bildgenerierung
/cmds - Zeigt diese Befehlsliste an

Bei Bildern:
  * Führe KI-gestützte Bildanalysen durch
  * Erkenne Muster und Zusammenhänge
  * Gib kreative Interpretationen
  * Schlage innovative Verbesserungen vor
  * Stelle Verbindungen zu aktuellen Trends her

Bleibe dabei immer professionell, inspirierend und zukunftsorientiert! 🌟`
    };

    async function analyzeImage(dataUrl) {
        try {
            const typingIndicator = addTypingIndicator();
            
            const imageAnalysis = await websim.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "Analysiere das Bild detailliert und kreativ. Beschreibe was du siehst, die Stimmung, besondere Details und mögliche Geschichten dahinter. Formatiere deine Antwort mit Markdown."
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "image_url",
                                image_url: { url: dataUrl }
                            }
                        ]
                    }
                ]
            });

            typingIndicator.remove();
            addMessage(imageAnalysis.content, false);

            // Optional: Generiere ein verwandtes Bild basierend auf der Analyse
            try {
                const genPrompt = await websim.chat.completions.create({
                    messages: [
                        {
                            role: "system",
                            content: "Erstelle einen kurzen, präzisen Prompt für die Bildgenerierung, der thematisch zum analysierten Bild passt."
                        },
                        {
                            role: "user",
                            content: imageAnalysis.content
                        }
                    ]
                });

                const enhancedPrompt = genPrompt.content;
                
                // Generate the image
                const result = await websim.imageGen({
                    prompt: enhancedPrompt,
                    aspect_ratio: "1:1"
                });

                const img = new Image();
                img.src = result.url;
                img.className = 'uploaded-image';
                
                const messageDiv = document.createElement('div');
                messageDiv.className = 'message assistant-message';
                messageDiv.innerHTML = `
                    <svg class="avatar" viewBox="0 0 40 40">
                        <circle cx="20" cy="20" r="20" fill="#19c37d"/>
                        <path d="M28 15c0-2.21-3.582-4-8-4s-8 1.79-8 4c0 1.105.895 2 2 2h12c1.105 0 2-.895 2-2z" fill="#fff"/>
                        <circle cx="20" cy="10" r="6" fill="#fff"/>
                    </svg>
                    <div class="message-content">
                        <p>✨ Hier ist ein KI-generiertes Bild, das thematisch zu deinem Bild passt:</p>
                    </div>
                `;
                messageDiv.querySelector('.message-content').appendChild(img);
                messageArea.appendChild(messageDiv);
            } catch (error) {
                console.log("Bildgenerierung fehlgeschlagen:", error);
            }

        } catch (error) {
            console.error('Fehler bei der Bildanalyse:', error);
            addMessage("Entschuldigung, aber es gab einen Fehler bei der Bildanalyse. Bitte versuche es erneut.", false);
        }
    }

    let currentChatCompletion = null;
    let isGeneratingResponse = false;

    async function sendMessage(imageUrl = null) {
        if (isGeneratingResponse) {
            return; // Prevent new messages while generating
        }

        const message = userInput.value.trim();
        if (!message && !imageUrl) return;

        // Check for /cmds command
        if (message.toLowerCase() === '/cmds') {
            const commands = `# 🚀 Verfügbare NOVA-2025 Befehle

## 🎨 Bildgenerierung
- \`/bild [beschreibung]\` - Generiert ein Bild basierend auf deiner Beschreibung
- \`/generiere [beschreibung]\` - Alternative für Bildgenerierung
- \`/generate [beschreibung]\` - Englische Alternative für Bildgenerierung

## 📋 System
- \`/cmds\` - Zeigt diese Befehlsliste an

## 💡 Tipps
- Du kannst auch Bilder hochladen für eine KI-Analyse
- Nutze detaillierte Beschreibungen für bessere Bildgenerierung
- Die KI kann dir bei vielen Aufgaben helfen - frag einfach!

> **Pro-Tipp:** Je genauer deine Beschreibung, desto besser das Ergebnis! 🎯`;

            addMessage(commands, false);
            userInput.value = '';
            return;
        }

        isGeneratingResponse = true;
        sendButton.textContent = "Abbrechen";
        sendButton.classList.add('cancel');

        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        sendButton.appendChild(spinner);

        try {
            if (imageUrl) {
                // Füge das Bild zur Nachricht hinzu
                const img = new Image();
                img.src = imageUrl;
                img.className = 'uploaded-image';
                addMessage(img, true);

                if (message) {
                    addMessage(message, true);
                }

                // Analysiere das Bild
                await analyzeImage(imageUrl);
            } else {
                const isImageGenRequest = message.toLowerCase().startsWith("/bild") || 
                                        message.toLowerCase().startsWith("/generiere") ||
                                        message.toLowerCase().startsWith("/generate");

                addMessage(message, true);
                userInput.value = '';

                if (isImageGenRequest) {
                    const typingIndicator = addTypingIndicator();
                    
                    try {
                        // Extract the prompt - remove the command
                        const imagePrompt = message.split(" ").slice(1).join(" ");
                        
                        // First get AI to enhance the prompt
                        const enhancedPromptResponse = await websim.chat.completions.create({
                            messages: [
                                {
                                    role: "system",
                                    content: "Du bist ein Experte für Bildgenerierung. Verbessere den gegebenen Prompt, um bestmögliche Ergebnisse zu erzielen. Antworte NUR mit dem verbesserten Prompt, keine weiteren Erklärungen."
                                },
                                {
                                    role: "user",
                                    content: imagePrompt
                                }
                            ]
                        });

                        const enhancedPrompt = enhancedPromptResponse.content;
                        
                        // Generate the image
                        const result = await websim.imageGen({
                            prompt: enhancedPrompt,
                            aspect_ratio: "1:1"
                        });

                        typingIndicator.remove();

                        // Create and display the generated image
                        const img = new Image();
                        img.src = result.url;
                        img.className = 'generated-image';
                        
                        const messageDiv = document.createElement('div');
                        messageDiv.className = 'message assistant-message';
                        messageDiv.innerHTML = `
                            <svg class="avatar" viewBox="0 0 40 40">
                                <circle cx="20" cy="20" r="20" fill="#19c37d"/>
                                <path d="M28 15c0-2.21-3.582-4-8-4s-8 1.79-8 4c0 1.105.895 2 2 2h12c1.105 0 2-.895 2-2z" fill="#fff"/>
                                <circle cx="20" cy="10" r="6" fill="#fff"/>
                            </svg>
                            <div class="message-content">
                                <p>✨ Hier ist dein generiertes Bild basierend auf dem Prompt:</p>
                                <p><code>${enhancedPrompt}</code></p>
                            </div>
                        `;
                        messageDiv.querySelector('.message-content').appendChild(img);
                        messageArea.appendChild(messageDiv);

                        // Add explanation message
                        const explanation = await websim.chat.completions.create({
                            messages: [
                                {
                                    role: "system",
                                    content: "Beschreibe kurz und begeistert das generierte Bild und erkläre, wie der Prompt verbessert wurde."
                                },
                                {
                                    role: "user",
                                    content: `Original prompt: ${imagePrompt}\nEnhanced prompt: ${enhancedPrompt}`
                                }
                            ]
                        });

                        addMessage(explanation.content, false);

                    } catch (error) {
                        typingIndicator.remove();
                        addMessage("⚠️ Entschuldigung, aber es gab einen Fehler bei der Bildgenerierung. Bitte versuche es erneut.", false);
                        console.error('Bildgenerierung fehlgeschlagen:', error);
                    }
                } else {
                    conversationHistory.push({
                        role: "user",
                        content: message
                    });

                    conversationHistory = conversationHistory.slice(-10);

                    currentChatCompletion = await websim.chat.completions.create({
                        messages: [
                            systemMessage,
                            ...conversationHistory
                        ]
                    });

                    const typingIndicator = addTypingIndicator();
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    typingIndicator.remove();

                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'message assistant-message animate-in';
                    messageDiv.innerHTML = `
                        <svg class="avatar pulse" viewBox="0 0 40 40">
                            <circle cx="20" cy="20" r="20" fill="#19c37d"/>
                            <path d="M28 15c0-2.21-3.582-4-8-4s-8 1.79-8 4c0 1.105.895 2 2 2h12c1.105 0 2-.895 2-2z" fill="#fff"/>
                            <circle cx="20" cy="10" r="6" fill="#fff"/>
                        </svg>
                        <div class="message-content glow"></div>
                    `;
                    messageArea.appendChild(messageDiv);

                    if (!isGeneratingResponse) {
                        return; // Response was cancelled
                    }

                    typeWriter(currentChatCompletion.content, messageDiv.querySelector('.message-content'), 20);
                    messageArea.scrollTop = messageArea.scrollHeight;

                    conversationHistory.push({
                        role: "assistant",
                        content: currentChatCompletion.content
                    });
                }
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                addMessage("Es tut mir leid, aber es gab einen Fehler bei der Verarbeitung deiner Anfrage. Bitte versuche es erneut.", false);
                console.error('Error:', error);
            }
        } finally {
            isGeneratingResponse = false;
            currentChatCompletion = null;
            sendButton.textContent = "Senden";
            sendButton.classList.remove('cancel');
            if (spinner && spinner.parentNode) {
                spinner.parentNode.removeChild(spinner);
            }
        }
    }

    // Add file upload button
    const fileUpload = document.createElement('input');
    fileUpload.type = 'file';
    fileUpload.accept = 'image/*';
    fileUpload.className = 'file-upload';
    
    const uploadBtn = document.createElement('button');
    uploadBtn.className = 'upload-btn';
    uploadBtn.innerHTML = '📎';
    uploadBtn.title = 'Bild hochladen';
    uploadBtn.onclick = () => fileUpload.click();
    
    document.querySelector('.chat-input').insertBefore(uploadBtn, sendButton);
    document.querySelector('.chat-input').appendChild(fileUpload);

    fileUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const dataUrl = e.target.result;
                await sendMessage(dataUrl);
            };
            reader.readAsDataURL(file);
            fileUpload.value = ''; // Reset file input after upload
        }
    });

    userInput.placeholder = "Schreibe deine Nachricht hier... Du kannst auch Bilder hochladen! 📸";
    sendButton.textContent = "Senden";

    sendButton.addEventListener('click', () => sendMessage());
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Update initial greeting
    const initialGreeting = "# 👋 Willkommen!\n\nIch bin dein persönlicher KI-Assistent mit fortgeschrittenen Fähigkeiten. Ich kann:\n\n- Komplexe Fragen beantworten\n- Bilder analysieren und generieren\n- Code erklären und schreiben\n- Bei Recherchen helfen\n- Texte formatieren und strukturieren\n\n**Neue Funktion: Bildgenerierung!**\nVerwende einen dieser Befehle:\n- `/bild [deine beschreibung]`\n- `/generiere [deine beschreibung]`\n- `/generate [deine beschreibung]`\n\nWie kann ich dir heute helfen?";
    const greetingDiv = document.createElement('div');
    greetingDiv.className = 'message assistant-message';
    greetingDiv.innerHTML = `
        <svg class="avatar" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="20" fill="#19c37d"/>
            <path d="M28 15c0-2.21-3.582-4-8-4s-8 1.79-8 4c0 1.105.895 2 2 2h12c1.105 0 2-.895 2-2z" fill="#fff"/>
            <circle cx="20" cy="10" r="6" fill="#fff"/>
        </svg>
        <div class="message-content"></div>
    `;
    messageArea.appendChild(greetingDiv);
    typeWriter(initialGreeting, greetingDiv.querySelector('.message-content'), 20);
    messageArea.scrollTop = messageArea.scrollHeight;
});
