// Adapted from the actively loaded local_classgroup/aihelper.js; GPL-3.0-or-later.
import {askQuestion, validationMessage} from './mock-responder.js';

export function init(root) {
    if (!root || root.dataset.initialized === 'true') {
        return;
    }
    const input = root.querySelector('[data-region="input"]');
    const send = root.querySelector('[data-action="send"]');
    const messages = root.querySelector('[data-region="messages"]');
    const video = root.querySelector('[data-action="search-video"]');
    if (!input || !send || !messages) {
        return;
    }
    root.dataset.initialized = 'true';
    let lastQuestion = '';
    let isReplying = false;
    let isComposing = false;

    function scrollToLatest() {
        messages.scrollTop = messages.scrollHeight;
    }

    function addMessage(text, type) {
        const item = document.createElement('div');
        item.className = 'local-classgroup-aimessage local-classgroup-aimessage-' + type;
        item.textContent = text;
        messages.appendChild(item);
        messages.classList.add('is-visible');
        scrollToLatest();
    }

    function createThinkingMessage() {
        const item = document.createElement('div');
        item.className = 'local-classgroup-aimessage local-classgroup-aimessage-assistant local-classgroup-aithinking';
        item.setAttribute('role', 'status');
        item.setAttribute('aria-label', 'AI 小幫手正在思考');
        for (let i = 0; i < 3; i++) {
            item.appendChild(document.createElement('span'));
        }
        messages.appendChild(item);
        messages.classList.add('is-visible');
        scrollToLatest();
        return item;
    }

    async function submitMessage() {
        const question = input.value.trim();
        if (isReplying || isComposing) {
            return;
        }
        if (!question || input.value.length > input.maxLength) {
            input.setCustomValidity(validationMessage);
            input.reportValidity();
            input.focus();
            return;
        }
        input.setCustomValidity('');
        isReplying = true;
        lastQuestion = question;
        addMessage(question, 'user');
        input.value = '';
        send.disabled = true;
        input.disabled = true;
        const thinking = createThinkingMessage();
        try {
            const data = await askQuestion(question);
            addMessage(data.reply, 'assistant');
        } catch (error) {
            addMessage(error.message || '模擬回覆暫時無法顯示，請稍後再試。', 'assistant');
        } finally {
            thinking.remove();
            isReplying = false;
            input.disabled = false;
            send.disabled = input.value.trim() === '';
            scrollToLatest();
            input.focus();
        }
    }

    input.disabled = false;
    input.addEventListener('input', function() {
        input.setCustomValidity('');
        send.disabled = isReplying || input.value.trim() === '';
    });
    input.addEventListener('compositionstart', function() { isComposing = true; });
    input.addEventListener('compositionend', function() { isComposing = false; });
    input.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && !isComposing && event.keyCode !== 229) {
            event.preventDefault();
            void submitMessage();
        }
    });
    send.addEventListener('click', function() { void submitMessage(); });
    if (video) {
        video.addEventListener('click', function() {
            const query = input.value.trim() || lastQuestion || 'Moodle learning tutorial';
            video.href = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query);
        });
    }
    input.focus();
}

if (typeof document !== 'undefined') {
    document.querySelectorAll('[data-region="aihelper"]').forEach(init);
}
