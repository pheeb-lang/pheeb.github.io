// Dependency-free UI state checks using a small DOM double, NOT a browser emulator.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {init} from '../aihelper.js';
import {askQuestion, scenarios, defaultReply, mockSettings, mockErrorMessage, demoConversation} from '../mock-responder.js';

class Element {
    constructor(tag = 'div') {
        this.tagName = tag;
        this.children = [];
        this.dataset = {};
        this.listeners = {};
        this.attributes = {};
        this.value = '';
        this.disabled = false;
        this.maxLength = 2000;
        this.scrollTop = 0;
        this.classList = {add: () => {}};
    }
    set innerHTML(_) { throw new Error('Untrusted HTML must never be inserted'); }
    get scrollHeight() { return this.children.length * 100; }
    appendChild(child) { child.parent = this; this.children.push(child); }
    remove() { this.parent.children = this.parent.children.filter(child => child !== this); }
    setAttribute(key, value) { this.attributes[key] = value; }
    addEventListener(name, fn) { (this.listeners[name] ??= []).push(fn); }
    emit(name, options = {}) {
        const event = {preventDefault() { this.defaultPrevented = true; }, ...options};
        for (const listener of this.listeners[name] ?? []) { listener(event); }
        return event;
    }
    focus() { this.focused = true; }
    setCustomValidity(value) { this.validationMessage = value; }
    reportValidity() { this.validityReported = true; }
}

function fixture() {
    const root = new Element();
    const input = new Element('textarea');
    const send = new Element('button');
    send.disabled = true;
    const messages = new Element();
    const video = new Element('a');
    const playback = new Element('button');
    const playbackStatus = new Element();
    const selectors = {
        '[data-region="input"]': input, '[data-action="send"]': send,
        '[data-region="messages"]': messages, '[data-action="search-video"]': video,
        '[data-action="play-demo"]': playback, '[data-region="demo-status"]': playbackStatus
    };
    root.querySelector = selector => selectors[selector];
    init(root);
    const type = text => { input.value = text; input.emit('input'); };
    const enter = options => input.emit('keydown', {key: 'Enter', ...options});
    return {root, input, send, messages, video, playback, playbackStatus, type, enter};
}

export async function runChecks() {
    const checks = [];
    const previousDocument = globalThis.document;
    const previousLocation = globalThis.location;
    globalThis.document = {createElement: tag => new Element(tag)};
    const settle = () => new Promise(resolve => setTimeout(resolve, mockSettings.delayMs + 60));
    try {
        const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
        assert.match(html, /maxlength="2000"/);
        assert.match(html, /connect-src 'none'/);
        const f = fixture();
        assert.equal(f.messages.children.length, 0);
        assert.equal(f.send.disabled, true);
        assert.equal(f.playback.disabled, false);
        assert.equal(f.input.focused, true);
        init(f.root);
        assert.equal(f.send.listeners.click.length, 1);
        checks.push('Initial empty conversation, focus, disabled send, idempotent initialization');

        f.type(' \n\t ');
        assert.equal(f.send.disabled, true);
        f.enter();
        assert.equal(f.messages.children.length, 0);
        assert.ok(f.input.validationMessage);
        f.type('中'.repeat(2001));
        f.enter();
        assert.equal(f.messages.children.length, 0);
        assert.ok(f.input.validityReported);
        checks.push('Whitespace and forced over-limit input rejected; HTML retains native maxlength');

        f.type('請解釋函式的概念');
        assert.equal(f.input.validationMessage, '');
        assert.equal(f.enter({shiftKey: true}).defaultPrevented, undefined);
        assert.equal(f.messages.children.length, 0);
        assert.equal(f.enter({isComposing: true}).defaultPrevented, undefined);
        f.input.emit('compositionstart');
        f.enter();
        f.send.emit('click');
        assert.equal(f.messages.children.length, 0);
        f.input.emit('compositionend');
        f.enter({keyCode: 229});
        assert.equal(f.messages.children.length, 0);
        checks.push('Shift+Enter preserved; isComposing, composition events and keyCode 229 guard submission');

        const started = Date.now();
        assert.equal(f.enter().defaultPrevented, true);
        assert.equal(f.messages.children[0].textContent, '請解釋函式的概念');
        assert.equal(f.messages.children[1].attributes.role, 'status');
        assert.equal(f.messages.children[1].children.length, 3);
        assert.equal(f.input.disabled, true);
        assert.equal(f.send.disabled, true);
        f.send.emit('click');
        f.send.emit('click');
        f.enter();
        assert.equal(f.messages.children.length, 2);
        await settle();
        assert.ok(Date.now() - started >= mockSettings.delayMs);
        assert.equal(f.messages.children.length, 2);
        assert.equal(f.messages.children[1].textContent, scenarios[1].reply);
        assert.equal(f.input.disabled, false);
        assert.equal(f.send.disabled, true);
        assert.equal(f.messages.scrollTop, f.messages.scrollHeight);
        checks.push('Enter submission, three-dot waiting state, configured delay, duplicate lock, cleanup and scroll');

        for (const [question, expected] of [
            ['網頁入門課程作業如何準備？', scenarios[2].reply],
            ['請整理本週學習重點', scenarios[0].reply],
            ['沒有對應關鍵字的內容', defaultReply],
            ['中'.repeat(2000), defaultReply],
            ['<img src=x onerror=alert(1)>\n<script>alert(1)</script> **文字**', defaultReply]
        ]) {
            f.type(question);
            f.send.emit('click');
            await settle();
            assert.equal(f.messages.children.at(-2).textContent, question);
            assert.equal(f.messages.children.at(-1).textContent, expected);
            assert.equal(f.messages.scrollTop, f.messages.scrollHeight);
        }
        assert.equal(f.messages.children.length, 12);
        checks.push('Course/concept/summary/fallback rules, 2000-character input, multiline hostile text, repeated conversation');

        globalThis.location = {search: '?demo-error=1'};
        f.type('開發驗證');
        f.send.emit('click');
        await settle();
        assert.equal(f.messages.children.at(-1).textContent, mockErrorMessage);
        assert.equal(f.input.disabled, false);
        assert.equal(f.messages.children.some(item => item.attributes.role === 'status'), false);
        globalThis.location = {search: ''};
        f.type('再次整理重點');
        f.enter();
        await settle();
        assert.equal(f.messages.children.at(-1).textContent, scenarios[0].reply);
        checks.push('Development error display and subsequent successful submission');

        f.video.emit('click');
        assert.equal(new URL(f.video.href).searchParams.get('search_query'), '再次整理重點');
        f.type('輸入中的查詢 & 中文');
        f.video.emit('click');
        assert.equal(new URL(f.video.href).searchParams.get('search_query'), f.input.value);
        const fresh = fixture();
        fresh.video.emit('click');
        assert.equal(new URL(fresh.video.href).searchParams.get('search_query'), 'Moodle learning tutorial');
        assert.equal(fresh.messages.children.length, 0);
        await assert.rejects(askQuestion('   '));
        await assert.rejects(askQuestion('中'.repeat(2001)));
        checks.push('Existing external-link query precedence/encoding, fresh page state and responder validation');

        const g = fixture();
        assert.equal(g.playback.disabled, false);
        g.input.emit('compositionstart');
        g.playback.emit('click');
        assert.equal(g.messages.children.length, 0);
        g.input.emit('compositionend');
        g.type('尚未送出的草稿');
        g.playback.emit('click');
        assert.equal(g.playback.disabled, true);
        assert.equal(g.messages.children[0].textContent, demoConversation[0]);
        await settle();
        assert.equal(g.messages.children.length, 2);
        assert.equal(g.input.disabled, true);
        assert.equal(g.send.disabled, true);
        assert.equal(g.playback.disabled, true);
        g.send.emit('click');
        g.enter();
        g.playback.emit('click');
        assert.equal(g.messages.children.length, 2);
        await new Promise(resolve => setTimeout(resolve,
            (demoConversation.length - 1) * (mockSettings.delayMs + mockSettings.playbackPauseMs) + 100));
        assert.equal(g.messages.children.length, 6);
        for (let i = 0; i < demoConversation.length; i++) {
            assert.equal(g.messages.children[i * 2].textContent, demoConversation[i]);
        }
        assert.equal(g.input.disabled, false);
        assert.equal(g.input.value, '尚未送出的草稿');
        assert.equal(g.send.disabled, false);
        assert.equal(g.playback.disabled, false);
        assert.match(g.playbackStatus.textContent, /完成/);
        checks.push('Three-turn playback, reading pauses, draft restoration, composition and concurrent-action guards');

        g.type('請解釋函式');
        g.enter();
        assert.equal(g.playback.disabled, true);
        await settle();
        assert.equal(g.messages.children.length, 8);
        g.playback.emit('click');
        await new Promise(resolve => setTimeout(resolve,
            demoConversation.length * mockSettings.delayMs
            + (demoConversation.length - 1) * mockSettings.playbackPauseMs + 100));
        assert.equal(g.messages.children.length, 14);
        assert.equal(g.playback.disabled, false);
        checks.push('Visitor interaction after playback and replay append without clearing earlier conversation');

        globalThis.location = {search: '?demo-error=1'};
        const h = fixture();
        h.type('錯誤前草稿');
        h.playback.emit('click');
        await settle();
        assert.equal(h.messages.children.length, 2);
        assert.equal(h.messages.children[1].textContent, mockErrorMessage);
        assert.equal(h.input.disabled, false);
        assert.equal(h.input.value, '錯誤前草稿');
        assert.equal(h.playback.disabled, false);
        assert.match(h.playbackStatus.textContent, /停止/);
        checks.push('Playback stops on simulated error and restores draft and controls');
        return checks;
    } finally {
        if (previousDocument === undefined) { delete globalThis.document; }
        else { globalThis.document = previousDocument; }
        if (previousLocation === undefined) { delete globalThis.location; }
        else { globalThis.location = previousLocation; }
    }
}

export const results = await runChecks();
console.log(`Passed ${results.length} groups of non-browser checks.`);
