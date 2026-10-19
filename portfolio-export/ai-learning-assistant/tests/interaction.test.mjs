// Dependency-free UI state checks using a small DOM double, NOT a browser emulator.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {init} from '../aihelper.js';
import {askQuestion, scenarios, defaultReply, mockSettings, mockErrorMessage} from '../mock-responder.js';

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
    const selectors = {
        '[data-region="input"]': input, '[data-action="send"]': send,
        '[data-region="messages"]': messages, '[data-action="search-video"]': video
    };
    root.querySelector = selector => selectors[selector];
    init(root);
    const type = text => { input.value = text; input.emit('input'); };
    const enter = options => input.emit('keydown', {key: 'Enter', ...options});
    return {root, input, send, messages, video, type, enter};
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
