
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
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
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
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

    /* node_modules\svelte-audio-controls\src\Component.svelte generated by Svelte v3.18.2 */

    const { isNaN: isNaN_1 } = globals;
    const file = "node_modules\\svelte-audio-controls\\src\\Component.svelte";

    // (168:0) {#if display}
    function create_if_block(ctx) {
    	let div1;
    	let button0;
    	let t0;
    	let progress0;
    	let progress0_value_value;
    	let t1;
    	let div0;
    	let t2_value = formatSeconds(/*currentTime*/ ctx[13]) + "";
    	let t2;
    	let t3;
    	let t4_value = formatSeconds(/*duration*/ ctx[2]) + "";
    	let t4;
    	let t5;
    	let button1;
    	let t6;
    	let progress1;
    	let t7;
    	let if_block2_anchor;
    	let current;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*paused*/ ctx[1]) return create_if_block_5;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*muted*/ ctx[3]) return create_if_block_2;
    		if (/*volume*/ ctx[4] < 0.01) return create_if_block_3;
    		if (/*volume*/ ctx[4] < 0.5) return create_if_block_4;
    		return create_else_block;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);
    	let if_block2 = /*showTooltip*/ ctx[17] && create_if_block_1(ctx);

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
    			if_block2_anchor = empty();
    			attr_dev(button0, "class", "material-icons svelte-samnqd");
    			set_style(button0, "--icon-color", /*iconColor*/ ctx[8]);
    			add_location(button0, file, 169, 8, 4526);
    			progress0.value = progress0_value_value = /*currentTime*/ ctx[13] ? /*currentTime*/ ctx[13] : 0;
    			attr_dev(progress0, "max", /*duration*/ ctx[2]);
    			set_style(progress0, "--primary-color", /*barPrimaryColor*/ ctx[10]);
    			set_style(progress0, "--secondary-color", /*barSecondaryColor*/ ctx[11]);
    			attr_dev(progress0, "class", "song-progress svelte-samnqd");
    			add_location(progress0, file, 179, 8, 4836);
    			attr_dev(div0, "class", "control-times svelte-samnqd");
    			add_location(div0, file, 190, 8, 5310);
    			set_style(button1, "--icon-color", /*iconColor*/ ctx[8]);
    			attr_dev(button1, "class", "material-icons svelte-samnqd");
    			add_location(button1, file, 191, 8, 5407);
    			progress1.value = /*volume*/ ctx[4];
    			set_style(progress1, "--primary-color", /*barPrimaryColor*/ ctx[10]);
    			set_style(progress1, "--secondary-color", /*barSecondaryColor*/ ctx[11]);
    			attr_dev(progress1, "class", "volume-progress svelte-samnqd");
    			add_location(progress1, file, 204, 8, 5809);
    			attr_dev(div1, "class", "controls svelte-samnqd");
    			set_style(div1, "--color", /*textColor*/ ctx[9]);
    			set_style(div1, "--background-color", /*backgroundColor*/ ctx[12]);
    			add_location(div1, file, 168, 4, 4428);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, button0);
    			if_block0.m(button0, null);
    			append_dev(div1, t0);
    			append_dev(div1, progress0);
    			/*progress0_binding*/ ctx[34](progress0);
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
    			/*progress1_binding*/ ctx[39](progress1);
    			insert_dev(target, t7, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, if_block2_anchor, anchor);
    			current = true;

    			dispose = [
    				listen_dev(button0, "click", /*click_handler*/ ctx[33], false, false, false),
    				listen_dev(progress0, "mousedown", /*mousedown_handler*/ ctx[35], false, false, false),
    				listen_dev(progress0, "mouseenter", /*mouseenter_handler*/ ctx[36], false, false, false),
    				listen_dev(progress0, "mouseleave", /*mouseleave_handler*/ ctx[37], false, false, false),
    				listen_dev(progress0, "click", /*seekAudio*/ ctx[23], false, false, false),
    				listen_dev(button1, "click", /*click_handler_1*/ ctx[38], false, false, false),
    				listen_dev(progress1, "mousedown", /*mousedown_handler_1*/ ctx[40], false, false, false),
    				listen_dev(progress1, "click", /*seekVolume*/ ctx[24], false, false, false)
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

    			if (!current || dirty[0] & /*iconColor*/ 256) {
    				set_style(button0, "--icon-color", /*iconColor*/ ctx[8]);
    			}

    			if (!current || dirty[0] & /*currentTime*/ 8192 && progress0_value_value !== (progress0_value_value = /*currentTime*/ ctx[13] ? /*currentTime*/ ctx[13] : 0)) {
    				prop_dev(progress0, "value", progress0_value_value);
    			}

    			if (!current || dirty[0] & /*duration*/ 4) {
    				attr_dev(progress0, "max", /*duration*/ ctx[2]);
    			}

    			if (!current || dirty[0] & /*barPrimaryColor*/ 1024) {
    				set_style(progress0, "--primary-color", /*barPrimaryColor*/ ctx[10]);
    			}

    			if (!current || dirty[0] & /*barSecondaryColor*/ 2048) {
    				set_style(progress0, "--secondary-color", /*barSecondaryColor*/ ctx[11]);
    			}

    			if ((!current || dirty[0] & /*currentTime*/ 8192) && t2_value !== (t2_value = formatSeconds(/*currentTime*/ ctx[13]) + "")) set_data_dev(t2, t2_value);
    			if ((!current || dirty[0] & /*duration*/ 4) && t4_value !== (t4_value = formatSeconds(/*duration*/ ctx[2]) + "")) set_data_dev(t4, t4_value);

    			if (current_block_type_1 !== (current_block_type_1 = select_block_type_1(ctx))) {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(button1, null);
    				}
    			}

    			if (!current || dirty[0] & /*iconColor*/ 256) {
    				set_style(button1, "--icon-color", /*iconColor*/ ctx[8]);
    			}

    			if (!current || dirty[0] & /*volume*/ 16) {
    				prop_dev(progress1, "value", /*volume*/ ctx[4]);
    			}

    			if (!current || dirty[0] & /*barPrimaryColor*/ 1024) {
    				set_style(progress1, "--primary-color", /*barPrimaryColor*/ ctx[10]);
    			}

    			if (!current || dirty[0] & /*barSecondaryColor*/ 2048) {
    				set_style(progress1, "--secondary-color", /*barSecondaryColor*/ ctx[11]);
    			}

    			if (!current || dirty[0] & /*textColor*/ 512) {
    				set_style(div1, "--color", /*textColor*/ ctx[9]);
    			}

    			if (!current || dirty[0] & /*backgroundColor*/ 4096) {
    				set_style(div1, "--background-color", /*backgroundColor*/ ctx[12]);
    			}

    			if (/*showTooltip*/ ctx[17]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    					transition_in(if_block2, 1);
    				} else {
    					if_block2 = create_if_block_1(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(if_block2_anchor.parentNode, if_block2_anchor);
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
    			/*progress0_binding*/ ctx[34](null);
    			if_block1.d();
    			/*progress1_binding*/ ctx[39](null);
    			if (detaching) detach_dev(t7);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(if_block2_anchor);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(168:0) {#if display}",
    		ctx
    	});

    	return block;
    }

    // (176:12) {:else}
    function create_else_block_1(ctx) {
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
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(176:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (174:12) {#if paused}
    function create_if_block_5(ctx) {
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
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(174:12) {#if paused}",
    		ctx
    	});

    	return block;
    }

    // (201:12) {:else}
    function create_else_block(ctx) {
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
    		id: create_else_block.name,
    		type: "else",
    		source: "(201:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (199:34) 
    function create_if_block_4(ctx) {
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
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(199:34) ",
    		ctx
    	});

    	return block;
    }

    // (197:35) 
    function create_if_block_3(ctx) {
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
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(197:35) ",
    		ctx
    	});

    	return block;
    }

    // (195:12) {#if muted}
    function create_if_block_2(ctx) {
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
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(195:12) {#if muted}",
    		ctx
    	});

    	return block;
    }

    // (214:4) {#if showTooltip}
    function create_if_block_1(ctx) {
    	let div;
    	let t;
    	let div_transition;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*seekText*/ ctx[18]);
    			attr_dev(div, "class", "tooltip svelte-samnqd");
    			set_style(div, "--left", /*tooltipX*/ ctx[15] + "px");
    			set_style(div, "--top", /*tooltipY*/ ctx[16] + "px");
    			set_style(div, "--background-color", /*backgroundColor*/ ctx[12]);
    			set_style(div, "--box-color", /*barSecondaryColor*/ ctx[11]);
    			add_location(div, file, 214, 8, 6169);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    			/*div_binding*/ ctx[41](div);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*seekText*/ 262144) set_data_dev(t, /*seekText*/ ctx[18]);

    			if (!current || dirty[0] & /*tooltipX*/ 32768) {
    				set_style(div, "--left", /*tooltipX*/ ctx[15] + "px");
    			}

    			if (!current || dirty[0] & /*tooltipY*/ 65536) {
    				set_style(div, "--top", /*tooltipY*/ ctx[16] + "px");
    			}

    			if (!current || dirty[0] & /*backgroundColor*/ 4096) {
    				set_style(div, "--background-color", /*backgroundColor*/ ctx[12]);
    			}

    			if (!current || dirty[0] & /*barSecondaryColor*/ 2048) {
    				set_style(div, "--box-color", /*barSecondaryColor*/ ctx[11]);
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
    			/*div_binding*/ ctx[41](null);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(214:4) {#if showTooltip}",
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

    		/*audio_1_timeupdate_handler*/ ctx[45].call(audio_1);
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
    			if (/*duration*/ ctx[2] === void 0) add_render_callback(() => /*audio_1_durationchange_handler*/ ctx[44].call(audio_1));
    			add_location(audio_1, file, 224, 0, 6459);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, audio_1, anchor);
    			/*audio_1_binding*/ ctx[42](audio_1);
    			current = true;

    			dispose = [
    				listen_dev(window, "mouseup", /*mouseup_handler*/ ctx[32], false, false, false),
    				listen_dev(window, "mousemove", /*trackMouse*/ ctx[25], false, false, false),
    				listen_dev(audio_1, "play", /*audio_1_play_pause_handler*/ ctx[43]),
    				listen_dev(audio_1, "pause", /*audio_1_play_pause_handler*/ ctx[43]),
    				listen_dev(audio_1, "durationchange", /*audio_1_durationchange_handler*/ ctx[44]),
    				listen_dev(audio_1, "timeupdate", audio_1_timeupdate_handler),
    				listen_dev(audio_1, "play", /*play_handler*/ ctx[30], false, false, false),
    				listen_dev(audio_1, "ended", /*ended_handler*/ ctx[31], false, false, false)
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

    			if (!audio_1_updating && dirty[0] & /*currentTime*/ 8192 && !isNaN_1(/*currentTime*/ ctx[13])) {
    				audio_1.currentTime = /*currentTime*/ ctx[13];
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
    			/*audio_1_binding*/ ctx[42](null);
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
    	let { iconColor = "gray" } = $$props;
    	let { textColor = "gray" } = $$props;
    	let { barPrimaryColor = "lightblue" } = $$props;
    	let { barSecondaryColor = "lightgray" } = $$props;
    	let { backgroundColor = "white" } = $$props;
    	let { display = false } = $$props;
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
    		let bounds = songBar.getBoundingClientRect();
    		$$invalidate(15, tooltipX = event.pageX - bounds.left);
    		let seekValue = tooltipX * duration / bounds.width;
    		$$invalidate(18, seekText = formatSeconds(seekValue));
    		$$invalidate(16, tooltipY = songBar.offsetTop + 10);
    	}

    	function trackMouse(event) {
    		if (seeking) seekAudio(event);
    		if (showTooltip) seekTooltip(event);
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
    		"iconColor",
    		"textColor",
    		"barPrimaryColor",
    		"barSecondaryColor",
    		"backgroundColor",
    		"display"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Component> was created with unknown prop '${key}'`);
    	});

    	function play_handler(event) {
    		bubble($$self, event);
    	}

    	function ended_handler(event) {
    		bubble($$self, event);
    	}

    	const mouseup_handler = () => $$invalidate(19, seeking = $$invalidate(20, volumeSeeking = false));
    	const click_handler = () => audio.paused ? audio.play() : audio.pause();

    	function progress0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(21, songBar = $$value);
    		});
    	}

    	const mousedown_handler = () => $$invalidate(19, seeking = true);
    	const mouseenter_handler = () => $$invalidate(17, showTooltip = true);
    	const mouseleave_handler = () => $$invalidate(17, showTooltip = false);
    	const click_handler_1 = () => $$invalidate(3, muted = !muted);

    	function progress1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(22, volumeBar = $$value);
    		});
    	}

    	const mousedown_handler_1 = () => $$invalidate(20, volumeSeeking = true);

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(14, tooltip = $$value);
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
    		$$invalidate(13, currentTime);
    	}

    	$$self.$set = $$props => {
    		if ("src" in $$props) $$invalidate(6, src = $$props.src);
    		if ("audio" in $$props) $$invalidate(0, audio = $$props.audio);
    		if ("paused" in $$props) $$invalidate(1, paused = $$props.paused);
    		if ("duration" in $$props) $$invalidate(2, duration = $$props.duration);
    		if ("muted" in $$props) $$invalidate(3, muted = $$props.muted);
    		if ("volume" in $$props) $$invalidate(4, volume = $$props.volume);
    		if ("preload" in $$props) $$invalidate(7, preload = $$props.preload);
    		if ("iconColor" in $$props) $$invalidate(8, iconColor = $$props.iconColor);
    		if ("textColor" in $$props) $$invalidate(9, textColor = $$props.textColor);
    		if ("barPrimaryColor" in $$props) $$invalidate(10, barPrimaryColor = $$props.barPrimaryColor);
    		if ("barSecondaryColor" in $$props) $$invalidate(11, barSecondaryColor = $$props.barSecondaryColor);
    		if ("backgroundColor" in $$props) $$invalidate(12, backgroundColor = $$props.backgroundColor);
    		if ("display" in $$props) $$invalidate(5, display = $$props.display);
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
    			iconColor,
    			textColor,
    			barPrimaryColor,
    			barSecondaryColor,
    			backgroundColor,
    			display,
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
    		if ("iconColor" in $$props) $$invalidate(8, iconColor = $$props.iconColor);
    		if ("textColor" in $$props) $$invalidate(9, textColor = $$props.textColor);
    		if ("barPrimaryColor" in $$props) $$invalidate(10, barPrimaryColor = $$props.barPrimaryColor);
    		if ("barSecondaryColor" in $$props) $$invalidate(11, barSecondaryColor = $$props.barSecondaryColor);
    		if ("backgroundColor" in $$props) $$invalidate(12, backgroundColor = $$props.backgroundColor);
    		if ("display" in $$props) $$invalidate(5, display = $$props.display);
    		if ("currentTime" in $$props) $$invalidate(13, currentTime = $$props.currentTime);
    		if ("tooltip" in $$props) $$invalidate(14, tooltip = $$props.tooltip);
    		if ("tooltipX" in $$props) $$invalidate(15, tooltipX = $$props.tooltipX);
    		if ("tooltipY" in $$props) $$invalidate(16, tooltipY = $$props.tooltipY);
    		if ("showTooltip" in $$props) $$invalidate(17, showTooltip = $$props.showTooltip);
    		if ("seekText" in $$props) $$invalidate(18, seekText = $$props.seekText);
    		if ("seeking" in $$props) $$invalidate(19, seeking = $$props.seeking);
    		if ("volumeSeeking" in $$props) $$invalidate(20, volumeSeeking = $$props.volumeSeeking);
    		if ("songBar" in $$props) $$invalidate(21, songBar = $$props.songBar);
    		if ("volumeBar" in $$props) $$invalidate(22, volumeBar = $$props.volumeBar);
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
    		iconColor,
    		textColor,
    		barPrimaryColor,
    		barSecondaryColor,
    		backgroundColor,
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

    class Component extends SvelteComponentDev {
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
    				iconColor: 8,
    				textColor: 9,
    				barPrimaryColor: 10,
    				barSecondaryColor: 11,
    				backgroundColor: 12,
    				display: 5,
    				hide: 26,
    				show: 27
    			},
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Component",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*src*/ ctx[6] === undefined && !("src" in props)) {
    			console.warn("<Component> was created without expected prop 'src'");
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

    	get iconColor() {
    		return this.$$.ctx[8];
    	}

    	set iconColor(iconColor) {
    		this.$set({ iconColor });
    		flush();
    	}

    	get textColor() {
    		return this.$$.ctx[9];
    	}

    	set textColor(textColor) {
    		this.$set({ textColor });
    		flush();
    	}

    	get barPrimaryColor() {
    		return this.$$.ctx[10];
    	}

    	set barPrimaryColor(barPrimaryColor) {
    		this.$set({ barPrimaryColor });
    		flush();
    	}

    	get barSecondaryColor() {
    		return this.$$.ctx[11];
    	}

    	set barSecondaryColor(barSecondaryColor) {
    		this.$set({ barSecondaryColor });
    		flush();
    	}

    	get backgroundColor() {
    		return this.$$.ctx[12];
    	}

    	set backgroundColor(backgroundColor) {
    		this.$set({ backgroundColor });
    		flush();
    	}

    	get display() {
    		return this.$$.ctx[5];
    	}

    	set display(display) {
    		this.$set({ display });
    		flush();
    	}

    	get hide() {
    		return this.$$.ctx[26];
    	}

    	set hide(value) {
    		throw new Error("<Component>: Cannot set read-only property 'hide'");
    	}

    	get show() {
    		return this.$$.ctx[27];
    	}

    	set show(value) {
    		throw new Error("<Component>: Cannot set read-only property 'show'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.18.2 */
    const file$1 = "src\\App.svelte";

    function create_fragment$1(ctx) {
    	let link;
    	let t0;
    	let main;
    	let h1;
    	let t2;
    	let h2;
    	let a;
    	let t4;
    	let div;
    	let article0;
    	let h30;
    	let t6;
    	let p0;
    	let b0;
    	let t8;
    	let t9;
    	let t10;
    	let article1;
    	let h31;
    	let t12;
    	let p1;
    	let b1;
    	let t14;
    	let t15;
    	let t16;
    	let article2;
    	let h32;
    	let t18;
    	let p2;
    	let b2;
    	let t20;
    	let t21;
    	let t22;
    	let article3;
    	let h33;
    	let t24;
    	let p3;
    	let b3;
    	let t26;
    	let t27;
    	let t28;
    	let article4;
    	let h34;
    	let t30;
    	let p4;
    	let b4;
    	let t32;
    	let t33;
    	let current;

    	const audiocontrols0 = new Component({
    			props: {
    				src: "https://sveltejs.github.io/assets/music/strauss.mp3",
    				display: true
    			},
    			$$inline: true
    		});

    	const audiocontrols1 = new Component({
    			props: {
    				src: "https://sveltejs.github.io/assets/music/holst.mp3",
    				display: true
    			},
    			$$inline: true
    		});

    	const audiocontrols2 = new Component({
    			props: {
    				src: "https://sveltejs.github.io/assets/music/satie.mp3",
    				display: true
    			},
    			$$inline: true
    		});

    	const audiocontrols3 = new Component({
    			props: {
    				src: "https://sveltejs.github.io/assets/music/beethoven.mp3",
    				display: true
    			},
    			$$inline: true
    		});

    	const audiocontrols4 = new Component({
    			props: {
    				src: "https://sveltejs.github.io/assets/music/mozart.mp3",
    				display: true
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			link = element("link");
    			t0 = space();
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Linkcube's Component Demo";
    			t2 = space();
    			h2 = element("h2");
    			a = element("a");
    			a.textContent = "Svelte Audio Controls";
    			t4 = space();
    			div = element("div");
    			article0 = element("article");
    			h30 = element("h3");
    			h30.textContent = "The Blue Danube Waltz";
    			t6 = space();
    			p0 = element("p");
    			b0 = element("b");
    			b0.textContent = "Johann Strauss";
    			t8 = text(" / performed by European Archive");
    			t9 = space();
    			create_component(audiocontrols0.$$.fragment);
    			t10 = space();
    			article1 = element("article");
    			h31 = element("h3");
    			h31.textContent = "Mars, the Bringer of War";
    			t12 = space();
    			p1 = element("p");
    			b1 = element("b");
    			b1.textContent = "Gustav Holst";
    			t14 = text(" / performed by USAF Heritage of America Band");
    			t15 = space();
    			create_component(audiocontrols1.$$.fragment);
    			t16 = space();
    			article2 = element("article");
    			h32 = element("h3");
    			h32.textContent = "Gymnopédie no. 1";
    			t18 = space();
    			p2 = element("p");
    			b2 = element("b");
    			b2.textContent = "Erik Satie";
    			t20 = text(" / performed by Prodigal Procrastinator");
    			t21 = space();
    			create_component(audiocontrols2.$$.fragment);
    			t22 = space();
    			article3 = element("article");
    			h33 = element("h3");
    			h33.textContent = "Symphony no. 5 in Cm, Op. 67 - I. Allegro con brio";
    			t24 = space();
    			p3 = element("p");
    			b3 = element("b");
    			b3.textContent = "Ludwig van Beethoven";
    			t26 = text(" / performed by European Archive");
    			t27 = space();
    			create_component(audiocontrols3.$$.fragment);
    			t28 = space();
    			article4 = element("article");
    			h34 = element("h3");
    			h34.textContent = "Requiem in D minor, K. 626 - III. Sequence - Lacrymosa";
    			t30 = space();
    			p4 = element("p");
    			b4 = element("b");
    			b4.textContent = "Wolfgang Amadeus Mozart";
    			t32 = text(" / performed by Markus Staab");
    			t33 = space();
    			create_component(audiocontrols4.$$.fragment);
    			attr_dev(link, "href", "https://fonts.googleapis.com/icon?family=Material+Icons");
    			attr_dev(link, "rel", "stylesheet");
    			add_location(link, file$1, 5, 0, 90);
    			attr_dev(h1, "class", "svelte-zv7v8c");
    			add_location(h1, file$1, 8, 1, 186);
    			attr_dev(a, "href", "https://github.com/Linkcube/svelte-audio-controls");
    			add_location(a, file$1, 9, 5, 226);
    			add_location(h2, file$1, 9, 1, 222);
    			add_location(h30, file$1, 13, 3, 430);
    			add_location(b0, file$1, 14, 6, 467);
    			add_location(p0, file$1, 14, 3, 464);
    			attr_dev(article0, "class", "svelte-zv7v8c");
    			add_location(article0, file$1, 11, 2, 350);
    			add_location(h31, file$1, 22, 3, 659);
    			add_location(b1, file$1, 23, 6, 699);
    			add_location(p1, file$1, 23, 3, 696);
    			attr_dev(article1, "class", "svelte-zv7v8c");
    			add_location(article1, file$1, 21, 2, 646);
    			add_location(h32, file$1, 32, 3, 963);
    			add_location(b2, file$1, 33, 6, 995);
    			add_location(p2, file$1, 33, 3, 992);
    			attr_dev(article2, "class", "svelte-zv7v8c");
    			add_location(article2, file$1, 31, 2, 950);
    			add_location(h33, file$1, 42, 3, 1246);
    			add_location(b3, file$1, 43, 6, 1312);
    			add_location(p3, file$1, 43, 3, 1309);
    			attr_dev(article3, "class", "svelte-zv7v8c");
    			add_location(article3, file$1, 41, 2, 1233);
    			add_location(h34, file$1, 52, 3, 1587);
    			add_location(b4, file$1, 53, 6, 1657);
    			add_location(p4, file$1, 53, 3, 1654);
    			attr_dev(article4, "class", "svelte-zv7v8c");
    			add_location(article4, file$1, 51, 2, 1574);
    			attr_dev(div, "class", "audio-container svelte-zv7v8c");
    			add_location(div, file$1, 10, 1, 318);
    			attr_dev(main, "class", "svelte-zv7v8c");
    			add_location(main, file$1, 7, 0, 178);
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
    			append_dev(main, h2);
    			append_dev(h2, a);
    			append_dev(main, t4);
    			append_dev(main, div);
    			append_dev(div, article0);
    			append_dev(article0, h30);
    			append_dev(article0, t6);
    			append_dev(article0, p0);
    			append_dev(p0, b0);
    			append_dev(p0, t8);
    			append_dev(article0, t9);
    			mount_component(audiocontrols0, article0, null);
    			append_dev(div, t10);
    			append_dev(div, article1);
    			append_dev(article1, h31);
    			append_dev(article1, t12);
    			append_dev(article1, p1);
    			append_dev(p1, b1);
    			append_dev(p1, t14);
    			append_dev(article1, t15);
    			mount_component(audiocontrols1, article1, null);
    			append_dev(div, t16);
    			append_dev(div, article2);
    			append_dev(article2, h32);
    			append_dev(article2, t18);
    			append_dev(article2, p2);
    			append_dev(p2, b2);
    			append_dev(p2, t20);
    			append_dev(article2, t21);
    			mount_component(audiocontrols2, article2, null);
    			append_dev(div, t22);
    			append_dev(div, article3);
    			append_dev(article3, h33);
    			append_dev(article3, t24);
    			append_dev(article3, p3);
    			append_dev(p3, b3);
    			append_dev(p3, t26);
    			append_dev(article3, t27);
    			mount_component(audiocontrols3, article3, null);
    			append_dev(div, t28);
    			append_dev(div, article4);
    			append_dev(article4, h34);
    			append_dev(article4, t30);
    			append_dev(article4, p4);
    			append_dev(p4, b4);
    			append_dev(p4, t32);
    			append_dev(article4, t33);
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
    			if (detaching) detach_dev(link);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(audiocontrols0);
    			destroy_component(audiocontrols1);
    			destroy_component(audiocontrols2);
    			destroy_component(audiocontrols3);
    			destroy_component(audiocontrols4);
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
    	let { name } = $$props;
    	const writable_props = ["name"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    	};

    	$$self.$capture_state = () => {
    		return { name };
    	};

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    	};

    	return [name];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { name: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !("name" in props)) {
    			console.warn("<App> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
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
