/* AI SEO Autopilot admin screen. No build step, no dependencies. */
(function () {
	'use strict';

	var cfg = window.AISA || {};
	var rows = [];
	var stopRequested = false;
	var CONCURRENCY = cfg.concurrency || 3;

	function $(sel, root) { return (root || document).querySelector(sel); }
	function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

	function esc(s) {
		return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
		});
	}

	function post(action, data) {
		var body = new URLSearchParams();
		body.append('action', 'aisa_' + action);
		body.append('nonce', cfg.nonce);
		(function add(prefix, value) {
			if (value && typeof value === 'object' && !Array.isArray(value)) {
				Object.keys(value).forEach(function (k) { add(prefix ? prefix + '[' + k + ']' : k, value[k]); });
			} else if (Array.isArray(value)) {
				value.forEach(function (v) { body.append(prefix + '[]', v); });
			} else if (prefix) {
				body.append(prefix, value == null ? '' : value);
			}
		})('', data || {});
		return fetch(cfg.ajax, { method: 'POST', credentials: 'same-origin', body: body })
			.then(function (r) { return r.json().catch(function () { return { success: false, data: { message: 'HTTP ' + r.status } }; }); })
			.then(function (j) {
				if (!j || !j.success) {
					throw new Error((j && j.data && j.data.message) || 'Request failed');
				}
				return j.data;
			});
	}

	/* Runs fn over items with a small worker pool. */
	function pool(items, fn, onProgress) {
		var i = 0, done = 0, active = 0;
		return new Promise(function (resolve) {
			function next() {
				while (active < CONCURRENCY && i < items.length && !stopRequested) {
					var item = items[i++];
					active++;
					fn(item).catch(function () {}).then(function () {
						active--;
						done++;
						onProgress(done, items.length);
						next();
					});
				}
				if (active === 0) { resolve(); }
			}
			next();
		});
	}

	/* ---------------- Autopilot tab ---------------- */

	function counter(value, min, max) {
		var n = (value || '').length;
		var cls = n > max ? 'aisa-over' : (n < min ? 'aisa-under' : 'aisa-ok');
		return '<span class="aisa-count ' + cls + '">' + n + '</span>';
	}

	function badge(row) {
		var map = { generated: ['Ready to apply', 'aisa-warn'], applied: ['Applied', 'aisa-good'], error: ['Error', 'aisa-bad'], restored: ['Restored', 'aisa-muted'], skipped: ['Skipped: already has SEO', 'aisa-muted'] };
		var b = map[row.status] || ['Not started', 'aisa-muted'];
		return '<span class="aisa-pill ' + b[1] + '">' + b[0] + '</span>';
	}

	function rowHtml(row) {
		var p = row.proposal && row.proposal.fields ? row.proposal.fields : null;
		var cur = row.current || {};
		var key = row.type + '-' + row.id;
		var html = '<tr data-key="' + key + '">';
		html += '<td class="aisa-col-page"><strong><a href="' + esc(row.url) + '" target="_blank" rel="noopener">' + esc(row.title || '(no title)') + '</a></strong>';
		html += '<div class="aisa-sub">' + esc(row.subtype) + '</div>' + badge(row);
		if (row.error) { html += '<div class="aisa-error">' + esc(row.error) + '</div>'; }
		html += '</td><td>';
		if (p) {
			html += '<label>Title ' + counter(p.title, 30, 60) + '<input type="text" data-f="title" value="' + esc(p.title) + '"></label>';
			html += '<label>Description ' + counter(p.description, 120, 160) + '<textarea rows="2" data-f="description">' + esc(p.description) + '</textarea></label>';
			html += '<div class="aisa-grid">';
			html += '<label>Focus keyphrase<input type="text" data-f="focus_keyphrase" value="' + esc(p.focus_keyphrase) + '"></label>';
			if (cfg.isPro && row.type === 'post') {
				html += '<label>Additional keyphrases<input type="text" data-f="additional_keyphrases" value="' + esc((p.additional_keyphrases || []).join(', ')) + '"></label>';
			}
			html += '</div>';
			if (row.type === 'post') {
				html += '<details><summary>Social and schema</summary>';
				html += '<label>Social title<input type="text" data-f="og_title" value="' + esc(p.og_title) + '"></label>';
				html += '<label>Social description<textarea rows="2" data-f="og_description">' + esc(p.og_description) + '</textarea></label>';
				var s = row.proposal.schema || {};
				html += '<p class="aisa-sub">Schema: ' + esc(s.page_type || 'WebPage');
				if (s.article_type && s.article_type !== 'none') { html += ' · ' + esc(s.article_type); }
				if (s.service) { html += ' · Service: ' + esc(s.service.name); }
				if (s.faqs && s.faqs.length) { html += ' · ' + s.faqs.length + ' FAQ'; }
				html += '</p></details>';
			}
			(row.proposal.warnings || []).forEach(function (w) { html += '<div class="aisa-warning">' + esc(w) + '</div>'; });
		} else {
			html += '<span class="aisa-sub">Not generated yet.</span>';
		}
		html += '<div class="aisa-now"><strong>Now in AIOSEO:</strong> ' + esc(cur.title || '(default template)') + ' — ' + esc(cur.description || '(default)') + '</div>';
		html += '</td><td class="aisa-col-actions">';
		html += '<button class="button" data-act="generate">' + (p ? 'Regenerate' : 'Generate') + '</button>';
		if (p) { html += '<button class="button button-primary" data-act="apply">Apply</button>'; }
		if (row.history > 0) { html += '<button class="button-link" data-act="restore">Restore previous</button>'; }
		html += '</td></tr>';
		return html;
	}

	function renderTable() {
		var box = $('#aisa-table');
		if (!box) { return; }
		var q = ($('#aisa-filter') || {}).value;
		q = q ? q.toLowerCase() : '';
		var list = rows.filter(function (r) { return !q || (r.title || '').toLowerCase().indexOf(q) !== -1; });
		if (!rows.length) {
			box.innerHTML = '<p>No published content found for the content types chosen on the Settings tab.</p>';
			return;
		}
		box.innerHTML = '<table class="widefat aisa-table"><thead><tr><th>Page</th><th>Proposed SEO</th><th></th></tr></thead><tbody>' +
			list.map(rowHtml).join('') + '</tbody></table>';
		updateApplyAll();
	}

	function replaceRow(updated) {
		for (var i = 0; i < rows.length; i++) {
			if (rows[i].type === updated.type && rows[i].id === updated.id) {
				if (!('current' in updated)) { updated.current = rows[i].current; }
				rows[i] = updated;
				var tr = $('tr[data-key="' + updated.type + '-' + updated.id + '"]');
				if (tr) {
					var tmp = document.createElement('tbody');
					tmp.innerHTML = rowHtml(updated);
					tr.parentNode.replaceChild(tmp.firstChild, tr);
				}
				break;
			}
		}
		updateApplyAll();
	}

	function markError(row, err) {
		row.status = 'error';
		row.error = err.message;
		replaceRow(row);
	}

	function updateApplyAll() {
		var btn = $('#aisa-apply-all');
		if (btn) { btn.disabled = !rows.some(function (r) { return r.status === 'generated'; }); }
	}

	function findRow(tr) {
		var parts = tr.getAttribute('data-key').split('-');
		var id = parseInt(parts[1], 10);
		return rows.filter(function (r) { return r.type === parts[0] && r.id === id; })[0];
	}

	function collectEdits(tr) {
		var fields = {};
		$all('[data-f]', tr).forEach(function (el) { fields[el.getAttribute('data-f')] = el.value; });
		return fields;
	}

	function doGenerate(row) {
		return post('generate', { type: row.type, id: row.id }).then(replaceRow, function (e) { markError(row, e); throw e; });
	}

	function doApply(row, tr) {
		var edits = tr ? collectEdits(tr) : null;
		var chain = edits && Object.keys(edits).length ? post('edit', { type: row.type, id: row.id, fields: edits }) : Promise.resolve();
		return chain.then(function () { return post('apply', { type: row.type, id: row.id }); })
			.then(replaceRow, function (e) { markError(row, e); throw e; });
	}

	function progress(label, done, total) {
		var box = $('.aisa-progress');
		box.hidden = false;
		$('.aisa-bar span', box).style.width = (total ? Math.round(100 * done / total) : 0) + '%';
		$('.aisa-progress-text', box).textContent = label + ' ' + done + ' / ' + total;
	}

	function setBusy(busy) {
		$('#aisa-run').disabled = busy;
		$('#aisa-stop').hidden = !busy;
		if (busy) { $('#aisa-apply-all').disabled = true; } else { updateApplyAll(); }
	}

	function runAutopilot() {
		if (!cfg.hasKey) { alert(cfg.i18n.noKey); return; }
		stopRequested = false;
		setBusy(true);
		var review = $('#aisa-review').checked;
		var steps = Promise.resolve();

		if (!cfg.profileApplied) {
			steps = steps.then(function () {
				progress('Analyzing your business…', 0, 1);
				return post('profile_generate').then(function (profile) {
					return post('profile_apply', { profile: profile });
				}).then(function () {
					cfg.profileApplied = true;
					progress('Business profile saved', 1, 1);
				}, function (e) {
					// Pages can still be optimized without a profile.
					$('.aisa-progress-text').textContent = 'Site profile skipped: ' + e.message;
				});
			});
		}

		steps.then(function () {
			var todo = rows.filter(function (r) { return !r.proposal && r.status !== 'skipped'; });
			return pool(todo, doGenerate, function (d, t) { progress('Writing SEO…', d, t); });
		}).then(function () {
			if (review || stopRequested) { return; }
			var ready = rows.filter(function (r) { return r.status === 'generated'; });
			return pool(ready, function (r) { return doApply(r, null); }, function (d, t) { progress('Saving to All in One SEO…', d, t); });
		}).then(function () {
			setBusy(false);
			var errors = rows.filter(function (r) { return r.status === 'error'; }).length;
			$('.aisa-progress-text').textContent = stopRequested ? 'Stopped.' :
				(review ? 'Done. Review the proposals below, then click "Apply all proposals".' : 'Done. Everything was saved to All in One SEO.') +
				(errors ? ' ' + errors + ' item(s) had errors; they are marked below and can be retried.' : '');
		});
	}

	function applyAll() {
		if (!window.confirm(cfg.i18n.confirmApplyAll)) { return; }
		stopRequested = false;
		setBusy(true);
		var ready = rows.filter(function (r) { return r.status === 'generated'; });
		pool(ready, function (r) {
			return doApply(r, $('tr[data-key="' + r.type + '-' + r.id + '"]'));
		}, function (d, t) { progress('Saving to All in One SEO…', d, t); }).then(function () {
			setBusy(false);
			$('.aisa-progress-text').textContent = 'Done.';
		});
	}

	function initAutopilot() {
		if (!$('#aisa-table')) { return; }
		post('targets').then(function (data) { rows = data; renderTable(); }, function (e) {
			$('#aisa-table').innerHTML = '<div class="notice notice-error inline"><p>' + esc(e.message) + '</p></div>';
		});

		$('#aisa-run').addEventListener('click', runAutopilot);
		$('#aisa-apply-all').addEventListener('click', applyAll);
		$('#aisa-stop').addEventListener('click', function () { stopRequested = true; });
		$('#aisa-filter').addEventListener('input', renderTable);

		$('#aisa-table').addEventListener('click', function (ev) {
			var btn = ev.target.closest('[data-act]');
			if (!btn) { return; }
			ev.preventDefault();
			var tr = btn.closest('tr');
			var row = findRow(tr);
			var act = btn.getAttribute('data-act');
			if (act === 'generate' && !cfg.hasKey) { alert(cfg.i18n.noKey); return; }
			if (act === 'restore' && !window.confirm(cfg.i18n.confirmRestore)) { return; }
			btn.disabled = true;
			btn.textContent = '…';
			var run = act === 'generate' ? doGenerate(row)
				: act === 'apply' ? doApply(row, tr)
				: post('restore', { type: row.type, id: row.id }).then(replaceRow, function (e) { markError(row, e); });
			run.catch(function () {});
		});

		$('#aisa-table').addEventListener('input', function (ev) {
			var el = ev.target;
			var f = el.getAttribute && el.getAttribute('data-f');
			if (f === 'title' || f === 'description') {
				var c = el.parentNode.querySelector('.aisa-count');
				var tmp = document.createElement('span');
				tmp.innerHTML = f === 'title' ? counter(el.value, 30, 60) : counter(el.value, 120, 160);
				c.parentNode.replaceChild(tmp.firstChild, c);
			}
		});
	}

	/* ---------------- Site profile tab ---------------- */

	function fillProfile(form, p) {
		function set(name, value) {
			var el = form.querySelector('[name="' + name + '"]');
			if (el && value != null) { el.value = value; }
		}
		Object.keys(p).forEach(function (k) {
			if (k === 'address' || k === 'social') {
				Object.keys(p[k] || {}).forEach(function (sub) { set(k + '[' + sub + ']', p[k][sub]); });
			} else {
				set(k, p[k]);
			}
		});
	}

	function readProfile(form) {
		var out = { address: {}, social: {} };
		$all('[name]', form).forEach(function (el) {
			var m = el.name.match(/^(address|social)\[(\w+)\]$/);
			if (m) { out[m[1]][m[2]] = el.value; } else { out[el.name] = el.value; }
		});
		return out;
	}

	function initProfile() {
		var form = $('#aisa-profile-form');
		if (!form) { return; }
		var status = $('#aisa-profile-status');

		$('#aisa-profile-generate').addEventListener('click', function (ev) {
			ev.preventDefault();
			if (!cfg.hasKey) { alert(cfg.i18n.noKey); return; }
			status.textContent = 'Reading your site… (about 30 seconds)';
			post('profile_generate').then(function (p) {
				fillProfile(form, p);
				status.textContent = 'Done. Check the details below, then save.';
			}, function (e) { status.textContent = e.message; });
		});

		form.addEventListener('submit', function (ev) {
			ev.preventDefault();
			var report = $('#aisa-profile-report');
			report.textContent = 'Saving…';
			post('profile_apply', { profile: readProfile(form) }).then(function (res) {
				var lines = Object.keys(res.report).map(function (k) {
					var v = res.report[k];
					var label = v === 'ok' ? 'saved' : (v === 'kept' ? 'kept your existing value' : v);
					return '<li><code>' + esc(k) + '</code>: ' + esc(label) + '</li>';
				});
				report.innerHTML = '<div class="notice notice-success inline"><p>Saved to All in One SEO.</p><ul>' + lines.join('') + '</ul></div>';
			}, function (e) {
				report.innerHTML = '<div class="notice notice-error inline"><p>' + esc(e.message) + '</p></div>';
			});
		});

		$('#aisa-profile-restore').addEventListener('click', function () {
			if (!window.confirm('Restore All in One SEO site settings to how they were before AI SEO Autopilot changed them?')) { return; }
			post('profile_restore').then(function () {
				$('#aisa-profile-report').innerHTML = '<div class="notice notice-success inline"><p>Restored.</p></div>';
			}, function (e) { alert(e.message); });
		});
	}

	/* ---------------- Settings / Health tabs ---------------- */

	function initMisc() {
		var test = $('#aisa-test-api');
		if (test) {
			test.addEventListener('click', function () {
				var s = $('#aisa-test-status');
				s.textContent = 'Testing… (save the key first if you just typed it)';
				post('test_api').then(function (r) { s.textContent = r.message; }, function (e) { s.textContent = e.message; });
			});
		}
		var health = $('#aisa-health-run');
		if (health) {
			health.addEventListener('click', function () {
				var s = $('#aisa-health-status');
				s.textContent = 'Testing…';
				post('health_run').then(function (r) {
					s.textContent = r.ok ? 'All good.' : 'Problem found; see the report below.';
					$('#aisa-report').value = r.report;
					window.setTimeout(function () { window.location.reload(); }, 1200);
				}, function (e) { s.textContent = e.message; });
			});
		}
		var copy = $('#aisa-copy-report');
		if (copy) {
			copy.addEventListener('click', function () {
				var ta = $('#aisa-report');
				ta.select();
				if (navigator.clipboard) { navigator.clipboard.writeText(ta.value); } else { document.execCommand('copy'); }
				copy.textContent = 'Copied';
			});
		}
	}

	document.addEventListener('DOMContentLoaded', function () {
		initAutopilot();
		initProfile();
		initMisc();
	});
})();
