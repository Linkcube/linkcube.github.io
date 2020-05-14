
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if (typeof $$scope.dirty === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let stylesheet;
    let active = 0;
    let current_rules = {};
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        if (!current_rules[name]) {
            if (!stylesheet) {
                const style = element('style');
                document.head.appendChild(style);
                stylesheet = style.sheet;
            }
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        node.style.animation = (node.style.animation || '')
            .split(', ')
            .filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        )
            .join(', ');
        if (name && !--active)
            clear_rules();
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            let i = stylesheet.cssRules.length;
            while (i--)
                stylesheet.deleteRule(i);
            current_rules = {};
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined' ? window : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.18.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    function fade(node, { delay = 0, duration = 400, easing = identity }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }

    /* node_modules\linkcube-svelte-components\src\audioControls\audioControls.svelte generated by Svelte v3.18.2 */

    const { isNaN: isNaN_1 } = globals;
    const file = "node_modules\\linkcube-svelte-components\\src\\audioControls\\audioControls.svelte";

    // (186:0) {#if display}
    function create_if_block(ctx) {
    	let div1;
    	let button0;
    	let t0;
    	let progress0;
    	let progress0_value_value;
    	let t1;
    	let div0;
    	let t2_value = formatSeconds(/*currentTime*/ ctx[10]) + "";
    	let t2;
    	let t3;
    	let t4_value = formatSeconds(/*duration*/ ctx[2]) + "";
    	let t4;
    	let t5;
    	let button1;
    	let t6;
    	let progress1;
    	let t7;
    	let current;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*paused*/ ctx[1]) return create_if_block_7;
    		return create_else_block_2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*muted*/ ctx[3]) return create_if_block_4;
    		if (/*volume*/ ctx[4] < 0.01) return create_if_block_5;
    		if (/*volume*/ ctx[4] < 0.5) return create_if_block_6;
    		return create_else_block_1;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);
    	let if_block2 = !/*disableTooltip*/ ctx[9] && (/*inlineTooltip*/ ctx[8] || /*showTooltip*/ ctx[14]) && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			button0 = element("button");
    			if_block0.c();
    			t0 = space();
    			progress0 = element("progress");
    			t1 = space();
    			div0 = element("div");
    			t2 = text(t2_value);
    			t3 = text("/");
    			t4 = text(t4_value);
    			t5 = space();
    			button1 = element("button");
    			if_block1.c();
    			t6 = space();
    			progress1 = element("progress");
    			t7 = space();
    			if (if_block2) if_block2.c();
    			attr_dev(button0, "class", "material-icons svelte-1acgf3l");
    			add_location(button0, file, 187, 8, 5032);
    			progress0.value = progress0_value_value = /*currentTime*/ ctx[10] ? /*currentTime*/ ctx[10] : 0;
    			attr_dev(progress0, "max", /*duration*/ ctx[2]);
    			attr_dev(progress0, "class", "song-progress svelte-1acgf3l");
    			add_location(progress0, file, 196, 8, 5296);
    			attr_dev(div0, "class", "control-times svelte-1acgf3l");
    			add_location(div0, file, 206, 8, 5676);
    			attr_dev(button1, "class", "material-icons svelte-1acgf3l");
    			add_location(button1, file, 207, 8, 5773);
    			progress1.value = /*volume*/ ctx[4];
    			attr_dev(progress1, "class", "volume-progress svelte-1acgf3l");
    			add_location(progress1, file, 219, 8, 6129);
    			attr_dev(div1, "class", "controls svelte-1acgf3l");
    			add_location(div1, file, 186, 4, 5000);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, button0);
    			if_block0.m(button0, null);
    			append_dev(div1, t0);
    			append_dev(div1, progress0);
    			/*progress0_binding*/ ctx[31](progress0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, t2);
    			append_dev(div0, t3);
    			append_dev(div0, t4);
    			append_dev(div1, t5);
    			append_dev(div1, button1);
    			if_block1.m(button1, null);
    			append_dev(div1, t6);
    			append_dev(div1, progress1);
    			/*progress1_binding*/ ctx[36](progress1);
    			append_dev(div1, t7);
    			if (if_block2) if_block2.m(div1, null);
    			current = true;

    			dispose = [
    				listen_dev(button0, "click", /*click_handler*/ ctx[30], false, false, false),
    				listen_dev(progress0, "mousedown", /*mousedown_handler*/ ctx[32], false, false, false),
    				listen_dev(progress0, "mouseenter", /*mouseenter_handler*/ ctx[33], false, false, false),
    				listen_dev(progress0, "mouseleave", /*mouseleave_handler*/ ctx[34], false, false, false),
    				listen_dev(progress0, "click", /*seekAudio*/ ctx[20], false, false, false),
    				listen_dev(button1, "click", /*click_handler_1*/ ctx[35], false, false, false),
    				listen_dev(progress1, "mousedown", /*mousedown_handler_1*/ ctx[37], false, false, false),
    				listen_dev(progress1, "click", /*seekVolume*/ ctx[21], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(button0, null);
    				}
    			}

    			if (!current || dirty[0] & /*currentTime*/ 1024 && progress0_value_value !== (progress0_value_value = /*currentTime*/ ctx[10] ? /*currentTime*/ ctx[10] : 0)) {
    				prop_dev(progress0, "value", progress0_value_value);
    			}

    			if (!current || dirty[0] & /*duration*/ 4) {
    				attr_dev(progress0, "max", /*duration*/ ctx[2]);
    			}

    			if ((!current || dirty[0] & /*currentTime*/ 1024) && t2_value !== (t2_value = formatSeconds(/*currentTime*/ ctx[10]) + "")) set_data_dev(t2, t2_value);
    			if ((!current || dirty[0] & /*duration*/ 4) && t4_value !== (t4_value = formatSeconds(/*duration*/ ctx[2]) + "")) set_data_dev(t4, t4_value);

    			if (current_block_type_1 !== (current_block_type_1 = select_block_type_1(ctx))) {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(button1, null);
    				}
    			}

    			if (!current || dirty[0] & /*volume*/ 16) {
    				prop_dev(progress1, "value", /*volume*/ ctx[4]);
    			}

    			if (!/*disableTooltip*/ ctx[9] && (/*inlineTooltip*/ ctx[8] || /*showTooltip*/ ctx[14])) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    					transition_in(if_block2, 1);
    				} else {
    					if_block2 = create_if_block_1(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div1, null);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if_block0.d();
    			/*progress0_binding*/ ctx[31](null);
    			if_block1.d();
    			/*progress1_binding*/ ctx[36](null);
    			if (if_block2) if_block2.d();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(186:0) {#if display}",
    		ctx
    	});

    	return block;
    }

    // (193:12) {:else}
    function create_else_block_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("pause");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(193:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (191:12) {#if paused}
    function create_if_block_7(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("play_arrow");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(191:12) {#if paused}",
    		ctx
    	});

    	return block;
    }

    // (216:12) {:else}
    function create_else_block_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("volume_up");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(216:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (214:34) 
    function create_if_block_6(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("volume_down");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(214:34) ",
    		ctx
    	});

    	return block;
    }

    // (212:35) 
    function create_if_block_5(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("volume_mute");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(212:35) ",
    		ctx
    	});

    	return block;
    }

    // (210:12) {#if muted}
    function create_if_block_4(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("volume_off");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(210:12) {#if muted}",
    		ctx
    	});

    	return block;
    }

    // (227:8) {#if !disableTooltip && (inlineTooltip || showTooltip)}
    function create_if_block_1(ctx) {
    	let div;
    	let div_transition;
    	let current;

    	function select_block_type_2(ctx, dirty) {
    		if (/*showTooltip*/ ctx[14]) return create_if_block_2;
    		if (/*duration*/ ctx[2] > 3600) return create_if_block_3;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type_2(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "tooltip svelte-1acgf3l");
    			set_style(div, "--left", /*tooltipX*/ ctx[12] + "px");
    			set_style(div, "--top", /*tooltipY*/ ctx[13] + "px");
    			toggle_class(div, "hover-tooltip", !/*inlineTooltip*/ ctx[8]);
    			add_location(div, file, 227, 12, 6429);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    			/*div_binding*/ ctx[38](div);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_2(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}

    			if (!current || dirty[0] & /*tooltipX*/ 4096) {
    				set_style(div, "--left", /*tooltipX*/ ctx[12] + "px");
    			}

    			if (!current || dirty[0] & /*tooltipY*/ 8192) {
    				set_style(div, "--top", /*tooltipY*/ ctx[13] + "px");
    			}

    			if (dirty[0] & /*inlineTooltip*/ 256) {
    				toggle_class(div, "hover-tooltip", !/*inlineTooltip*/ ctx[8]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fade, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fade, {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    			/*div_binding*/ ctx[38](null);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(227:8) {#if !disableTooltip && (inlineTooltip || showTooltip)}",
    		ctx
    	});

    	return block;
    }

    // (240:20) {:else}
    function create_else_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("--:--");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(240:20) {:else}",
    		ctx
    	});

    	return block;
    }

    // (238:20) {#if duration > 3600}
    function create_if_block_3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("--:--:--");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(238:20) {#if duration > 3600}",
    		ctx
    	});

    	return block;
    }

    // (235:16) {#if showTooltip}
    function create_if_block_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*seekText*/ ctx[15]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*seekText*/ 32768) set_data_dev(t, /*seekText*/ ctx[15]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(235:16) {#if showTooltip}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let t;
    	let audio_1;
    	let audio_1_src_value;
    	let audio_1_is_paused = true;
    	let audio_1_updating = false;
    	let audio_1_animationframe;
    	let current;
    	let dispose;
    	let if_block = /*display*/ ctx[5] && create_if_block(ctx);

    	function audio_1_timeupdate_handler() {
    		cancelAnimationFrame(audio_1_animationframe);

    		if (!audio_1.paused) {
    			audio_1_animationframe = raf(audio_1_timeupdate_handler);
    			audio_1_updating = true;
    		}

    		/*audio_1_timeupdate_handler*/ ctx[42].call(audio_1);
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t = space();
    			audio_1 = element("audio");
    			audio_1.muted = /*muted*/ ctx[3];
    			attr_dev(audio_1, "volume", /*volume*/ ctx[4]);
    			if (audio_1.src !== (audio_1_src_value = /*src*/ ctx[6])) attr_dev(audio_1, "src", audio_1_src_value);
    			attr_dev(audio_1, "preload", /*preload*/ ctx[7]);
    			if (/*duration*/ ctx[2] === void 0) add_render_callback(() => /*audio_1_durationchange_handler*/ ctx[41].call(audio_1));
    			add_location(audio_1, file, 248, 0, 7008);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, audio_1, anchor);
    			/*audio_1_binding*/ ctx[39](audio_1);
    			current = true;

    			dispose = [
    				listen_dev(window, "mouseup", /*mouseup_handler*/ ctx[29], false, false, false),
    				listen_dev(window, "mousemove", /*trackMouse*/ ctx[22], false, false, false),
    				listen_dev(audio_1, "play", /*audio_1_play_pause_handler*/ ctx[40]),
    				listen_dev(audio_1, "pause", /*audio_1_play_pause_handler*/ ctx[40]),
    				listen_dev(audio_1, "durationchange", /*audio_1_durationchange_handler*/ ctx[41]),
    				listen_dev(audio_1, "timeupdate", audio_1_timeupdate_handler),
    				listen_dev(audio_1, "play", /*play_handler*/ ctx[27], false, false, false),
    				listen_dev(audio_1, "ended", /*ended_handler*/ ctx[28], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (/*display*/ ctx[5]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(t.parentNode, t);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty[0] & /*muted*/ 8) {
    				prop_dev(audio_1, "muted", /*muted*/ ctx[3]);
    			}

    			if (!current || dirty[0] & /*volume*/ 16) {
    				attr_dev(audio_1, "volume", /*volume*/ ctx[4]);
    			}

    			if (!current || dirty[0] & /*src*/ 64 && audio_1.src !== (audio_1_src_value = /*src*/ ctx[6])) {
    				attr_dev(audio_1, "src", audio_1_src_value);
    			}

    			if (!current || dirty[0] & /*preload*/ 128) {
    				attr_dev(audio_1, "preload", /*preload*/ ctx[7]);
    			}

    			if (dirty[0] & /*paused*/ 2 && audio_1_is_paused !== (audio_1_is_paused = /*paused*/ ctx[1])) {
    				audio_1[audio_1_is_paused ? "pause" : "play"]();
    			}

    			if (!audio_1_updating && dirty[0] & /*currentTime*/ 1024 && !isNaN_1(/*currentTime*/ ctx[10])) {
    				audio_1.currentTime = /*currentTime*/ ctx[10];
    			}

    			audio_1_updating = false;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(audio_1);
    			/*audio_1_binding*/ ctx[39](null);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function seek(event, bounds) {
    	let x = event.pageX - bounds.left;
    	return Math.min(Math.max(x / bounds.width, 0), 1);
    }

    function formatSeconds(seconds) {
    	if (isNaN(seconds)) return "No Data";
    	var sec_num = parseInt(seconds, 10);
    	var hours = Math.floor(sec_num / 3600);
    	var minutes = Math.floor(sec_num / 60) % 60;
    	var seconds = sec_num % 60;
    	return [hours, minutes, seconds].map(v => v < 10 ? "0" + v : v).filter((v, i) => v !== "00" || i > 0).join(":");
    }

    function instance($$self, $$props, $$invalidate) {
    	let { src } = $$props;
    	let { audio = null } = $$props;
    	let { paused = true } = $$props;
    	let { duration = 0 } = $$props;
    	let { muted = false } = $$props;
    	let { volume = 1 } = $$props;
    	let { preload = "metadata" } = $$props;
    	let { display = true } = $$props;
    	let { inlineTooltip = false } = $$props;
    	let { disableTooltip = false } = $$props;
    	const dispatch = createEventDispatcher();
    	let currentTime = 0;
    	let tooltip;
    	let tooltipX = 0;
    	let tooltipY = 0;
    	let showTooltip = false;
    	let seekText = "";
    	let seeking = false;
    	let volumeSeeking = false;
    	let songBar;
    	let volumeBar;

    	function hide() {
    		$$invalidate(5, display = false);
    	}

    	function show() {
    		$$invalidate(5, display = true);
    	}

    	function seekAudio(event) {
    		if (!songBar) return;
    		$$invalidate(0, audio.currentTime = seek(event, songBar.getBoundingClientRect()) * duration, audio);
    	}

    	function seekVolume(event) {
    		if (!volumeBar) return;
    		$$invalidate(4, volume = seek(event, volumeBar.getBoundingClientRect()));
    		$$invalidate(0, audio.volume = volume, audio);
    		$$invalidate(3, muted = false);
    	}

    	function seekTooltip(event) {
    		if (!inlineTooltip) {
    			let tooltipBounds = tooltip.getBoundingClientRect();
    			$$invalidate(12, tooltipX = event.pageX - tooltipBounds.width - 10);
    			$$invalidate(13, tooltipY = songBar.offsetTop + 10);
    		}

    		let bounds = songBar.getBoundingClientRect();
    		let seekValue = (event.pageX - bounds.left) * duration / bounds.width;
    		$$invalidate(15, seekText = formatSeconds(seekValue));
    	}

    	function trackMouse(event) {
    		if (seeking) seekAudio(event);
    		if (showTooltip && !disableTooltip) seekTooltip(event);
    		if (volumeSeeking) seekVolume(event);
    	}

    	const writable_props = [
    		"src",
    		"audio",
    		"paused",
    		"duration",
    		"muted",
    		"volume",
    		"preload",
    		"display",
    		"inlineTooltip",
    		"disableTooltip"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<AudioControls> was created with unknown prop '${key}'`);
    	});

    	function play_handler(event) {
    		bubble($$self, event);
    	}

    	function ended_handler(event) {
    		bubble($$self, event);
    	}

    	const mouseup_handler = () => $$invalidate(16, seeking = $$invalidate(17, volumeSeeking = false));
    	const click_handler = () => audio.paused ? audio.play() : audio.pause();

    	function progress0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(18, songBar = $$value);
    		});
    	}

    	const mousedown_handler = () => $$invalidate(16, seeking = true);
    	const mouseenter_handler = () => $$invalidate(14, showTooltip = true);
    	const mouseleave_handler = () => $$invalidate(14, showTooltip = false);
    	const click_handler_1 = () => $$invalidate(3, muted = !muted);

    	function progress1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(19, volumeBar = $$value);
    		});
    	}

    	const mousedown_handler_1 = () => $$invalidate(17, volumeSeeking = true);

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(11, tooltip = $$value);
    		});
    	}

    	function audio_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(0, audio = $$value);
    		});
    	}

    	function audio_1_play_pause_handler() {
    		paused = this.paused;
    		$$invalidate(1, paused);
    	}

    	function audio_1_durationchange_handler() {
    		duration = this.duration;
    		$$invalidate(2, duration);
    	}

    	function audio_1_timeupdate_handler() {
    		currentTime = this.currentTime;
    		$$invalidate(10, currentTime);
    	}

    	$$self.$set = $$props => {
    		if ("src" in $$props) $$invalidate(6, src = $$props.src);
    		if ("audio" in $$props) $$invalidate(0, audio = $$props.audio);
    		if ("paused" in $$props) $$invalidate(1, paused = $$props.paused);
    		if ("duration" in $$props) $$invalidate(2, duration = $$props.duration);
    		if ("muted" in $$props) $$invalidate(3, muted = $$props.muted);
    		if ("volume" in $$props) $$invalidate(4, volume = $$props.volume);
    		if ("preload" in $$props) $$invalidate(7, preload = $$props.preload);
    		if ("display" in $$props) $$invalidate(5, display = $$props.display);
    		if ("inlineTooltip" in $$props) $$invalidate(8, inlineTooltip = $$props.inlineTooltip);
    		if ("disableTooltip" in $$props) $$invalidate(9, disableTooltip = $$props.disableTooltip);
    	};

    	$$self.$capture_state = () => {
    		return {
    			src,
    			audio,
    			paused,
    			duration,
    			muted,
    			volume,
    			preload,
    			display,
    			inlineTooltip,
    			disableTooltip,
    			currentTime,
    			tooltip,
    			tooltipX,
    			tooltipY,
    			showTooltip,
    			seekText,
    			seeking,
    			volumeSeeking,
    			songBar,
    			volumeBar
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("src" in $$props) $$invalidate(6, src = $$props.src);
    		if ("audio" in $$props) $$invalidate(0, audio = $$props.audio);
    		if ("paused" in $$props) $$invalidate(1, paused = $$props.paused);
    		if ("duration" in $$props) $$invalidate(2, duration = $$props.duration);
    		if ("muted" in $$props) $$invalidate(3, muted = $$props.muted);
    		if ("volume" in $$props) $$invalidate(4, volume = $$props.volume);
    		if ("preload" in $$props) $$invalidate(7, preload = $$props.preload);
    		if ("display" in $$props) $$invalidate(5, display = $$props.display);
    		if ("inlineTooltip" in $$props) $$invalidate(8, inlineTooltip = $$props.inlineTooltip);
    		if ("disableTooltip" in $$props) $$invalidate(9, disableTooltip = $$props.disableTooltip);
    		if ("currentTime" in $$props) $$invalidate(10, currentTime = $$props.currentTime);
    		if ("tooltip" in $$props) $$invalidate(11, tooltip = $$props.tooltip);
    		if ("tooltipX" in $$props) $$invalidate(12, tooltipX = $$props.tooltipX);
    		if ("tooltipY" in $$props) $$invalidate(13, tooltipY = $$props.tooltipY);
    		if ("showTooltip" in $$props) $$invalidate(14, showTooltip = $$props.showTooltip);
    		if ("seekText" in $$props) $$invalidate(15, seekText = $$props.seekText);
    		if ("seeking" in $$props) $$invalidate(16, seeking = $$props.seeking);
    		if ("volumeSeeking" in $$props) $$invalidate(17, volumeSeeking = $$props.volumeSeeking);
    		if ("songBar" in $$props) $$invalidate(18, songBar = $$props.songBar);
    		if ("volumeBar" in $$props) $$invalidate(19, volumeBar = $$props.volumeBar);
    	};

    	return [
    		audio,
    		paused,
    		duration,
    		muted,
    		volume,
    		display,
    		src,
    		preload,
    		inlineTooltip,
    		disableTooltip,
    		currentTime,
    		tooltip,
    		tooltipX,
    		tooltipY,
    		showTooltip,
    		seekText,
    		seeking,
    		volumeSeeking,
    		songBar,
    		volumeBar,
    		seekAudio,
    		seekVolume,
    		trackMouse,
    		hide,
    		show,
    		dispatch,
    		seekTooltip,
    		play_handler,
    		ended_handler,
    		mouseup_handler,
    		click_handler,
    		progress0_binding,
    		mousedown_handler,
    		mouseenter_handler,
    		mouseleave_handler,
    		click_handler_1,
    		progress1_binding,
    		mousedown_handler_1,
    		div_binding,
    		audio_1_binding,
    		audio_1_play_pause_handler,
    		audio_1_durationchange_handler,
    		audio_1_timeupdate_handler
    	];
    }

    class AudioControls extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance,
    			create_fragment,
    			safe_not_equal,
    			{
    				src: 6,
    				audio: 0,
    				paused: 1,
    				duration: 2,
    				muted: 3,
    				volume: 4,
    				preload: 7,
    				display: 5,
    				inlineTooltip: 8,
    				disableTooltip: 9,
    				hide: 23,
    				show: 24
    			},
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AudioControls",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*src*/ ctx[6] === undefined && !("src" in props)) {
    			console.warn("<AudioControls> was created without expected prop 'src'");
    		}
    	}

    	get src() {
    		return this.$$.ctx[6];
    	}

    	set src(src) {
    		this.$set({ src });
    		flush();
    	}

    	get audio() {
    		return this.$$.ctx[0];
    	}

    	set audio(audio) {
    		this.$set({ audio });
    		flush();
    	}

    	get paused() {
    		return this.$$.ctx[1];
    	}

    	set paused(paused) {
    		this.$set({ paused });
    		flush();
    	}

    	get duration() {
    		return this.$$.ctx[2];
    	}

    	set duration(duration) {
    		this.$set({ duration });
    		flush();
    	}

    	get muted() {
    		return this.$$.ctx[3];
    	}

    	set muted(muted) {
    		this.$set({ muted });
    		flush();
    	}

    	get volume() {
    		return this.$$.ctx[4];
    	}

    	set volume(volume) {
    		this.$set({ volume });
    		flush();
    	}

    	get preload() {
    		return this.$$.ctx[7];
    	}

    	set preload(preload) {
    		this.$set({ preload });
    		flush();
    	}

    	get display() {
    		return this.$$.ctx[5];
    	}

    	set display(display) {
    		this.$set({ display });
    		flush();
    	}

    	get inlineTooltip() {
    		return this.$$.ctx[8];
    	}

    	set inlineTooltip(inlineTooltip) {
    		this.$set({ inlineTooltip });
    		flush();
    	}

    	get disableTooltip() {
    		return this.$$.ctx[9];
    	}

    	set disableTooltip(disableTooltip) {
    		this.$set({ disableTooltip });
    		flush();
    	}

    	get hide() {
    		return this.$$.ctx[23];
    	}

    	set hide(value) {
    		throw new Error("<AudioControls>: Cannot set read-only property 'hide'");
    	}

    	get show() {
    		return this.$$.ctx[24];
    	}

    	set show(value) {
    		throw new Error("<AudioControls>: Cannot set read-only property 'show'");
    	}
    }

    /* node_modules\linkcube-svelte-components\src\iconButton\iconButton.svelte generated by Svelte v3.18.2 */

    const file$1 = "node_modules\\linkcube-svelte-components\\src\\iconButton\\iconButton.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let button;
    	let t;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			t = text(/*icon*/ ctx[0]);
    			attr_dev(button, "title", /*title*/ ctx[1]);
    			attr_dev(button, "class", "material-icons svelte-1lww0x6");
    			set_style(button, "--scaleX", /*scaleX*/ ctx[2]);
    			set_style(button, "--scaleY", /*scaleY*/ ctx[3]);
    			add_location(button, file$1, 37, 4, 997);
    			add_location(div, file$1, 36, 0, 986);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			append_dev(button, t);

    			dispose = [
    				listen_dev(button, "click", /*click_handler*/ ctx[4], false, false, false),
    				listen_dev(button, "dragenter", /*dragenter_handler*/ ctx[5], false, false, false),
    				listen_dev(button, "dragover", /*dragover_handler*/ ctx[6], false, false, false),
    				listen_dev(button, "drop", /*drop_handler*/ ctx[7], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*icon*/ 1) set_data_dev(t, /*icon*/ ctx[0]);

    			if (dirty & /*title*/ 2) {
    				attr_dev(button, "title", /*title*/ ctx[1]);
    			}

    			if (dirty & /*scaleX*/ 4) {
    				set_style(button, "--scaleX", /*scaleX*/ ctx[2]);
    			}

    			if (dirty & /*scaleY*/ 8) {
    				set_style(button, "--scaleY", /*scaleY*/ ctx[3]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { icon } = $$props;
    	let { title = "" } = $$props;
    	let { scaleX = 1 } = $$props;
    	let { scaleY = 1 } = $$props;
    	const writable_props = ["icon", "title", "scaleX", "scaleY"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<IconButton> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	function dragenter_handler(event) {
    		bubble($$self, event);
    	}

    	function dragover_handler(event) {
    		bubble($$self, event);
    	}

    	function drop_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ("icon" in $$props) $$invalidate(0, icon = $$props.icon);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("scaleX" in $$props) $$invalidate(2, scaleX = $$props.scaleX);
    		if ("scaleY" in $$props) $$invalidate(3, scaleY = $$props.scaleY);
    	};

    	$$self.$capture_state = () => {
    		return { icon, title, scaleX, scaleY };
    	};

    	$$self.$inject_state = $$props => {
    		if ("icon" in $$props) $$invalidate(0, icon = $$props.icon);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("scaleX" in $$props) $$invalidate(2, scaleX = $$props.scaleX);
    		if ("scaleY" in $$props) $$invalidate(3, scaleY = $$props.scaleY);
    	};

    	return [
    		icon,
    		title,
    		scaleX,
    		scaleY,
    		click_handler,
    		dragenter_handler,
    		dragover_handler,
    		drop_handler
    	];
    }

    class IconButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { icon: 0, title: 1, scaleX: 2, scaleY: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "IconButton",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*icon*/ ctx[0] === undefined && !("icon" in props)) {
    			console.warn("<IconButton> was created without expected prop 'icon'");
    		}
    	}

    	get icon() {
    		throw new Error("<IconButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<IconButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<IconButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<IconButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scaleX() {
    		throw new Error("<IconButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scaleX(value) {
    		throw new Error("<IconButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scaleY() {
    		throw new Error("<IconButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scaleY(value) {
    		throw new Error("<IconButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\linkcube-svelte-components\src\materialButton\materialButton.svelte generated by Svelte v3.18.2 */

    const file$2 = "node_modules\\linkcube-svelte-components\\src\\materialButton\\materialButton.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let span;
    	let t;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t = text(/*value*/ ctx[0]);
    			attr_dev(span, "class", "container svelte-1crnktv");
    			add_location(span, file$2, 35, 4, 866);
    			attr_dev(div, "class", "svelte-1crnktv");
    			add_location(div, file$2, 34, 0, 855);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(span, t);

    			dispose = [
    				listen_dev(span, "click", /*click_handler*/ ctx[1], false, false, false),
    				listen_dev(span, "dragenter", /*dragenter_handler*/ ctx[2], false, false, false),
    				listen_dev(span, "dragover", /*dragover_handler*/ ctx[3], false, false, false),
    				listen_dev(span, "drop", /*drop_handler*/ ctx[4], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*value*/ 1) set_data_dev(t, /*value*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { value } = $$props;
    	const writable_props = ["value"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<MaterialButton> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	function dragenter_handler(event) {
    		bubble($$self, event);
    	}

    	function dragover_handler(event) {
    		bubble($$self, event);
    	}

    	function drop_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    	};

    	$$self.$capture_state = () => {
    		return { value };
    	};

    	$$self.$inject_state = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    	};

    	return [value, click_handler, dragenter_handler, dragover_handler, drop_handler];
    }

    class MaterialButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { value: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MaterialButton",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*value*/ ctx[0] === undefined && !("value" in props)) {
    			console.warn("<MaterialButton> was created without expected prop 'value'");
    		}
    	}

    	get value() {
    		throw new Error("<MaterialButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<MaterialButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\linkcube-svelte-components\src\materialInput\materialInput.svelte generated by Svelte v3.18.2 */
    const file$3 = "node_modules\\linkcube-svelte-components\\src\\materialInput\\materialInput.svelte";

    function create_fragment$3(ctx) {
    	let div1;
    	let div0;
    	let input;
    	let t0;
    	let label0;
    	let t1;
    	let t2;
    	let label1;
    	let t3;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			label0 = element("label");
    			t1 = text(/*label*/ ctx[1]);
    			t2 = space();
    			label1 = element("label");
    			t3 = text(/*hintText*/ ctx[3]);
    			attr_dev(input, "id", /*id*/ ctx[2]);
    			attr_dev(input, "placeholder", " ");
    			attr_dev(input, "class", "svelte-1q62n5w");
    			add_location(input, file$3, 103, 8, 2582);
    			attr_dev(label0, "class", "float-text svelte-1q62n5w");
    			add_location(label0, file$3, 104, 8, 2670);
    			attr_dev(div0, "class", "form-field-control svelte-1q62n5w");
    			add_location(div0, file$3, 102, 4, 2540);
    			attr_dev(label1, "class", "hint-text svelte-1q62n5w");
    			add_location(label1, file$3, 106, 4, 2729);
    			attr_dev(div1, "class", "form-field svelte-1q62n5w");
    			add_location(div1, file$3, 101, 0, 2510);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, input);
    			set_input_value(input, /*value*/ ctx[0]);
    			append_dev(div0, t0);
    			append_dev(div0, label0);
    			append_dev(label0, t1);
    			append_dev(div1, t2);
    			append_dev(div1, label1);
    			append_dev(label1, t3);

    			dispose = [
    				listen_dev(input, "input", /*input_input_handler*/ ctx[7]),
    				listen_dev(input, "blur", /*blur_handler*/ ctx[6], false, false, false),
    				listen_dev(input, "keydown", /*handleKey*/ ctx[4], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*id*/ 4) {
    				attr_dev(input, "id", /*id*/ ctx[2]);
    			}

    			if (dirty & /*value*/ 1 && input.value !== /*value*/ ctx[0]) {
    				set_input_value(input, /*value*/ ctx[0]);
    			}

    			if (dirty & /*label*/ 2) set_data_dev(t1, /*label*/ ctx[1]);
    			if (dirty & /*hintText*/ 8) set_data_dev(t3, /*hintText*/ ctx[3]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { value = "" } = $$props;
    	let { label = "" } = $$props;
    	let { id = "" } = $$props;
    	let { hintText = "" } = $$props;
    	const dispatch = createEventDispatcher();

    	function handleKey(e) {
    		if (e.key === "Enter") {
    			e.preventDefault();
    			dispatch("enter");
    		}
    	}

    	const writable_props = ["value", "label", "id", "hintText"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<MaterialInput> was created with unknown prop '${key}'`);
    	});

    	function blur_handler(event) {
    		bubble($$self, event);
    	}

    	function input_input_handler() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	$$self.$set = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("label" in $$props) $$invalidate(1, label = $$props.label);
    		if ("id" in $$props) $$invalidate(2, id = $$props.id);
    		if ("hintText" in $$props) $$invalidate(3, hintText = $$props.hintText);
    	};

    	$$self.$capture_state = () => {
    		return { value, label, id, hintText };
    	};

    	$$self.$inject_state = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("label" in $$props) $$invalidate(1, label = $$props.label);
    		if ("id" in $$props) $$invalidate(2, id = $$props.id);
    		if ("hintText" in $$props) $$invalidate(3, hintText = $$props.hintText);
    	};

    	return [
    		value,
    		label,
    		id,
    		hintText,
    		handleKey,
    		dispatch,
    		blur_handler,
    		input_input_handler
    	];
    }

    class MaterialInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { value: 0, label: 1, id: 2, hintText: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MaterialInput",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get value() {
    		throw new Error("<MaterialInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<MaterialInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<MaterialInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<MaterialInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<MaterialInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<MaterialInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hintText() {
    		throw new Error("<MaterialInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hintText(value) {
    		throw new Error("<MaterialInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\linkcube-svelte-components\src\materialSelect\materialSelect.svelte generated by Svelte v3.18.2 */
    const file$4 = "node_modules\\linkcube-svelte-components\\src\\materialSelect\\materialSelect.svelte";

    function create_fragment$4(ctx) {
    	let div2;
    	let div1;
    	let select;
    	let scale_action;
    	let t0;
    	let label_1;
    	let t1;
    	let t2;
    	let div0;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[7].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], null);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			select = element("select");
    			if (default_slot) default_slot.c();
    			t0 = space();
    			label_1 = element("label");
    			t1 = text(/*label*/ ctx[1]);
    			t2 = space();
    			div0 = element("div");
    			div0.textContent = "arrow_drop_down";
    			set_style(select, "--width", /*width*/ ctx[2] + "px");
    			attr_dev(select, "class", "svelte-1n9xlkh");
    			if (/*value*/ ctx[0] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[12].call(select));
    			add_location(select, file$4, 144, 8, 3728);
    			attr_dev(label_1, "class", "float-text svelte-1n9xlkh");
    			add_location(label_1, file$4, 153, 8, 3980);
    			attr_dev(div0, "class", "material-icons svelte-1n9xlkh");
    			add_location(div0, file$4, 154, 8, 4031);
    			attr_dev(div1, "class", "form-field-control svelte-1n9xlkh");
    			add_location(div1, file$4, 143, 4, 3686);
    			attr_dev(div2, "class", "form-field svelte-1n9xlkh");
    			add_location(div2, file$4, 142, 0, 3656);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, select);

    			if (default_slot) {
    				default_slot.m(select, null);
    			}

    			/*select_binding*/ ctx[11](select);
    			select_option(select, /*value*/ ctx[0]);
    			append_dev(div1, t0);
    			append_dev(div1, label_1);
    			append_dev(label_1, t1);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			current = true;

    			dispose = [
    				listen_dev(select, "change", /*select_change_handler*/ ctx[12]),
    				action_destroyer(scale_action = /*scale*/ ctx[4].call(null, select, /*value*/ ctx[0])),
    				listen_dev(select, "blur", /*blur_handler*/ ctx[8], false, false, false),
    				listen_dev(select, "change", /*change_handler*/ ctx[9], false, false, false),
    				listen_dev(select, "input", /*input_handler*/ ctx[10], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 64) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[6], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[6], dirty, null));
    			}

    			if (!current || dirty & /*width*/ 4) {
    				set_style(select, "--width", /*width*/ ctx[2] + "px");
    			}

    			if (dirty & /*value*/ 1) {
    				select_option(select, /*value*/ ctx[0]);
    			}

    			if (scale_action && is_function(scale_action.update) && dirty & /*value*/ 1) scale_action.update.call(null, /*value*/ ctx[0]);
    			if (!current || dirty & /*label*/ 2) set_data_dev(t1, /*label*/ ctx[1]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (default_slot) default_slot.d(detaching);
    			/*select_binding*/ ctx[11](null);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { value } = $$props;
    	let { label = "" } = $$props;
    	let width = 140;
    	let selectEl;

    	function updateSize() {
    		if (selectEl && selectEl.selectedOptions.length > 0) {
    			let textLen = selectEl.selectedOptions[0].label.length;

    			if (label.length === 0) {
    				$$invalidate(2, width = 40 + 10 * textLen);
    			} else if (label.length < textLen) {
    				$$invalidate(2, width = Math.max(10 * textLen, 140));
    			} else {
    				$$invalidate(2, width = 140);
    			}
    		} else {
    			if (label.length === 0) {
    				$$invalidate(2, width = 40 + 10 * JSON.stringify(value).length);
    			} else if (label.length > 12) {
    				$$invalidate(2, width = 10 * label.length);
    			}
    		}
    	}

    	function scale(node, value) {
    		return {
    			update(value) {
    				updateSize();
    			},
    			destroy() {
    				
    			}
    		};
    	}

    	onMount(updateSize);
    	const writable_props = ["value", "label"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<MaterialSelect> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	function blur_handler(event) {
    		bubble($$self, event);
    	}

    	function change_handler(event) {
    		bubble($$self, event);
    	}

    	function input_handler(event) {
    		bubble($$self, event);
    	}

    	function select_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(3, selectEl = $$value);
    		});
    	}

    	function select_change_handler() {
    		value = select_value(this);
    		$$invalidate(0, value);
    	}

    	$$self.$set = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("label" in $$props) $$invalidate(1, label = $$props.label);
    		if ("$$scope" in $$props) $$invalidate(6, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { value, label, width, selectEl };
    	};

    	$$self.$inject_state = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("label" in $$props) $$invalidate(1, label = $$props.label);
    		if ("width" in $$props) $$invalidate(2, width = $$props.width);
    		if ("selectEl" in $$props) $$invalidate(3, selectEl = $$props.selectEl);
    	};

    	return [
    		value,
    		label,
    		width,
    		selectEl,
    		scale,
    		updateSize,
    		$$scope,
    		$$slots,
    		blur_handler,
    		change_handler,
    		input_handler,
    		select_binding,
    		select_change_handler
    	];
    }

    class MaterialSelect extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { value: 0, label: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MaterialSelect",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*value*/ ctx[0] === undefined && !("value" in props)) {
    			console.warn("<MaterialSelect> was created without expected prop 'value'");
    		}
    	}

    	get value() {
    		throw new Error("<MaterialSelect>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<MaterialSelect>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<MaterialSelect>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<MaterialSelect>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\linkcube-svelte-components\src\materialTable\materialTable.svelte generated by Svelte v3.18.2 */
    const file$5 = "node_modules\\linkcube-svelte-components\\src\\materialTable\\materialTable.svelte";
    const get_footer_slot_changes = dirty => ({});
    const get_footer_slot_context = ctx => ({});
    const get_item_slot_changes = dirty => ({ item: dirty & /*items*/ 1 });

    const get_item_slot_context = ctx => ({
    	item: /*item*/ ctx[5],
    	index: /*index*/ ctx[7]
    });

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    const get_header_slot_changes = dirty => ({});
    const get_header_slot_context = ctx => ({});

    // (37:8) {#each items as item, index}
    function create_each_block(ctx) {
    	let current;
    	const item_slot_template = /*$$slots*/ ctx[4].item;
    	const item_slot = create_slot(item_slot_template, ctx, /*$$scope*/ ctx[3], get_item_slot_context);

    	const block = {
    		c: function create() {
    			if (item_slot) item_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (item_slot) {
    				item_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (item_slot && item_slot.p && dirty & /*$$scope, items*/ 9) {
    				item_slot.p(get_slot_context(item_slot_template, ctx, /*$$scope*/ ctx[3], get_item_slot_context), get_slot_changes(item_slot_template, /*$$scope*/ ctx[3], dirty, get_item_slot_changes));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(item_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(item_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (item_slot) item_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(37:8) {#each items as item, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div;
    	let span0;
    	let t0;
    	let span1;
    	let t1;
    	let span2;
    	let current;
    	const header_slot_template = /*$$slots*/ ctx[4].header;
    	const header_slot = create_slot(header_slot_template, ctx, /*$$scope*/ ctx[3], get_header_slot_context);
    	let each_value = /*items*/ ctx[0];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const footer_slot_template = /*$$slots*/ ctx[4].footer;
    	const footer_slot = create_slot(footer_slot_template, ctx, /*$$scope*/ ctx[3], get_footer_slot_context);

    	const block = {
    		c: function create() {
    			div = element("div");
    			span0 = element("span");
    			if (header_slot) header_slot.c();
    			t0 = space();
    			span1 = element("span");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			span2 = element("span");
    			if (footer_slot) footer_slot.c();
    			attr_dev(span0, "class", "row svelte-qijje6");
    			add_location(span0, file$5, 32, 4, 632);
    			attr_dev(span1, "class", "items-container svelte-qijje6");
    			set_style(span1, "--height", /*height*/ ctx[1]);
    			add_location(span1, file$5, 35, 4, 706);
    			attr_dev(span2, "class", "row svelte-qijje6");
    			add_location(span2, file$5, 40, 4, 892);
    			attr_dev(div, "class", "table-container svelte-qijje6");
    			add_location(div, file$5, 31, 0, 597);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span0);

    			if (header_slot) {
    				header_slot.m(span0, null);
    			}

    			append_dev(div, t0);
    			append_dev(div, span1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(span1, null);
    			}

    			append_dev(div, t1);
    			append_dev(div, span2);

    			if (footer_slot) {
    				footer_slot.m(span2, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (header_slot && header_slot.p && dirty & /*$$scope*/ 8) {
    				header_slot.p(get_slot_context(header_slot_template, ctx, /*$$scope*/ ctx[3], get_header_slot_context), get_slot_changes(header_slot_template, /*$$scope*/ ctx[3], dirty, get_header_slot_changes));
    			}

    			if (dirty & /*$$scope, items*/ 9) {
    				each_value = /*items*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(span1, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty & /*height*/ 2) {
    				set_style(span1, "--height", /*height*/ ctx[1]);
    			}

    			if (footer_slot && footer_slot.p && dirty & /*$$scope*/ 8) {
    				footer_slot.p(get_slot_context(footer_slot_template, ctx, /*$$scope*/ ctx[3], get_footer_slot_context), get_slot_changes(footer_slot_template, /*$$scope*/ ctx[3], dirty, get_footer_slot_changes));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header_slot, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(footer_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header_slot, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(footer_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (header_slot) header_slot.d(detaching);
    			destroy_each(each_blocks, detaching);
    			if (footer_slot) footer_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { items } = $$props;
    	let { columnSizes } = $$props;
    	let { height = "100%" } = $$props;
    	setContext("sizes", columnSizes);
    	const writable_props = ["items", "columnSizes", "height"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<MaterialTable> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("columnSizes" in $$props) $$invalidate(2, columnSizes = $$props.columnSizes);
    		if ("height" in $$props) $$invalidate(1, height = $$props.height);
    		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { items, columnSizes, height };
    	};

    	$$self.$inject_state = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("columnSizes" in $$props) $$invalidate(2, columnSizes = $$props.columnSizes);
    		if ("height" in $$props) $$invalidate(1, height = $$props.height);
    	};

    	return [items, height, columnSizes, $$scope, $$slots];
    }

    class MaterialTable extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { items: 0, columnSizes: 2, height: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MaterialTable",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*items*/ ctx[0] === undefined && !("items" in props)) {
    			console.warn("<MaterialTable> was created without expected prop 'items'");
    		}

    		if (/*columnSizes*/ ctx[2] === undefined && !("columnSizes" in props)) {
    			console.warn("<MaterialTable> was created without expected prop 'columnSizes'");
    		}
    	}

    	get items() {
    		throw new Error("<MaterialTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set items(value) {
    		throw new Error("<MaterialTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get columnSizes() {
    		throw new Error("<MaterialTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set columnSizes(value) {
    		throw new Error("<MaterialTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<MaterialTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<MaterialTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\linkcube-svelte-components\src\materialTable\materialTableRow.svelte generated by Svelte v3.18.2 */
    const file$6 = "node_modules\\linkcube-svelte-components\\src\\materialTable\\materialTableRow.svelte";
    const get_children_slot_changes = dirty => ({});
    const get_children_slot_context = ctx => ({});

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	child_ctx[12] = i;
    	return child_ctx;
    }

    // (56:4) {#if expand}
    function create_if_block_1$1(ctx) {
    	let span;
    	let current;

    	const iconbutton = new IconButton({
    			props: {
    				icon: /*expanded*/ ctx[3] ? "expand_more" : "chevron_right",
    				title: /*expanded*/ ctx[3] ? "Hide Children" : "Show Children"
    			},
    			$$inline: true
    		});

    	iconbutton.$on("click", /*toggle*/ ctx[6]);

    	const block = {
    		c: function create() {
    			span = element("span");
    			create_component(iconbutton.$$.fragment);
    			attr_dev(span, "class", "content svelte-4r4x9m");
    			set_style(span, "--width", "60px");
    			add_location(span, file$6, 56, 8, 1271);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			mount_component(iconbutton, span, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const iconbutton_changes = {};
    			if (dirty & /*expanded*/ 8) iconbutton_changes.icon = /*expanded*/ ctx[3] ? "expand_more" : "chevron_right";
    			if (dirty & /*expanded*/ 8) iconbutton_changes.title = /*expanded*/ ctx[3] ? "Hide Children" : "Show Children";
    			iconbutton.$set(iconbutton_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(iconbutton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(iconbutton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			destroy_component(iconbutton);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(56:4) {#if expand}",
    		ctx
    	});

    	return block;
    }

    // (65:4) {#each values as value, index}
    function create_each_block$1(ctx) {
    	let span;
    	let t_value = /*value*/ ctx[10] + "";
    	let t;
    	let span_title_value;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "content svelte-4r4x9m");
    			set_style(span, "--width", /*sizes*/ ctx[4][/*index*/ ctx[12]]);
    			attr_dev(span, "title", span_title_value = /*value*/ ctx[10]);
    			add_location(span, file$6, 65, 8, 1601);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*values*/ 1 && t_value !== (t_value = /*value*/ ctx[10] + "")) set_data_dev(t, t_value);

    			if (dirty & /*values*/ 1 && span_title_value !== (span_title_value = /*value*/ ctx[10])) {
    				attr_dev(span, "title", span_title_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(65:4) {#each values as value, index}",
    		ctx
    	});

    	return block;
    }

    // (69:0) {#if expanded}
    function create_if_block$1(ctx) {
    	let current;
    	const children_slot_template = /*$$slots*/ ctx[8].children;
    	const children_slot = create_slot(children_slot_template, ctx, /*$$scope*/ ctx[7], get_children_slot_context);

    	const block = {
    		c: function create() {
    			if (children_slot) children_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (children_slot) {
    				children_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (children_slot && children_slot.p && dirty & /*$$scope*/ 128) {
    				children_slot.p(get_slot_context(children_slot_template, ctx, /*$$scope*/ ctx[7], get_children_slot_context), get_slot_changes(children_slot_template, /*$$scope*/ ctx[7], dirty, get_children_slot_changes));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(children_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(children_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (children_slot) children_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(69:0) {#if expanded}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div;
    	let span;
    	let span_style_value;
    	let t0;
    	let t1;
    	let div_class_value;
    	let t2;
    	let if_block1_anchor;
    	let current;
    	let dispose;
    	let if_block0 = /*expand*/ ctx[5] && create_if_block_1$1(ctx);
    	let each_value = /*values*/ ctx[0];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	let if_block1 = /*expanded*/ ctx[3] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t0 = space();
    			if (if_block0) if_block0.c();
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			attr_dev(span, "class", "content svelte-4r4x9m");
    			attr_dev(span, "style", span_style_value = `--width: ${/*depth*/ ctx[2] * 15}px`);
    			add_location(span, file$6, 54, 4, 1185);
    			attr_dev(div, "class", div_class_value = "" + (null_to_empty(/*type*/ ctx[1]) + " svelte-4r4x9m"));
    			add_location(div, file$6, 53, 0, 1152);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(div, t0);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			insert_dev(target, t2, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    			dispose = listen_dev(div, "click", /*click_handler*/ ctx[9], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*depth*/ 4 && span_style_value !== (span_style_value = `--width: ${/*depth*/ ctx[2] * 15}px`)) {
    				attr_dev(span, "style", span_style_value);
    			}

    			if (/*expand*/ ctx[5]) if_block0.p(ctx, dirty);

    			if (dirty & /*sizes, values*/ 17) {
    				each_value = /*values*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (!current || dirty & /*type*/ 2 && div_class_value !== (div_class_value = "" + (null_to_empty(/*type*/ ctx[1]) + " svelte-4r4x9m"))) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (/*expanded*/ ctx[3]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    					transition_in(if_block1, 1);
    				} else {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t2);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { values = [] } = $$props;
    	let { type = "row" } = $$props;
    	let { depth = 0 } = $$props;
    	const sizes = getContext("sizes");
    	const expand = type.includes("expand");
    	let expanded = false;

    	function toggle(e) {
    		e.preventDefault();
    		e.stopPropagation();
    		$$invalidate(3, expanded = !expanded);
    	}

    	const writable_props = ["values", "type", "depth"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<MaterialTableRow> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ("values" in $$props) $$invalidate(0, values = $$props.values);
    		if ("type" in $$props) $$invalidate(1, type = $$props.type);
    		if ("depth" in $$props) $$invalidate(2, depth = $$props.depth);
    		if ("$$scope" in $$props) $$invalidate(7, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { values, type, depth, expanded };
    	};

    	$$self.$inject_state = $$props => {
    		if ("values" in $$props) $$invalidate(0, values = $$props.values);
    		if ("type" in $$props) $$invalidate(1, type = $$props.type);
    		if ("depth" in $$props) $$invalidate(2, depth = $$props.depth);
    		if ("expanded" in $$props) $$invalidate(3, expanded = $$props.expanded);
    	};

    	return [
    		values,
    		type,
    		depth,
    		expanded,
    		sizes,
    		expand,
    		toggle,
    		$$scope,
    		$$slots,
    		click_handler
    	];
    }

    class MaterialTableRow extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { values: 0, type: 1, depth: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MaterialTableRow",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get values() {
    		throw new Error("<MaterialTableRow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set values(value) {
    		throw new Error("<MaterialTableRow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<MaterialTableRow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<MaterialTableRow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get depth() {
    		throw new Error("<MaterialTableRow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set depth(value) {
    		throw new Error("<MaterialTableRow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\linkcube-svelte-components\src\materialTextArea\materialTextArea.svelte generated by Svelte v3.18.2 */

    const file$7 = "node_modules\\linkcube-svelte-components\\src\\materialTextArea\\materialTextArea.svelte";

    function create_fragment$7(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let textarea;
    	let t0;
    	let label0;
    	let t1;
    	let t2;
    	let label1;
    	let t3;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			textarea = element("textarea");
    			t0 = space();
    			label0 = element("label");
    			t1 = text(/*label*/ ctx[1]);
    			t2 = space();
    			label1 = element("label");
    			t3 = text(/*hintText*/ ctx[3]);
    			attr_dev(textarea, "id", /*id*/ ctx[2]);
    			set_style(textarea, "--resize", /*resize*/ ctx[4]);
    			set_style(textarea, "--height", /*height*/ ctx[5] + "px");
    			set_style(textarea, "--width", /*width*/ ctx[6] + "px");
    			attr_dev(textarea, "placeholder", " ");
    			attr_dev(textarea, "class", "svelte-kir8j6");
    			add_location(textarea, file$7, 96, 12, 2419);
    			attr_dev(label0, "class", "float-text svelte-kir8j6");
    			add_location(label0, file$7, 103, 12, 2661);
    			attr_dev(div0, "class", "form-field-control svelte-kir8j6");
    			add_location(div0, file$7, 95, 8, 2373);
    			attr_dev(label1, "class", "hint-text svelte-kir8j6");
    			add_location(label1, file$7, 105, 8, 2728);
    			attr_dev(div1, "class", "form-field svelte-kir8j6");
    			add_location(div1, file$7, 94, 4, 2339);
    			add_location(div2, file$7, 93, 0, 2328);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, textarea);
    			set_input_value(textarea, /*value*/ ctx[0]);
    			append_dev(div0, t0);
    			append_dev(div0, label0);
    			append_dev(label0, t1);
    			append_dev(div1, t2);
    			append_dev(div1, label1);
    			append_dev(label1, t3);

    			dispose = [
    				listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[8]),
    				listen_dev(textarea, "blur", /*blur_handler*/ ctx[7], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*id*/ 4) {
    				attr_dev(textarea, "id", /*id*/ ctx[2]);
    			}

    			if (dirty & /*resize*/ 16) {
    				set_style(textarea, "--resize", /*resize*/ ctx[4]);
    			}

    			if (dirty & /*height*/ 32) {
    				set_style(textarea, "--height", /*height*/ ctx[5] + "px");
    			}

    			if (dirty & /*width*/ 64) {
    				set_style(textarea, "--width", /*width*/ ctx[6] + "px");
    			}

    			if (dirty & /*value*/ 1) {
    				set_input_value(textarea, /*value*/ ctx[0]);
    			}

    			if (dirty & /*label*/ 2) set_data_dev(t1, /*label*/ ctx[1]);
    			if (dirty & /*hintText*/ 8) set_data_dev(t3, /*hintText*/ ctx[3]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { value = "" } = $$props;
    	let { label = "" } = $$props;
    	let { id = "" } = $$props;
    	let { hintText = "" } = $$props;
    	let { resize = "both" } = $$props;
    	let { height = 80 } = $$props;
    	let { width = 250 } = $$props;
    	const writable_props = ["value", "label", "id", "hintText", "resize", "height", "width"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<MaterialTextArea> was created with unknown prop '${key}'`);
    	});

    	function blur_handler(event) {
    		bubble($$self, event);
    	}

    	function textarea_input_handler() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	$$self.$set = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("label" in $$props) $$invalidate(1, label = $$props.label);
    		if ("id" in $$props) $$invalidate(2, id = $$props.id);
    		if ("hintText" in $$props) $$invalidate(3, hintText = $$props.hintText);
    		if ("resize" in $$props) $$invalidate(4, resize = $$props.resize);
    		if ("height" in $$props) $$invalidate(5, height = $$props.height);
    		if ("width" in $$props) $$invalidate(6, width = $$props.width);
    	};

    	$$self.$capture_state = () => {
    		return {
    			value,
    			label,
    			id,
    			hintText,
    			resize,
    			height,
    			width
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("label" in $$props) $$invalidate(1, label = $$props.label);
    		if ("id" in $$props) $$invalidate(2, id = $$props.id);
    		if ("hintText" in $$props) $$invalidate(3, hintText = $$props.hintText);
    		if ("resize" in $$props) $$invalidate(4, resize = $$props.resize);
    		if ("height" in $$props) $$invalidate(5, height = $$props.height);
    		if ("width" in $$props) $$invalidate(6, width = $$props.width);
    	};

    	return [
    		value,
    		label,
    		id,
    		hintText,
    		resize,
    		height,
    		width,
    		blur_handler,
    		textarea_input_handler
    	];
    }

    class MaterialTextArea extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			value: 0,
    			label: 1,
    			id: 2,
    			hintText: 3,
    			resize: 4,
    			height: 5,
    			width: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MaterialTextArea",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get value() {
    		throw new Error("<MaterialTextArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<MaterialTextArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<MaterialTextArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<MaterialTextArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<MaterialTextArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<MaterialTextArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hintText() {
    		throw new Error("<MaterialTextArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hintText(value) {
    		throw new Error("<MaterialTextArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get resize() {
    		throw new Error("<MaterialTextArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set resize(value) {
    		throw new Error("<MaterialTextArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<MaterialTextArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<MaterialTextArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<MaterialTextArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<MaterialTextArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\linkcube-svelte-components\src\previewCard\previewCard.svelte generated by Svelte v3.18.2 */

    const file$8 = "node_modules\\linkcube-svelte-components\\src\\previewCard\\previewCard.svelte";

    // (120:0) {:else}
    function create_else_block$1(ctx) {
    	let button;
    	let t0;
    	let div;
    	let t1;
    	let dispose;
    	let if_block0 = /*backgroundSource*/ ctx[0] !== false && create_if_block_6$1(ctx);
    	let if_block1 = /*primaryText*/ ctx[1] && create_if_block_5$1(ctx);
    	let if_block2 = /*subText*/ ctx[2] && create_if_block_4$1(ctx);

    	const block = {
    		c: function create() {
    			button = element("button");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			div = element("div");
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			attr_dev(div, "class", "footer svelte-1ewyar1");
    			add_location(div, file$8, 126, 8, 3247);
    			attr_dev(button, "class", "card svelte-1ewyar1");
    			add_location(button, file$8, 120, 4, 3008);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			if (if_block0) if_block0.m(button, null);
    			append_dev(button, t0);
    			append_dev(button, div);
    			if (if_block1) if_block1.m(div, null);
    			append_dev(div, t1);
    			if (if_block2) if_block2.m(div, null);
    			dispose = listen_dev(button, "click", /*click_handler*/ ctx[6], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (/*backgroundSource*/ ctx[0] !== false) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_6$1(ctx);
    					if_block0.c();
    					if_block0.m(button, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*primaryText*/ ctx[1]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_5$1(ctx);
    					if_block1.c();
    					if_block1.m(div, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*subText*/ ctx[2]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_4$1(ctx);
    					if_block2.c();
    					if_block2.m(div, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(120:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (104:0) {#if disabled}
    function create_if_block$2(ctx) {
    	let span;
    	let t0;
    	let div;
    	let t1;
    	let if_block0 = /*backgroundSource*/ ctx[0] !== false && create_if_block_3$1(ctx);
    	let if_block1 = /*primaryText*/ ctx[1] && create_if_block_2$1(ctx);
    	let if_block2 = /*subText*/ ctx[2] && create_if_block_1$2(ctx);

    	const block = {
    		c: function create() {
    			span = element("span");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			div = element("div");
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			attr_dev(div, "class", "footer svelte-1ewyar1");
    			add_location(div, file$8, 110, 8, 2729);
    			attr_dev(span, "class", "card svelte-1ewyar1");
    			add_location(span, file$8, 104, 4, 2501);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			if (if_block0) if_block0.m(span, null);
    			append_dev(span, t0);
    			append_dev(span, div);
    			if (if_block1) if_block1.m(div, null);
    			append_dev(div, t1);
    			if (if_block2) if_block2.m(div, null);
    		},
    		p: function update(ctx, dirty) {
    			if (/*backgroundSource*/ ctx[0] !== false) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_3$1(ctx);
    					if_block0.c();
    					if_block0.m(span, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*primaryText*/ ctx[1]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_2$1(ctx);
    					if_block1.c();
    					if_block1.m(div, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*subText*/ ctx[2]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_1$2(ctx);
    					if_block2.c();
    					if_block2.m(div, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(104:0) {#if disabled}",
    		ctx
    	});

    	return block;
    }

    // (122:8) {#if backgroundSource !== false}
    function create_if_block_6$1(ctx) {
    	let div;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			if (img.src !== (img_src_value = /*backgroundSource*/ ctx[0])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*altText*/ ctx[3]);
    			set_style(img, "--height", /*maxHeight*/ ctx[5]);
    			attr_dev(img, "class", "svelte-1ewyar1");
    			add_location(img, file$8, 123, 16, 3131);
    			attr_dev(div, "class", "hover svelte-1ewyar1");
    			add_location(div, file$8, 122, 12, 3094);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*backgroundSource*/ 1 && img.src !== (img_src_value = /*backgroundSource*/ ctx[0])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*altText*/ 8) {
    				attr_dev(img, "alt", /*altText*/ ctx[3]);
    			}

    			if (dirty & /*maxHeight*/ 32) {
    				set_style(img, "--height", /*maxHeight*/ ctx[5]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6$1.name,
    		type: "if",
    		source: "(122:8) {#if backgroundSource !== false}",
    		ctx
    	});

    	return block;
    }

    // (128:12) {#if primaryText}
    function create_if_block_5$1(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*primaryText*/ ctx[1]);
    			attr_dev(div, "class", "primary-text svelte-1ewyar1");
    			attr_dev(div, "title", /*primaryText*/ ctx[1]);
    			add_location(div, file$8, 128, 16, 3316);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*primaryText*/ 2) set_data_dev(t, /*primaryText*/ ctx[1]);

    			if (dirty & /*primaryText*/ 2) {
    				attr_dev(div, "title", /*primaryText*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5$1.name,
    		type: "if",
    		source: "(128:12) {#if primaryText}",
    		ctx
    	});

    	return block;
    }

    // (131:12) {#if subText}
    function create_if_block_4$1(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*subText*/ ctx[2]);
    			attr_dev(div, "class", "sub-text svelte-1ewyar1");
    			attr_dev(div, "title", /*subText*/ ctx[2]);
    			add_location(div, file$8, 131, 16, 3445);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*subText*/ 4) set_data_dev(t, /*subText*/ ctx[2]);

    			if (dirty & /*subText*/ 4) {
    				attr_dev(div, "title", /*subText*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(131:12) {#if subText}",
    		ctx
    	});

    	return block;
    }

    // (106:8) {#if backgroundSource !== false}
    function create_if_block_3$1(ctx) {
    	let div;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			if (img.src !== (img_src_value = /*backgroundSource*/ ctx[0])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*altText*/ ctx[3]);
    			set_style(img, "--height", /*maxHeight*/ ctx[5]);
    			attr_dev(img, "class", "svelte-1ewyar1");
    			add_location(img, file$8, 107, 16, 2613);
    			attr_dev(div, "class", "hover svelte-1ewyar1");
    			add_location(div, file$8, 106, 12, 2576);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*backgroundSource*/ 1 && img.src !== (img_src_value = /*backgroundSource*/ ctx[0])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*altText*/ 8) {
    				attr_dev(img, "alt", /*altText*/ ctx[3]);
    			}

    			if (dirty & /*maxHeight*/ 32) {
    				set_style(img, "--height", /*maxHeight*/ ctx[5]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(106:8) {#if backgroundSource !== false}",
    		ctx
    	});

    	return block;
    }

    // (112:12) {#if primaryText}
    function create_if_block_2$1(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*primaryText*/ ctx[1]);
    			attr_dev(div, "class", "primary-text svelte-1ewyar1");
    			add_location(div, file$8, 112, 16, 2798);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*primaryText*/ 2) set_data_dev(t, /*primaryText*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(112:12) {#if primaryText}",
    		ctx
    	});

    	return block;
    }

    // (115:12) {#if subText}
    function create_if_block_1$2(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*subText*/ ctx[2]);
    			attr_dev(div, "class", "sub-text svelte-1ewyar1");
    			add_location(div, file$8, 115, 16, 2908);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*subText*/ 4) set_data_dev(t, /*subText*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(115:12) {#if subText}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*disabled*/ ctx[4]) return create_if_block$2;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { backgroundSource = false } = $$props;
    	let { primaryText = false } = $$props;
    	let { subText = false } = $$props;
    	let { altText = "preview image" } = $$props;
    	let { disabled = false } = $$props;
    	let maxHeight = 180;
    	if (!primaryText) maxHeight += 20;
    	if (!subText) maxHeight += 20;
    	maxHeight = `${maxHeight}px`;
    	const writable_props = ["backgroundSource", "primaryText", "subText", "altText", "disabled"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PreviewCard> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ("backgroundSource" in $$props) $$invalidate(0, backgroundSource = $$props.backgroundSource);
    		if ("primaryText" in $$props) $$invalidate(1, primaryText = $$props.primaryText);
    		if ("subText" in $$props) $$invalidate(2, subText = $$props.subText);
    		if ("altText" in $$props) $$invalidate(3, altText = $$props.altText);
    		if ("disabled" in $$props) $$invalidate(4, disabled = $$props.disabled);
    	};

    	$$self.$capture_state = () => {
    		return {
    			backgroundSource,
    			primaryText,
    			subText,
    			altText,
    			disabled,
    			maxHeight
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("backgroundSource" in $$props) $$invalidate(0, backgroundSource = $$props.backgroundSource);
    		if ("primaryText" in $$props) $$invalidate(1, primaryText = $$props.primaryText);
    		if ("subText" in $$props) $$invalidate(2, subText = $$props.subText);
    		if ("altText" in $$props) $$invalidate(3, altText = $$props.altText);
    		if ("disabled" in $$props) $$invalidate(4, disabled = $$props.disabled);
    		if ("maxHeight" in $$props) $$invalidate(5, maxHeight = $$props.maxHeight);
    	};

    	return [
    		backgroundSource,
    		primaryText,
    		subText,
    		altText,
    		disabled,
    		maxHeight,
    		click_handler
    	];
    }

    class PreviewCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
    			backgroundSource: 0,
    			primaryText: 1,
    			subText: 2,
    			altText: 3,
    			disabled: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PreviewCard",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get backgroundSource() {
    		throw new Error("<PreviewCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set backgroundSource(value) {
    		throw new Error("<PreviewCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get primaryText() {
    		throw new Error("<PreviewCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set primaryText(value) {
    		throw new Error("<PreviewCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get subText() {
    		throw new Error("<PreviewCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set subText(value) {
    		throw new Error("<PreviewCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get altText() {
    		throw new Error("<PreviewCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set altText(value) {
    		throw new Error("<PreviewCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<PreviewCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<PreviewCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\AudioDemo.svelte generated by Svelte v3.18.2 */
    const file$9 = "src\\AudioDemo.svelte";

    function create_fragment$9(ctx) {
    	let h2;
    	let t1;
    	let div;
    	let article0;
    	let h30;
    	let t3;
    	let p0;
    	let b0;
    	let t5;
    	let t6;
    	let t7;
    	let article1;
    	let h31;
    	let t9;
    	let p1;
    	let b1;
    	let t11;
    	let t12;
    	let t13;
    	let article2;
    	let h32;
    	let t15;
    	let p2;
    	let b2;
    	let t17;
    	let t18;
    	let t19;
    	let article3;
    	let h33;
    	let t21;
    	let p3;
    	let b3;
    	let t23;
    	let t24;
    	let t25;
    	let article4;
    	let h34;
    	let t27;
    	let p4;
    	let b4;
    	let t29;
    	let t30;
    	let current;

    	const audiocontrols0 = new AudioControls({
    			props: {
    				src: "https://sveltejs.github.io/assets/music/strauss.mp3",
    				display: true
    			},
    			$$inline: true
    		});

    	const audiocontrols1 = new AudioControls({
    			props: {
    				src: "https://sveltejs.github.io/assets/music/holst.mp3",
    				display: true,
    				barPrimaryColor: "#3c8bff",
    				inlineTooltip: true
    			},
    			$$inline: true
    		});

    	const audiocontrols2 = new AudioControls({
    			props: {
    				src: "https://sveltejs.github.io/assets/music/satie.mp3",
    				display: true,
    				barPrimaryColor: "gold",
    				iconColor: "#d56ed5",
    				backgroundColor: "#f0f0f050"
    			},
    			$$inline: true
    		});

    	const audiocontrols3 = new AudioControls({
    			props: {
    				src: "https://sveltejs.github.io/assets/music/beethoven.mp3",
    				display: true,
    				barPrimaryColor: "lightpink",
    				disableTooltip: true
    			},
    			$$inline: true
    		});

    	const audiocontrols4 = new AudioControls({
    			props: {
    				src: "https://sveltejs.github.io/assets/music/mozart.mp3",
    				display: true,
    				barPrimaryColor: "lightgreen",
    				barSecondaryColor: "pink",
    				textColor: "orange"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Svelte Audio Controls";
    			t1 = space();
    			div = element("div");
    			article0 = element("article");
    			h30 = element("h3");
    			h30.textContent = "The Blue Danube Waltz (Default config)";
    			t3 = space();
    			p0 = element("p");
    			b0 = element("b");
    			b0.textContent = "Johann Strauss";
    			t5 = text(" / performed by European Archive");
    			t6 = space();
    			create_component(audiocontrols0.$$.fragment);
    			t7 = space();
    			article1 = element("article");
    			h31 = element("h3");
    			h31.textContent = "Mars, the Bringer of War (Inline tooltip)";
    			t9 = space();
    			p1 = element("p");
    			b1 = element("b");
    			b1.textContent = "Gustav Holst";
    			t11 = text(" / performed by USAF Heritage of America Band");
    			t12 = space();
    			create_component(audiocontrols1.$$.fragment);
    			t13 = space();
    			article2 = element("article");
    			h32 = element("h3");
    			h32.textContent = "Gymnopédie no. 1 (Semi-transparent Tooltip)";
    			t15 = space();
    			p2 = element("p");
    			b2 = element("b");
    			b2.textContent = "Erik Satie";
    			t17 = text(" / performed by Prodigal Procrastinator");
    			t18 = space();
    			create_component(audiocontrols2.$$.fragment);
    			t19 = space();
    			article3 = element("article");
    			h33 = element("h3");
    			h33.textContent = "Symphony no. 5 in Cm, Op. 67 - I. Allegro con brio (No Tooltip)";
    			t21 = space();
    			p3 = element("p");
    			b3 = element("b");
    			b3.textContent = "Ludwig van Beethoven";
    			t23 = text(" / performed by European Archive");
    			t24 = space();
    			create_component(audiocontrols3.$$.fragment);
    			t25 = space();
    			article4 = element("article");
    			h34 = element("h3");
    			h34.textContent = "Requiem in D minor, K. 626 - III. Sequence - Lacrymosa (Controls with coloring)";
    			t27 = space();
    			p4 = element("p");
    			b4 = element("b");
    			b4.textContent = "Wolfgang Amadeus Mozart";
    			t29 = text(" / performed by Markus Staab");
    			t30 = space();
    			create_component(audiocontrols4.$$.fragment);
    			add_location(h2, file$9, 16, 0, 242);
    			add_location(h30, file$9, 20, 3, 390);
    			add_location(b0, file$9, 21, 6, 445);
    			add_location(p0, file$9, 21, 3, 442);
    			attr_dev(article0, "class", "svelte-ywc3ky");
    			add_location(article0, file$9, 18, 2, 308);
    			add_location(h31, file$9, 29, 3, 679);
    			add_location(b1, file$9, 30, 6, 737);
    			add_location(p1, file$9, 30, 3, 734);
    			set_style(article1, "--primary-color", "#3c8bff");
    			attr_dev(article1, "class", "svelte-ywc3ky");
    			add_location(article1, file$9, 28, 2, 631);
    			add_location(h32, file$9, 41, 3, 1163);
    			add_location(b2, file$9, 42, 6, 1223);
    			add_location(p2, file$9, 42, 3, 1220);
    			set_style(article2, "--primary-color", "gold");
    			set_style(article2, "--text-color", "#d56ed5");
    			set_style(article2, "--background-color", "#f0f0f050");
    			attr_dev(article2, "class", "svelte-ywc3ky");
    			add_location(article2, file$9, 40, 2, 1065);
    			add_location(h33, file$9, 54, 3, 1640);
    			add_location(b3, file$9, 55, 6, 1720);
    			add_location(p3, file$9, 55, 3, 1717);
    			set_style(article3, "--primary-color", "lightpink");
    			set_style(article3, "--secondary-text-color", "lightblue");
    			attr_dev(article3, "class", "svelte-ywc3ky");
    			add_location(article3, file$9, 53, 2, 1555);
    			add_location(h34, file$9, 66, 3, 2160);
    			add_location(b4, file$9, 67, 6, 2256);
    			add_location(p4, file$9, 67, 3, 2253);
    			set_style(article4, "--primary-color", "lightgreen");
    			set_style(article4, "--secondary-color", "pink");
    			set_style(article4, "--text-color", "orange");
    			attr_dev(article4, "class", "svelte-ywc3ky");
    			add_location(article4, file$9, 65, 2, 2062);
    			attr_dev(div, "class", "audio-container svelte-ywc3ky");
    			add_location(div, file$9, 17, 1, 275);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, article0);
    			append_dev(article0, h30);
    			append_dev(article0, t3);
    			append_dev(article0, p0);
    			append_dev(p0, b0);
    			append_dev(p0, t5);
    			append_dev(article0, t6);
    			mount_component(audiocontrols0, article0, null);
    			append_dev(div, t7);
    			append_dev(div, article1);
    			append_dev(article1, h31);
    			append_dev(article1, t9);
    			append_dev(article1, p1);
    			append_dev(p1, b1);
    			append_dev(p1, t11);
    			append_dev(article1, t12);
    			mount_component(audiocontrols1, article1, null);
    			append_dev(div, t13);
    			append_dev(div, article2);
    			append_dev(article2, h32);
    			append_dev(article2, t15);
    			append_dev(article2, p2);
    			append_dev(p2, b2);
    			append_dev(p2, t17);
    			append_dev(article2, t18);
    			mount_component(audiocontrols2, article2, null);
    			append_dev(div, t19);
    			append_dev(div, article3);
    			append_dev(article3, h33);
    			append_dev(article3, t21);
    			append_dev(article3, p3);
    			append_dev(p3, b3);
    			append_dev(p3, t23);
    			append_dev(article3, t24);
    			mount_component(audiocontrols3, article3, null);
    			append_dev(div, t25);
    			append_dev(div, article4);
    			append_dev(article4, h34);
    			append_dev(article4, t27);
    			append_dev(article4, p4);
    			append_dev(p4, b4);
    			append_dev(p4, t29);
    			append_dev(article4, t30);
    			mount_component(audiocontrols4, article4, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(audiocontrols0.$$.fragment, local);
    			transition_in(audiocontrols1.$$.fragment, local);
    			transition_in(audiocontrols2.$$.fragment, local);
    			transition_in(audiocontrols3.$$.fragment, local);
    			transition_in(audiocontrols4.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(audiocontrols0.$$.fragment, local);
    			transition_out(audiocontrols1.$$.fragment, local);
    			transition_out(audiocontrols2.$$.fragment, local);
    			transition_out(audiocontrols3.$$.fragment, local);
    			transition_out(audiocontrols4.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    			destroy_component(audiocontrols0);
    			destroy_component(audiocontrols1);
    			destroy_component(audiocontrols2);
    			destroy_component(audiocontrols3);
    			destroy_component(audiocontrols4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class AudioDemo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AudioDemo",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src\PreviewCardDemo.svelte generated by Svelte v3.18.2 */
    const file$a = "src\\PreviewCardDemo.svelte";

    function create_fragment$a(ctx) {
    	let h2;
    	let t1;
    	let div3;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let div0;
    	let t6;
    	let t7;
    	let div1;
    	let t8;
    	let div2;
    	let t9;
    	let t10;
    	let current;

    	const previewcard0 = new PreviewCard({
    			props: {
    				backgroundSource: "https://images.unsplash.com/photo-1524639099061-f8beec2b7538",
    				primaryText: "Default",
    				subText: "Config"
    			},
    			$$inline: true
    		});

    	const previewcard1 = new PreviewCard({
    			props: {
    				backgroundSource: "https://images.unsplash.com/photo-1578508678408-f4292c7636d5",
    				primaryText: "Primary Only"
    			},
    			$$inline: true
    		});

    	const previewcard2 = new PreviewCard({
    			props: {
    				backgroundSource: "https://images.unsplash.com/photo-1567365167067-5da250d258a5",
    				subText: "Sub Only"
    			},
    			$$inline: true
    		});

    	const previewcard3 = new PreviewCard({
    			props: {
    				backgroundSource: "https://images.unsplash.com/photo-1579489225078-27977a77bf72"
    			},
    			$$inline: true
    		});

    	const previewcard4 = new PreviewCard({
    			props: {
    				backgroundSource: "https://images.unsplash.com/photo-1580193769210-b8d1c049a7d9",
    				primaryText: "Styled",
    				subText: "Colors"
    			},
    			$$inline: true
    		});

    	const previewcard5 = new PreviewCard({
    			props: {
    				backgroundSource: "https://images.unsplash.com/photo-1580193667916-75207858183b",
    				primaryText: "Disabled",
    				subText: "Clicking",
    				disabled: true
    			},
    			$$inline: true
    		});

    	const previewcard6 = new PreviewCard({
    			props: {
    				backgroundSource: "https://images.unsplash.com/photo-1574780879552-9c07b351ea86",
    				primaryText: "Focus",
    				subText: "Color"
    			},
    			$$inline: true
    		});

    	const previewcard7 = new PreviewCard({
    			props: {
    				backgroundSource: "https://images.unsplash.com/photo-1579619272436-7bf4271f0bff",
    				primaryText: "Active",
    				subText: "Color"
    			},
    			$$inline: true
    		});

    	const previewcard8 = new PreviewCard({
    			props: {
    				backgroundSource: "",
    				primaryText: "Empty Source",
    				subText: "displays alt text",
    				alt_text: "Alt text here"
    			},
    			$$inline: true
    		});

    	const previewcard9 = new PreviewCard({
    			props: {
    				primaryText: "Background disabled",
    				subText: "It's an option",
    				alt_text: "Alt text here"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Svelte Preview Card";
    			t1 = space();
    			div3 = element("div");
    			create_component(previewcard0.$$.fragment);
    			t2 = space();
    			create_component(previewcard1.$$.fragment);
    			t3 = space();
    			create_component(previewcard2.$$.fragment);
    			t4 = space();
    			create_component(previewcard3.$$.fragment);
    			t5 = space();
    			div0 = element("div");
    			create_component(previewcard4.$$.fragment);
    			t6 = space();
    			create_component(previewcard5.$$.fragment);
    			t7 = space();
    			div1 = element("div");
    			create_component(previewcard6.$$.fragment);
    			t8 = space();
    			div2 = element("div");
    			create_component(previewcard7.$$.fragment);
    			t9 = space();
    			create_component(previewcard8.$$.fragment);
    			t10 = space();
    			create_component(previewcard9.$$.fragment);
    			add_location(h2, file$a, 15, 0, 274);
    			set_style(div0, "--background-color", "#ffd5db");
    			set_style(div0, "--primary-text-color", "white");
    			set_style(div0, "--secondary-text-color", "blue");
    			set_style(div0, "--active-color", "pink");
    			set_style(div0, "--focus-color", "pink");
    			add_location(div0, file$a, 22, 4, 920);
    			set_style(div1, "--focus-color", "#3c8bff");
    			add_location(div1, file$a, 26, 4, 1408);
    			set_style(div2, "--active-color", "#3c8bff");
    			add_location(div2, file$a, 29, 4, 1615);
    			attr_dev(div3, "class", "card-display svelte-14xv8jk");
    			add_location(div3, file$a, 16, 0, 304);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div3, anchor);
    			mount_component(previewcard0, div3, null);
    			append_dev(div3, t2);
    			mount_component(previewcard1, div3, null);
    			append_dev(div3, t3);
    			mount_component(previewcard2, div3, null);
    			append_dev(div3, t4);
    			mount_component(previewcard3, div3, null);
    			append_dev(div3, t5);
    			append_dev(div3, div0);
    			mount_component(previewcard4, div0, null);
    			append_dev(div3, t6);
    			mount_component(previewcard5, div3, null);
    			append_dev(div3, t7);
    			append_dev(div3, div1);
    			mount_component(previewcard6, div1, null);
    			append_dev(div3, t8);
    			append_dev(div3, div2);
    			mount_component(previewcard7, div2, null);
    			append_dev(div3, t9);
    			mount_component(previewcard8, div3, null);
    			append_dev(div3, t10);
    			mount_component(previewcard9, div3, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(previewcard0.$$.fragment, local);
    			transition_in(previewcard1.$$.fragment, local);
    			transition_in(previewcard2.$$.fragment, local);
    			transition_in(previewcard3.$$.fragment, local);
    			transition_in(previewcard4.$$.fragment, local);
    			transition_in(previewcard5.$$.fragment, local);
    			transition_in(previewcard6.$$.fragment, local);
    			transition_in(previewcard7.$$.fragment, local);
    			transition_in(previewcard8.$$.fragment, local);
    			transition_in(previewcard9.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(previewcard0.$$.fragment, local);
    			transition_out(previewcard1.$$.fragment, local);
    			transition_out(previewcard2.$$.fragment, local);
    			transition_out(previewcard3.$$.fragment, local);
    			transition_out(previewcard4.$$.fragment, local);
    			transition_out(previewcard5.$$.fragment, local);
    			transition_out(previewcard6.$$.fragment, local);
    			transition_out(previewcard7.$$.fragment, local);
    			transition_out(previewcard8.$$.fragment, local);
    			transition_out(previewcard9.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div3);
    			destroy_component(previewcard0);
    			destroy_component(previewcard1);
    			destroy_component(previewcard2);
    			destroy_component(previewcard3);
    			destroy_component(previewcard4);
    			destroy_component(previewcard5);
    			destroy_component(previewcard6);
    			destroy_component(previewcard7);
    			destroy_component(previewcard8);
    			destroy_component(previewcard9);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class PreviewCardDemo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PreviewCardDemo",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src\InputDemo.svelte generated by Svelte v3.18.2 */

    const file$b = "src\\InputDemo.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	child_ctx[8] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	child_ctx[8] = i;
    	return child_ctx;
    }

    // (96:16) {#each numbers as number, index}
    function create_each_block_1(ctx) {
    	let option;
    	let t_value = /*number*/ ctx[11] + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*index*/ ctx[8];
    			option.value = option.__value;
    			add_location(option, file$b, 96, 20, 3294);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(96:16) {#each numbers as number, index}",
    		ctx
    	});

    	return block;
    }

    // (95:12) <MaterialSelect label="pick a number" bind:value={numVal}>
    function create_default_slot_3(ctx) {
    	let each_1_anchor;
    	let each_value_1 = /*numbers*/ ctx[2];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*numbers*/ 4) {
    				each_value_1 = /*numbers*/ ctx[2];
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(95:12) <MaterialSelect label=\\\"pick a number\\\" bind:value={numVal}>",
    		ctx
    	});

    	return block;
    }

    // (103:16) {#each brands as brand, index}
    function create_each_block$2(ctx) {
    	let option;
    	let t_value = /*brand*/ ctx[9] + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*index*/ ctx[8];
    			option.value = option.__value;
    			add_location(option, file$b, 103, 20, 3538);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(103:16) {#each brands as brand, index}",
    		ctx
    	});

    	return block;
    }

    // (102:12) <MaterialSelect bind:value={bVal}>
    function create_default_slot_2(ctx) {
    	let each_1_anchor;
    	let each_value = /*brands*/ ctx[4];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*brands*/ 16) {
    				each_value = /*brands*/ ctx[4];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(102:12) <MaterialSelect bind:value={bVal}>",
    		ctx
    	});

    	return block;
    }

    // (116:16) <div slot="item" let:item let:index>
    function create_item_slot_1(ctx) {
    	let div;
    	let current;

    	const materialtablerow = new MaterialTableRow({
    			props: {
    				values: [/*index*/ ctx[8] + 1, /*item*/ ctx[7]]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(materialtablerow.$$.fragment);
    			attr_dev(div, "slot", "item");
    			add_location(div, file$b, 115, 16, 3874);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(materialtablerow, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const materialtablerow_changes = {};
    			if (dirty & /*index, item*/ 384) materialtablerow_changes.values = [/*index*/ ctx[8] + 1, /*item*/ ctx[7]];
    			materialtablerow.$set(materialtablerow_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(materialtablerow.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(materialtablerow.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(materialtablerow);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_item_slot_1.name,
    		type: "slot",
    		source: "(116:16) <div slot=\\\"item\\\" let:item let:index>",
    		ctx
    	});

    	return block;
    }

    // (115:12) <MaterialTable items={numbers} columnSizes={["10%", "90%"]}>
    function create_default_slot_1(ctx) {

    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(115:12) <MaterialTable items={numbers} columnSizes={[\\\"10%\\\", \\\"90%\\\"]}>",
    		ctx
    	});

    	return block;
    }

    // (123:16) <div slot="header">
    function create_header_slot(ctx) {
    	let div;
    	let current;

    	const materialtablerow = new MaterialTableRow({
    			props: { values: ["#", "Number"], type: "header" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(materialtablerow.$$.fragment);
    			attr_dev(div, "slot", "header");
    			add_location(div, file$b, 122, 16, 4208);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(materialtablerow, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(materialtablerow.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(materialtablerow.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(materialtablerow);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_header_slot.name,
    		type: "slot",
    		source: "(123:16) <div slot=\\\"header\\\">",
    		ctx
    	});

    	return block;
    }

    // (126:16) <div slot="item" let:item let:index>
    function create_item_slot(ctx) {
    	let div;
    	let current;

    	const materialtablerow = new MaterialTableRow({
    			props: {
    				values: [/*index*/ ctx[8] + 1, /*item*/ ctx[7]]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(materialtablerow.$$.fragment);
    			attr_dev(div, "slot", "item");
    			add_location(div, file$b, 125, 16, 4367);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(materialtablerow, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const materialtablerow_changes = {};
    			if (dirty & /*index, item*/ 384) materialtablerow_changes.values = [/*index*/ ctx[8] + 1, /*item*/ ctx[7]];
    			materialtablerow.$set(materialtablerow_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(materialtablerow.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(materialtablerow.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(materialtablerow);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_item_slot.name,
    		type: "slot",
    		source: "(126:16) <div slot=\\\"item\\\" let:item let:index>",
    		ctx
    	});

    	return block;
    }

    // (122:12) <MaterialTable items={moreNumbers} columnSizes={["10%", "90%"]} height="350px">
    function create_default_slot(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = space();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(122:12) <MaterialTable items={moreNumbers} columnSizes={[\\\"10%\\\", \\\"90%\\\"]} height=\\\"350px\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let h20;
    	let t1;
    	let div3;
    	let div0;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let div1;
    	let t6;
    	let t7;
    	let t8;
    	let t9;
    	let div2;
    	let t10;
    	let t11;
    	let t12;
    	let t13;
    	let h21;
    	let t15;
    	let div8;
    	let div7;
    	let div4;
    	let t16;
    	let div5;
    	let t17;
    	let div6;
    	let t18;
    	let h22;
    	let t20;
    	let div13;
    	let div12;
    	let div9;
    	let t21;
    	let div10;
    	let t22;
    	let div11;
    	let t23;
    	let h23;
    	let t25;
    	let div17;
    	let div16;
    	let div14;
    	let updating_value;
    	let t26;
    	let div15;
    	let updating_value_1;
    	let t27;
    	let h24;
    	let t29;
    	let div21;
    	let div20;
    	let div18;
    	let t30;
    	let div19;
    	let t31;
    	let h25;
    	let t33;
    	let div24;
    	let div23;
    	let t34;
    	let t35;
    	let div22;
    	let current;

    	const iconbutton0 = new IconButton({
    			props: { icon: "add", title: "add" },
    			$$inline: true
    		});

    	const iconbutton1 = new IconButton({
    			props: { icon: "note", title: "note" },
    			$$inline: true
    		});

    	const iconbutton2 = new IconButton({
    			props: { icon: "book", title: "book" },
    			$$inline: true
    		});

    	const iconbutton3 = new IconButton({
    			props: { icon: "eject", title: "eject" },
    			$$inline: true
    		});

    	const iconbutton4 = new IconButton({
    			props: { icon: "home", title: "home" },
    			$$inline: true
    		});

    	const iconbutton5 = new IconButton({
    			props: { icon: "info", title: "info" },
    			$$inline: true
    		});

    	const iconbutton6 = new IconButton({
    			props: { icon: "note_add", title: "note_add" },
    			$$inline: true
    		});

    	const iconbutton7 = new IconButton({
    			props: { icon: "pan_tool", title: "pan_tool" },
    			$$inline: true
    		});

    	const iconbutton8 = new IconButton({
    			props: { icon: "rowing", title: "rowing" },
    			$$inline: true
    		});

    	const iconbutton9 = new IconButton({
    			props: { icon: "store", title: "store" },
    			$$inline: true
    		});

    	const iconbutton10 = new IconButton({
    			props: { icon: "swap_vert", title: "swap_vert" },
    			$$inline: true
    		});

    	const iconbutton11 = new IconButton({
    			props: { icon: "delete", title: "delete" },
    			$$inline: true
    		});

    	const materialbutton0 = new MaterialButton({
    			props: { value: "click me" },
    			$$inline: true
    		});

    	const materialbutton1 = new MaterialButton({
    			props: { value: "click me" },
    			$$inline: true
    		});

    	const materialbutton2 = new MaterialButton({
    			props: { value: "click me" },
    			$$inline: true
    		});

    	const materialinput0 = new MaterialInput({
    			props: { label: "Try me out" },
    			$$inline: true
    		});

    	const materialinput1 = new MaterialInput({
    			props: {
    				label: "Try me out",
    				hintText: "Hints go here"
    			},
    			$$inline: true
    		});

    	const materialinput2 = new MaterialInput({
    			props: {
    				label: "Styling",
    				hintText: "This can be styled as well",
    				value: "Some Default Text"
    			},
    			$$inline: true
    		});

    	function materialselect0_value_binding(value) {
    		/*materialselect0_value_binding*/ ctx[5].call(null, value);
    	}

    	let materialselect0_props = {
    		label: "pick a number",
    		$$slots: { default: [create_default_slot_3] },
    		$$scope: { ctx }
    	};

    	if (/*numVal*/ ctx[0] !== void 0) {
    		materialselect0_props.value = /*numVal*/ ctx[0];
    	}

    	const materialselect0 = new MaterialSelect({
    			props: materialselect0_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(materialselect0, "value", materialselect0_value_binding));

    	function materialselect1_value_binding(value_1) {
    		/*materialselect1_value_binding*/ ctx[6].call(null, value_1);
    	}

    	let materialselect1_props = {
    		$$slots: { default: [create_default_slot_2] },
    		$$scope: { ctx }
    	};

    	if (/*bVal*/ ctx[1] !== void 0) {
    		materialselect1_props.value = /*bVal*/ ctx[1];
    	}

    	const materialselect1 = new MaterialSelect({
    			props: materialselect1_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(materialselect1, "value", materialselect1_value_binding));

    	const materialtable0 = new MaterialTable({
    			props: {
    				items: /*numbers*/ ctx[2],
    				columnSizes: ["10%", "90%"],
    				$$slots: {
    					default: [create_default_slot_1],
    					item: [
    						create_item_slot_1,
    						({ item, index }) => ({ 7: item, 8: index }),
    						({ item, index }) => (item ? 128 : 0) | (index ? 256 : 0)
    					]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const materialtable1 = new MaterialTable({
    			props: {
    				items: /*moreNumbers*/ ctx[3],
    				columnSizes: ["10%", "90%"],
    				height: "350px",
    				$$slots: {
    					default: [create_default_slot],
    					item: [
    						create_item_slot,
    						({ item, index }) => ({ 7: item, 8: index }),
    						({ item, index }) => (item ? 128 : 0) | (index ? 256 : 0)
    					],
    					header: [create_header_slot]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const materialtextarea0 = new MaterialTextArea({
    			props: {
    				height: "300",
    				width: "300",
    				resize: "none",
    				label: "No Resizing"
    			},
    			$$inline: true
    		});

    	const materialtextarea1 = new MaterialTextArea({
    			props: {
    				height: "300",
    				width: "300",
    				resize: "horizontal",
    				label: "Horizontal Resizing"
    			},
    			$$inline: true
    		});

    	const materialtextarea2 = new MaterialTextArea({
    			props: {
    				height: "300",
    				width: "300",
    				resize: "none",
    				hintText: "Hints as well"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			h20 = element("h2");
    			h20.textContent = "Icon Buttons";
    			t1 = space();
    			div3 = element("div");
    			div0 = element("div");
    			create_component(iconbutton0.$$.fragment);
    			t2 = space();
    			create_component(iconbutton1.$$.fragment);
    			t3 = space();
    			create_component(iconbutton2.$$.fragment);
    			t4 = space();
    			create_component(iconbutton3.$$.fragment);
    			t5 = space();
    			div1 = element("div");
    			create_component(iconbutton4.$$.fragment);
    			t6 = space();
    			create_component(iconbutton5.$$.fragment);
    			t7 = space();
    			create_component(iconbutton6.$$.fragment);
    			t8 = space();
    			create_component(iconbutton7.$$.fragment);
    			t9 = space();
    			div2 = element("div");
    			create_component(iconbutton8.$$.fragment);
    			t10 = space();
    			create_component(iconbutton9.$$.fragment);
    			t11 = space();
    			create_component(iconbutton10.$$.fragment);
    			t12 = space();
    			create_component(iconbutton11.$$.fragment);
    			t13 = space();
    			h21 = element("h2");
    			h21.textContent = "Material Buttons";
    			t15 = space();
    			div8 = element("div");
    			div7 = element("div");
    			div4 = element("div");
    			create_component(materialbutton0.$$.fragment);
    			t16 = space();
    			div5 = element("div");
    			create_component(materialbutton1.$$.fragment);
    			t17 = space();
    			div6 = element("div");
    			create_component(materialbutton2.$$.fragment);
    			t18 = space();
    			h22 = element("h2");
    			h22.textContent = "Material Input";
    			t20 = space();
    			div13 = element("div");
    			div12 = element("div");
    			div9 = element("div");
    			create_component(materialinput0.$$.fragment);
    			t21 = space();
    			div10 = element("div");
    			create_component(materialinput1.$$.fragment);
    			t22 = space();
    			div11 = element("div");
    			create_component(materialinput2.$$.fragment);
    			t23 = space();
    			h23 = element("h2");
    			h23.textContent = "Material Select";
    			t25 = space();
    			div17 = element("div");
    			div16 = element("div");
    			div14 = element("div");
    			create_component(materialselect0.$$.fragment);
    			t26 = space();
    			div15 = element("div");
    			create_component(materialselect1.$$.fragment);
    			t27 = space();
    			h24 = element("h2");
    			h24.textContent = "Material Table";
    			t29 = space();
    			div21 = element("div");
    			div20 = element("div");
    			div18 = element("div");
    			create_component(materialtable0.$$.fragment);
    			t30 = space();
    			div19 = element("div");
    			create_component(materialtable1.$$.fragment);
    			t31 = space();
    			h25 = element("h2");
    			h25.textContent = "Material Text Area";
    			t33 = space();
    			div24 = element("div");
    			div23 = element("div");
    			create_component(materialtextarea0.$$.fragment);
    			t34 = space();
    			create_component(materialtextarea1.$$.fragment);
    			t35 = space();
    			div22 = element("div");
    			create_component(materialtextarea2.$$.fragment);
    			add_location(h20, file$b, 38, 0, 869);
    			attr_dev(div0, "class", "display-row svelte-qrdkk6");
    			add_location(div0, file$b, 40, 4, 921);
    			attr_dev(div1, "class", "display-row svelte-qrdkk6");
    			set_style(div1, "--secondary-text-color", "green");
    			add_location(div1, file$b, 46, 4, 1204);
    			attr_dev(div2, "class", "display-row svelte-qrdkk6");
    			set_style(div2, "--secondary-text-color", "red");
    			add_location(div2, file$b, 52, 4, 1541);
    			attr_dev(div3, "class", "container svelte-qrdkk6");
    			add_location(div3, file$b, 39, 0, 892);
    			add_location(h21, file$b, 60, 0, 1886);
    			attr_dev(div4, "class", "padding svelte-qrdkk6");
    			set_style(div4, "--secondary-text-color", "black");
    			add_location(div4, file$b, 63, 8, 1986);
    			attr_dev(div5, "class", "padding svelte-qrdkk6");
    			set_style(div5, "--secondary-text-color", "blue");
    			set_style(div5, "--secondary-color", "lightblue");
    			add_location(div5, file$b, 66, 8, 2119);
    			attr_dev(div6, "class", "padding svelte-qrdkk6");
    			set_style(div6, "--secondary-text-color", "red");
    			set_style(div6, "--secondary-color", "rgb(253, 229, 232)");
    			add_location(div6, file$b, 69, 8, 2278);
    			attr_dev(div7, "class", "display-row padding svelte-qrdkk6");
    			add_location(div7, file$b, 62, 4, 1942);
    			attr_dev(div8, "class", "container svelte-qrdkk6");
    			add_location(div8, file$b, 61, 0, 1913);
    			add_location(h22, file$b, 75, 0, 2463);
    			attr_dev(div9, "class", "padding svelte-qrdkk6");
    			add_location(div9, file$b, 78, 8, 2552);
    			attr_dev(div10, "class", "padding svelte-qrdkk6");
    			add_location(div10, file$b, 81, 8, 2648);
    			attr_dev(div11, "class", "padding svelte-qrdkk6");
    			set_style(div11, "--primary-color", "lightblue");
    			set_style(div11, "--secondary-color", "blue");
    			set_style(div11, "--highlight-color", "red");
    			set_style(div11, "--secondary-text-color", "pink");
    			add_location(div11, file$b, 84, 8, 2769);
    			attr_dev(div12, "class", "display-row svelte-qrdkk6");
    			add_location(div12, file$b, 77, 4, 2517);
    			attr_dev(div13, "class", "container svelte-qrdkk6");
    			add_location(div13, file$b, 76, 0, 2488);
    			add_location(h23, file$b, 90, 0, 3055);
    			add_location(div14, file$b, 93, 8, 3145);
    			add_location(div15, file$b, 100, 8, 3415);
    			attr_dev(div16, "class", "display-row svelte-qrdkk6");
    			add_location(div16, file$b, 92, 4, 3110);
    			attr_dev(div17, "class", "container svelte-qrdkk6");
    			add_location(div17, file$b, 91, 0, 3081);
    			add_location(h24, file$b, 110, 0, 3672);
    			attr_dev(div18, "class", "smaller svelte-qrdkk6");
    			add_location(div18, file$b, 113, 8, 3761);
    			attr_dev(div19, "class", "smaller svelte-qrdkk6");
    			add_location(div19, file$b, 120, 8, 4076);
    			attr_dev(div20, "class", "display-row svelte-qrdkk6");
    			add_location(div20, file$b, 112, 4, 3726);
    			attr_dev(div21, "class", "container svelte-qrdkk6");
    			add_location(div21, file$b, 111, 0, 3697);
    			add_location(h25, file$b, 133, 0, 4583);
    			set_style(div22, "--primary-color", "lightblue");
    			set_style(div22, "--secondary-color", "blue");
    			set_style(div22, "--highlight-color", "pink");
    			add_location(div22, file$b, 138, 8, 4873);
    			attr_dev(div23, "class", "display-row svelte-qrdkk6");
    			add_location(div23, file$b, 135, 4, 4656);
    			attr_dev(div24, "class", "container bottom-padding svelte-qrdkk6");
    			add_location(div24, file$b, 134, 0, 4612);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h20, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			mount_component(iconbutton0, div0, null);
    			append_dev(div0, t2);
    			mount_component(iconbutton1, div0, null);
    			append_dev(div0, t3);
    			mount_component(iconbutton2, div0, null);
    			append_dev(div0, t4);
    			mount_component(iconbutton3, div0, null);
    			append_dev(div3, t5);
    			append_dev(div3, div1);
    			mount_component(iconbutton4, div1, null);
    			append_dev(div1, t6);
    			mount_component(iconbutton5, div1, null);
    			append_dev(div1, t7);
    			mount_component(iconbutton6, div1, null);
    			append_dev(div1, t8);
    			mount_component(iconbutton7, div1, null);
    			append_dev(div3, t9);
    			append_dev(div3, div2);
    			mount_component(iconbutton8, div2, null);
    			append_dev(div2, t10);
    			mount_component(iconbutton9, div2, null);
    			append_dev(div2, t11);
    			mount_component(iconbutton10, div2, null);
    			append_dev(div2, t12);
    			mount_component(iconbutton11, div2, null);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, h21, anchor);
    			insert_dev(target, t15, anchor);
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div7);
    			append_dev(div7, div4);
    			mount_component(materialbutton0, div4, null);
    			append_dev(div7, t16);
    			append_dev(div7, div5);
    			mount_component(materialbutton1, div5, null);
    			append_dev(div7, t17);
    			append_dev(div7, div6);
    			mount_component(materialbutton2, div6, null);
    			insert_dev(target, t18, anchor);
    			insert_dev(target, h22, anchor);
    			insert_dev(target, t20, anchor);
    			insert_dev(target, div13, anchor);
    			append_dev(div13, div12);
    			append_dev(div12, div9);
    			mount_component(materialinput0, div9, null);
    			append_dev(div12, t21);
    			append_dev(div12, div10);
    			mount_component(materialinput1, div10, null);
    			append_dev(div12, t22);
    			append_dev(div12, div11);
    			mount_component(materialinput2, div11, null);
    			insert_dev(target, t23, anchor);
    			insert_dev(target, h23, anchor);
    			insert_dev(target, t25, anchor);
    			insert_dev(target, div17, anchor);
    			append_dev(div17, div16);
    			append_dev(div16, div14);
    			mount_component(materialselect0, div14, null);
    			append_dev(div16, t26);
    			append_dev(div16, div15);
    			mount_component(materialselect1, div15, null);
    			insert_dev(target, t27, anchor);
    			insert_dev(target, h24, anchor);
    			insert_dev(target, t29, anchor);
    			insert_dev(target, div21, anchor);
    			append_dev(div21, div20);
    			append_dev(div20, div18);
    			mount_component(materialtable0, div18, null);
    			append_dev(div20, t30);
    			append_dev(div20, div19);
    			mount_component(materialtable1, div19, null);
    			insert_dev(target, t31, anchor);
    			insert_dev(target, h25, anchor);
    			insert_dev(target, t33, anchor);
    			insert_dev(target, div24, anchor);
    			append_dev(div24, div23);
    			mount_component(materialtextarea0, div23, null);
    			append_dev(div23, t34);
    			mount_component(materialtextarea1, div23, null);
    			append_dev(div23, t35);
    			append_dev(div23, div22);
    			mount_component(materialtextarea2, div22, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const materialselect0_changes = {};

    			if (dirty & /*$$scope*/ 8192) {
    				materialselect0_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_value && dirty & /*numVal*/ 1) {
    				updating_value = true;
    				materialselect0_changes.value = /*numVal*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			materialselect0.$set(materialselect0_changes);
    			const materialselect1_changes = {};

    			if (dirty & /*$$scope*/ 8192) {
    				materialselect1_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_value_1 && dirty & /*bVal*/ 2) {
    				updating_value_1 = true;
    				materialselect1_changes.value = /*bVal*/ ctx[1];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			materialselect1.$set(materialselect1_changes);
    			const materialtable0_changes = {};

    			if (dirty & /*$$scope, index, item*/ 8576) {
    				materialtable0_changes.$$scope = { dirty, ctx };
    			}

    			materialtable0.$set(materialtable0_changes);
    			const materialtable1_changes = {};

    			if (dirty & /*$$scope, index, item*/ 8576) {
    				materialtable1_changes.$$scope = { dirty, ctx };
    			}

    			materialtable1.$set(materialtable1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(iconbutton0.$$.fragment, local);
    			transition_in(iconbutton1.$$.fragment, local);
    			transition_in(iconbutton2.$$.fragment, local);
    			transition_in(iconbutton3.$$.fragment, local);
    			transition_in(iconbutton4.$$.fragment, local);
    			transition_in(iconbutton5.$$.fragment, local);
    			transition_in(iconbutton6.$$.fragment, local);
    			transition_in(iconbutton7.$$.fragment, local);
    			transition_in(iconbutton8.$$.fragment, local);
    			transition_in(iconbutton9.$$.fragment, local);
    			transition_in(iconbutton10.$$.fragment, local);
    			transition_in(iconbutton11.$$.fragment, local);
    			transition_in(materialbutton0.$$.fragment, local);
    			transition_in(materialbutton1.$$.fragment, local);
    			transition_in(materialbutton2.$$.fragment, local);
    			transition_in(materialinput0.$$.fragment, local);
    			transition_in(materialinput1.$$.fragment, local);
    			transition_in(materialinput2.$$.fragment, local);
    			transition_in(materialselect0.$$.fragment, local);
    			transition_in(materialselect1.$$.fragment, local);
    			transition_in(materialtable0.$$.fragment, local);
    			transition_in(materialtable1.$$.fragment, local);
    			transition_in(materialtextarea0.$$.fragment, local);
    			transition_in(materialtextarea1.$$.fragment, local);
    			transition_in(materialtextarea2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(iconbutton0.$$.fragment, local);
    			transition_out(iconbutton1.$$.fragment, local);
    			transition_out(iconbutton2.$$.fragment, local);
    			transition_out(iconbutton3.$$.fragment, local);
    			transition_out(iconbutton4.$$.fragment, local);
    			transition_out(iconbutton5.$$.fragment, local);
    			transition_out(iconbutton6.$$.fragment, local);
    			transition_out(iconbutton7.$$.fragment, local);
    			transition_out(iconbutton8.$$.fragment, local);
    			transition_out(iconbutton9.$$.fragment, local);
    			transition_out(iconbutton10.$$.fragment, local);
    			transition_out(iconbutton11.$$.fragment, local);
    			transition_out(materialbutton0.$$.fragment, local);
    			transition_out(materialbutton1.$$.fragment, local);
    			transition_out(materialbutton2.$$.fragment, local);
    			transition_out(materialinput0.$$.fragment, local);
    			transition_out(materialinput1.$$.fragment, local);
    			transition_out(materialinput2.$$.fragment, local);
    			transition_out(materialselect0.$$.fragment, local);
    			transition_out(materialselect1.$$.fragment, local);
    			transition_out(materialtable0.$$.fragment, local);
    			transition_out(materialtable1.$$.fragment, local);
    			transition_out(materialtextarea0.$$.fragment, local);
    			transition_out(materialtextarea1.$$.fragment, local);
    			transition_out(materialtextarea2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h20);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div3);
    			destroy_component(iconbutton0);
    			destroy_component(iconbutton1);
    			destroy_component(iconbutton2);
    			destroy_component(iconbutton3);
    			destroy_component(iconbutton4);
    			destroy_component(iconbutton5);
    			destroy_component(iconbutton6);
    			destroy_component(iconbutton7);
    			destroy_component(iconbutton8);
    			destroy_component(iconbutton9);
    			destroy_component(iconbutton10);
    			destroy_component(iconbutton11);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(h21);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(div8);
    			destroy_component(materialbutton0);
    			destroy_component(materialbutton1);
    			destroy_component(materialbutton2);
    			if (detaching) detach_dev(t18);
    			if (detaching) detach_dev(h22);
    			if (detaching) detach_dev(t20);
    			if (detaching) detach_dev(div13);
    			destroy_component(materialinput0);
    			destroy_component(materialinput1);
    			destroy_component(materialinput2);
    			if (detaching) detach_dev(t23);
    			if (detaching) detach_dev(h23);
    			if (detaching) detach_dev(t25);
    			if (detaching) detach_dev(div17);
    			destroy_component(materialselect0);
    			destroy_component(materialselect1);
    			if (detaching) detach_dev(t27);
    			if (detaching) detach_dev(h24);
    			if (detaching) detach_dev(t29);
    			if (detaching) detach_dev(div21);
    			destroy_component(materialtable0);
    			destroy_component(materialtable1);
    			if (detaching) detach_dev(t31);
    			if (detaching) detach_dev(h25);
    			if (detaching) detach_dev(t33);
    			if (detaching) detach_dev(div24);
    			destroy_component(materialtextarea0);
    			destroy_component(materialtextarea1);
    			destroy_component(materialtextarea2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	const numbers = ["One", "Two", "Three", "Four", "Five", "Six", "Seven"];

    	const moreNumbers = [
    		"One",
    		"Two",
    		"Three",
    		"Four",
    		"Five",
    		"Six",
    		"Seven",
    		"Eight",
    		"Nine",
    		"Ten",
    		"Eleven"
    	];

    	const brands = ["Sennheiser", "Audeze", "Beyerdynamic", "HifiMan", "STAX"];
    	let numVal = 0;
    	let bVal = 0;

    	function materialselect0_value_binding(value) {
    		numVal = value;
    		$$invalidate(0, numVal);
    	}

    	function materialselect1_value_binding(value_1) {
    		bVal = value_1;
    		$$invalidate(1, bVal);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("numVal" in $$props) $$invalidate(0, numVal = $$props.numVal);
    		if ("bVal" in $$props) $$invalidate(1, bVal = $$props.bVal);
    	};

    	return [
    		numVal,
    		bVal,
    		numbers,
    		moreNumbers,
    		brands,
    		materialselect0_value_binding,
    		materialselect1_value_binding
    	];
    }

    class InputDemo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "InputDemo",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.18.2 */
    const file$c = "src\\App.svelte";

    function create_fragment$c(ctx) {
    	let link;
    	let t0;
    	let main;
    	let h1;
    	let t2;
    	let t3;
    	let t4;
    	let current;
    	const audiodemo = new AudioDemo({ $$inline: true });
    	const previewcarddemo = new PreviewCardDemo({ $$inline: true });
    	const inputdemo = new InputDemo({ $$inline: true });

    	const block = {
    		c: function create() {
    			link = element("link");
    			t0 = space();
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Linkcube's Svelte Components Demo";
    			t2 = space();
    			create_component(audiodemo.$$.fragment);
    			t3 = space();
    			create_component(previewcarddemo.$$.fragment);
    			t4 = space();
    			create_component(inputdemo.$$.fragment);
    			attr_dev(link, "href", "https://fonts.googleapis.com/icon?family=Material+Icons");
    			attr_dev(link, "rel", "stylesheet");
    			add_location(link, file$c, 6, 0, 167);
    			attr_dev(h1, "class", "svelte-htonpv");
    			add_location(h1, file$c, 9, 1, 263);
    			attr_dev(main, "class", "svelte-htonpv");
    			add_location(main, file$c, 8, 0, 255);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, link, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t2);
    			mount_component(audiodemo, main, null);
    			append_dev(main, t3);
    			mount_component(previewcarddemo, main, null);
    			append_dev(main, t4);
    			mount_component(inputdemo, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(audiodemo.$$.fragment, local);
    			transition_in(previewcarddemo.$$.fragment, local);
    			transition_in(inputdemo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(audiodemo.$$.fragment, local);
    			transition_out(previewcarddemo.$$.fragment, local);
    			transition_out(inputdemo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(link);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(audiodemo);
    			destroy_component(previewcarddemo);
    			destroy_component(inputdemo);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
