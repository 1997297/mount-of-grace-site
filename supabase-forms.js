/* =========================================================================
   MOUNT OF GRACE OUTREACH — SUPABASE FORM PIPELINE
   =========================================================================
   One shared module for every form on the site (contact, interest,
   sponsorship). Each page loads this file, then calls mogWireForm() with
   its own field mapping.

   WHY THERE IS NO supabase-js CDN TAG ANY MORE
   --------------------------------------------
   The pages used to pull the full supabase-js bundle from jsdelivr and
   then load this file after it. Because a classic <script src> blocks
   everything below it, a slow or blocked CDN meant this file never ran,
   no submit handler was ever attached, and the form fell back to a native
   browser submit — reloading the page and silently discarding whatever
   the visitor had typed. On a weak mobile connection that is a likely
   failure, not a rare one.

   An insert is a single HTTP POST, so we make it directly with fetch().
   No third party in the path, nothing to block, ~120KB less to download.

   Table names below were verified against the live project's REST schema
   — do not "correct" the casing:
       Contact_Messages         (capitalised)
       interest_submissions     (plural)
       sponsorship_submission   (SINGULAR)
   ========================================================================= */

(function () {
  'use strict';

  var SUPABASE_URL = 'https://ndopoxgabnvhvvwrxhmw.supabase.co';
  var SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kb3BveGdhYm52aHZ2d3J4aG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2ODU4ODgsImV4cCI6MjEwNDI2MTg4OH0.ALCDOLaFvSmvXOh1AG9IsakMmREDfRNgLIdODSIrkik';

  var TIMEOUT_MS = 20000;

  /* Inserts one row. Resolves on success, rejects with {code, message}. */
  function insertRow(table, row) {
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = setTimeout(function () {
      if (controller) controller.abort();
    }, TIMEOUT_MS);

    return fetch(SUPABASE_URL + '/rest/v1/' + encodeURIComponent(table), {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        // Do NOT ask for the row back: anon has no SELECT access, and
        // requesting a representation would fail the whole insert (42501).
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(row),
      signal: controller ? controller.signal : undefined
    })
      .then(function (res) {
        clearTimeout(timer);
        if (res.ok) return true;                      // 201 Created
        return res.text().then(function (text) {
          var body = {};
          try { body = JSON.parse(text); } catch (e) { body = { message: text }; }
          body.status = res.status;
          throw body;
        });
      })
      .catch(function (err) {
        clearTimeout(timer);
        if (err && err.name === 'AbortError') throw { code: 'MOG_TIMEOUT', message: 'timeout' };
        if (err && err.code) throw err;
        throw { code: 'MOG_NETWORK', message: (err && err.message) || 'network error' };
      });
  }

  /* ---------- inline status messaging (replaces alert()) ---------- */

  function statusNode(form) {
    var node = form.querySelector('.form-status');
    if (!node) {
      node = document.createElement('p');
      node.className = 'form-status';
      node.setAttribute('role', 'status');
      node.setAttribute('aria-live', 'polite');
      form.appendChild(node);
    }
    return node;
  }

  function showError(form, message) {
    var node = statusNode(form);
    node.textContent = message;
    node.classList.add('is-error');
    node.hidden = false;
  }

  function clearError(form) {
    var node = form.querySelector('.form-status');
    if (node) {
      node.hidden = true;
      node.classList.remove('is-error');
      node.textContent = '';
    }
  }

  /* Turn a PostgREST error into something a visitor can act on, while the
     technical detail stays in the console for whoever maintains the site. */
  function friendlyMessage(error) {
    var code = error && error.code;
    if (code === 'MOG_TIMEOUT') {
      return 'That took too long to send. Please check your connection and try again, or email info@mountofgrace.org.';
    }
    if (code === 'MOG_NETWORK') {
      return 'We could not reach our servers. Please check your connection and try again, or email info@mountofgrace.org.';
    }
    if (code === '42501' || code === 'PGRST205') {
      return 'We could not save your message right now. Please email info@mountofgrace.org and we will pick it up straight away.';
    }
    return 'Something went wrong while sending. Please try again, or email info@mountofgrace.org.';
  }

  function valueOf(id) {
    var el = document.getElementById(id);
    if (!el) return '';
    return typeof el.value === 'string' ? el.value.trim() : '';
  }

  /* ---------- the one submit handler every form shares ----------
     opts = {
       formId, wrapId, successId,
       table,            // exact Supabase table name
       fields,           // { column_name: 'inputElementId' }
       sendingLabel      // optional button text while in flight
     }
  */
  function mogWireForm(opts) {
    var form = document.getElementById(opts.formId);
    if (!form) return;

    var wrap = opts.wrapId ? document.getElementById(opts.wrapId) : null;
    var success = opts.successId ? document.getElementById(opts.successId) : null;
    var button = form.querySelector('button[type="submit"]');
    var idleLabel = button ? button.innerHTML : '';
    var busy = false;

    form.addEventListener('submit', function (e) {
      // Always cancel the native submit, even if something below throws —
      // a page reload would lose everything the visitor typed.
      e.preventDefault();
      if (busy) return;

      // Let the browser's own required/email validation speak first.
      if (typeof form.reportValidity === 'function' && !form.reportValidity()) return;

      clearError(form);

      var row = {};
      Object.keys(opts.fields).forEach(function (column) {
        row[column] = valueOf(opts.fields[column]);
      });

      busy = true;
      if (button) {
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
        button.textContent = opts.sendingLabel || 'Sending…';
      }

      insertRow(opts.table, row)
        .then(function () {
          form.reset();
          if (wrap) wrap.hidden = true;
          if (success) {
            success.hidden = false;
            success.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        })
        .catch(function (error) {
          console.error('[MOG] Insert into "' + opts.table + '" failed:', error);
          showError(form, friendlyMessage(error));
        })
        .then(function () {
          busy = false;
          if (button) {
            button.disabled = false;
            button.removeAttribute('aria-busy');
            button.innerHTML = idleLabel;
          }
        });
    });
  }

    /* ---------- file upload to Supabase Storage ----------
     Same fetch-based approach as insertRow — no supabase-js needed.
     Resolves with the storage path on success, rejects with {code, message}. */
  function uploadFile(bucket, path, file) {
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = setTimeout(function () {
      if (controller) controller.abort();
    }, TIMEOUT_MS);

    return fetch(
      SUPABASE_URL + '/storage/v1/object/' + encodeURIComponent(bucket) + '/' + encodeURIComponent(path),
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
          'Content-Type': file.type || 'application/octet-stream'
        },
        body: file,
        signal: controller ? controller.signal : undefined
      }
    )
      .then(function (res) {
        clearTimeout(timer);
        if (res.ok) return path;
        return res.text().then(function (text) {
          var body = {};
          try { body = JSON.parse(text); } catch (e) { body = { message: text }; }
          body.status = res.status;
          throw body;
        });
      })
      .catch(function (err) {
        clearTimeout(timer);
        if (err && err.name === 'AbortError') throw { code: 'MOG_TIMEOUT', message: 'timeout' };
        if (err && err.code) throw err;
        throw { code: 'MOG_NETWORK', message: (err && err.message) || 'network error' };
      });
  }

  window.mogWireForm = mogWireForm;
  window.mogUploadFile = uploadFile;
  window.mogInsertRow = insertRow;
})();
