// Adapted from the actively loaded local_classgroup/aihelper.js; GPL-3.0-or-later.
import {askQuestion, validationMessage, demoConversation, mockSettings} from './mock-responder.js';

export function init(root) {
    if (!root || root.dataset.initialized === 'true') {
        return;
    }
    const input = root.querySelector('[data-region="input"]');
    const send = root.querySelector('[data-action="send"]');
    const messages = root.querySelector('[data-region="messages"]');
    const video = root.querySelector('[data-action="search-video"]');
    const playback = root.querySelector('[data-action="play-demo"]');
    const playbackStatus = root.querySelector('[data-region="demo-status"]');
    if (!input || !send || !messages) {
        return;
    }
    root.dataset.initialized = 'true';
    let lastQuestion = '';
    let isReplying = false;
    let isComposing = false;
    let isPlaying = false;

    function updateControls() {
        input.disabled = isReplying || isPlaying;
        send.disabled = isReplying || isPlaying || input.value.trim() === '';
        if (playback) {
            playback.disabled = isReplying || isPlaying || isComposing;
            playback.textContent = isPlaying ? '示範播放中…' : '播放對話示範';
        }
    }

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

    async function submitMessage(playbackQuestion) {
        const fromPlayback = typeof playbackQuestion === 'string';
        const rawQuestion = fromPlayback ? playbackQuestion : input.value;
        const question = rawQuestion.trim();
        if (isReplying || isComposing || (isPlaying && !fromPlayback)) {
            return false;
        }
        if (!question || rawQuestion.length > input.maxLength) {
            input.setCustomValidity(validationMessage);
            input.reportValidity();
            input.focus();
            return false;
        }
        input.setCustomValidity('');
        isReplying = true;
        lastQuestion = question;
        addMessage(question, 'user');
        input.value = '';
        updateControls();
        const thinking = createThinkingMessage();
        try {
            const data = await askQuestion(question);
            addMessage(data.reply, 'assistant');
            return true;
        } catch (error) {
            addMessage(error.message || '模擬回覆暫時無法顯示，請稍後再試。', 'assistant');
            return false;
        } finally {
            thinking.remove();
            isReplying = false;
            updateControls();
            scrollToLatest();
            if (!isPlaying) { input.focus(); }
        }
    }

    async function playConversation() {
        if (isPlaying || isReplying || isComposing) { return; }
        const draft = input.value;
        isPlaying = true;
        updateControls();
        let completed = false;
        try {
            for (let index = 0; index < demoConversation.length; index++) {
                if (playbackStatus) {
                    playbackStatus.textContent = `預設對話示範 ${index + 1} / ${demoConversation.length}（未連接即時 AI）`;
                }
                if (!await submitMessage(demoConversation[index])) { return; }
                if (index < demoConversation.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, mockSettings.playbackPauseMs));
                }
            }
            completed = true;
        } finally {
            isPlaying = false;
            input.value = draft;
            updateControls();
            if (playbackStatus) {
                playbackStatus.textContent = completed
                    ? '示範播放完成。你可以直接輸入問題繼續體驗，或再次播放。'
                    : '示範已停止，請重新播放或自行輸入問題。';
            }
            input.focus();
        }
    }

    updateControls();
    input.addEventListener('input', function() {
        input.setCustomValidity('');
        updateControls();
    });
    input.addEventListener('compositionstart', function() { isComposing = true; updateControls(); });
    input.addEventListener('compositionend', function() { isComposing = false; updateControls(); });
    input.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && !isComposing && event.keyCode !== 229) {
            event.preventDefault();
            void submitMessage();
        }
    });
    send.addEventListener('click', function() { void submitMessage(); });
    if (playback) {
        playback.addEventListener('click', function() { void playConversation(); });
    }
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
