/* eslint-disable no-var, vars-on-top, no-console */
(function () {
  'use strict';

  var params = new URLSearchParams(window.location.search);
  var config = {
    apiVersion: Number(params.get('apiVersion') || '2'),
    minApiVersion: Number(params.get('minApiVersion') || '1'),
    usesTokens: params.get('usesTokens') === '1',
    // v3 tasks may declare that they own work in progress (platform must not save/reload current answer)
    savesHistory: params.get('savesHistory') === '1',
    // reloadHistory skips the pre-reload save when the task is read-only (observer case).
    readOnly: params.get('readOnly') === '1',
    autoHeight: params.get('autoHeight') === '1',
    loadDelay: Number(params.get('loadDelay') || '0'),
    gradeDelay: Number(params.get('gradeDelay') || '0'),
    failGrade: params.get('failGrade') === '1',
    fixedScore: params.get('score'),
    // when set, the 'solution' view is hidden until the task receives a token update *after* being loaded
    // (simulates a task whose token grants solution access only once the item has been validated)
    solutionOnTokenUpdate: params.get('solutionOnTokenUpdate') === '1',
  };

  var calls = [];
  // In-memory editor history for API v3 getHistory (newest-first by id).
  // Default: two checkpoints + one edit between them (submission-between-checkpoints e2e).
  // historyCheckpoints=N seeds N checkpoints only (multi-page History e2e).
  var historySeedBase = Date.parse('2024-06-01T10:00:00Z');
  var historyCheckpointCount = Number(params.get('historyCheckpoints') || '0');
  var editorHistory = [];
  if (historyCheckpointCount > 0) {
    for (var cp = 1; cp <= historyCheckpointCount; cp++) {
      editorHistory.push({
        id: cp,
        datetime: new Date(historySeedBase + (cp - 1) * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z'),
        tags: [{ identifier: 'cp' + cp, i18nText: 'Checkpoint ' + cp }],
        idUser: 'test-user',
        isCheckpoint: true,
        sinceEarlier: { charsAdded: 10, charsRemoved: 1 },
        sinceEarlierCheckpoint: { charsAdded: 10, charsRemoved: 1, elementsCount: 0 },
        activeTab: { name: 'main.py', length: 20 + cp, progLang: 'python' },
      });
    }
  } else {
    editorHistory = [
      {
        id: 1,
        datetime: new Date(historySeedBase).toISOString().replace(/\.\d{3}Z$/, 'Z'),
        tags: [{ identifier: 'start', i18nText: 'Start' }],
        idUser: 'test-user',
        isCheckpoint: true,
        sinceEarlier: { charsAdded: 20, charsRemoved: 0 },
        sinceEarlierCheckpoint: { charsAdded: 20, charsRemoved: 0, elementsCount: 0 },
        activeTab: { name: 'main.py', length: 20, progLang: 'python' },
        answer: 'start',
      },
      {
        id: 2,
        datetime: new Date(historySeedBase + 60 * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z'),
        tags: [],
        idUser: 'test-user',
        isCheckpoint: false,
        sinceEarlier: { charsAdded: 15, charsRemoved: 2 },
        activeTab: { name: 'main.py', length: 33, progLang: 'python' },
        answer: 'edit',
      },
      {
        id: 3,
        datetime: new Date(historySeedBase + 120 * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z'),
        tags: [{ identifier: 'manual', i18nText: 'Manual' }],
        idUser: 'test-user',
        isCheckpoint: true,
        sinceEarlier: { charsAdded: 8, charsRemoved: 1 },
        sinceEarlierCheckpoint: { charsAdded: 23, charsRemoved: 3, elementsCount: 1 },
        activeTab: { name: 'main.py', length: 40, progLang: 'python' },
        answer: 'manual',
      },
    ];
  }

  var state = {
    answer: '',
    taskState: '',
    token: '',
    shownViews: {},
    loaded: false,
    // solution is granted up-front unless the scenario defers it to a post-load token update
    solutionGranted: !config.solutionOnTokenUpdate,
  };

  function filterEditorHistory(options) {
    var opts = options || {};
    var limit = opts.limit != null ? Number(opts.limit) : 100;
    if (!Number.isFinite(limit) || limit < 1) limit = 100;
    if (limit > 1000) limit = 1000;
    var items = editorHistory.slice().sort(function (a, b) { return b.id - a.id; });
    if (opts.onlyCheckpoints) {
      items = items.filter(function (el) { return el.isCheckpoint; });
    }
    if (opts.maxId != null) {
      var maxId = Number(opts.maxId);
      items = items.filter(function (el) { return el.id <= maxId; });
    }
    if (opts.minId != null) {
      var minId = Number(opts.minId);
      items = items.filter(function (el) { return el.id > minId; });
    }
    return items.slice(0, limit);
  }

  var statusEl = document.getElementById('status');
  var callLogEl = document.getElementById('call-log');
  var answerInput = document.getElementById('answer-input');
  var stateInput = document.getElementById('state-input');
  var lastTokenEl = document.getElementById('last-token');
  var shownViewsEl = document.getElementById('shown-views');
  var solutionGrantedEl = document.getElementById('solution-granted');
  var loadedMarker = document.getElementById('loaded-marker');

  var baseViews = {
    task: { includes: ['editor'] },
    editor: {},
    hints: {},
    grader: {},
    metadata: {},
  };

  function getCurrentViews() {
    var currentViews = Object.assign({}, baseViews);
    if (state.solutionGranted) currentViews.solution = {};
    return currentViews;
  }

  function logCall(method, callParams) {
    var entry = { method: method, params: callParams, timestamp: Date.now() };
    calls.push(entry);
    window.testTaskCalls = calls;
    // Durable logs for e2e: parent mirror (SPA) + sessionStorage (survives full navigations).
    try {
      if (window.parent && window.parent !== window) {
        window.parent.testTaskCallsHost = window.parent.testTaskCallsHost || [];
        window.parent.testTaskCallsHost.push(entry);
      }
    } catch (e) { /* cross-origin parent */ }
    try {
      var stored = JSON.parse(sessionStorage.getItem('testTaskCallsHost') || '[]');
      stored.push(entry);
      sessionStorage.setItem('testTaskCallsHost', JSON.stringify(stored));
    } catch (e) { /* private mode / quota */ }
    try {
      var item = document.createElement('li');
      item.dataset.method = method;
      item.textContent = method + ' ' + JSON.stringify(callParams);
      callLogEl.appendChild(item);
    } catch (e) { /* DOM already gone during teardown */ }
    window.testTaskState = getPublicState();
  }

  function getPublicState() {
    return {
      answer: state.answer,
      state: state.taskState,
      token: state.token,
      shownViews: state.shownViews,
      loaded: state.loaded,
      solutionGranted: state.solutionGranted,
    };
  }

  function syncInputsFromState() {
    answerInput.value = state.answer;
    stateInput.value = state.taskState;
    lastTokenEl.textContent = state.token || '—';
    shownViewsEl.textContent = Object.keys(state.shownViews).length ? JSON.stringify(state.shownViews) : '—';
    if (solutionGrantedEl) solutionGrantedEl.textContent = state.solutionGranted ? 'yes' : 'no';
  }

  function parseGradeScore(answer) {
    if (config.fixedScore !== null && config.fixedScore !== '') return Number(config.fixedScore);
    var parsed = Number(answer);
    if (Number.isFinite(parsed)) return Math.max(0, Math.min(100, parsed));
    return 0;
  }

  function delayedComplete(trans, value, delayMs) {
    if (delayMs > 0) {
      trans.delayReturn(true);
      window.setTimeout(function () { trans.complete(value); }, delayMs);
      return;
    }
    return value;
  }

  function getScope() {
    var scope = params.get('channelId');
    if (!scope) throw new Error('Missing channelId query parameter');
    return scope;
  }

  var chan = Channel.build({
    window: window.parent,
    origin: '*',
    scope: getScope(),
    onReady: function () {
      statusEl.textContent = 'Channel ready';
    },
  });

  window.platform = {
    deviceProxy: function (category, method, args, success, error) {
      var params = [category, method, args];
      logCall('_outgoing.platform.deviceProxy', params);
      chan.call({
        method: 'platform.deviceProxy',
        params: params,
        timeout: 10000,
        success: function (result) {
          logPlatformCall('platform.deviceProxy', params, 'ok', result);
          success(result);
        },
        error: function (err, message) {
          var detail = formatError(err, message);
          logPlatformCall('platform.deviceProxy', params, 'error', detail);
          error({ message: detail });
        },
      });
    },
  };

  chan.bind('task.deviceProxy', function (trans, callParams) {
    var category = Array.isArray(callParams) ? callParams[0] : '';
    var method = Array.isArray(callParams) ? callParams[1] : '';
    var args = Array.isArray(callParams) ? callParams[2] : undefined;
    logCall('task.deviceProxy', [category, method, args]);
    DeviceProxyTask.deviceProxy(
      category,
      method,
      args,
      function (result) { trans.complete(result); },
      function (err) { trans.error('device_proxy_error', err.message || String(err)); },
    );
  });

  chan.bind('task.getMetaData', function () {
    logCall('task.getMetaData', []);
    var metadata = {
      autoHeight: config.autoHeight,
      usesTokens: config.usesTokens,
      apiVersion: config.apiVersion,
      minApiVersion: config.minApiVersion,
      fullFeedback: true,
      minWidth: 'auto',
    };
    if (config.savesHistory) metadata.savesHistory = true;
    return metadata;
  });

  chan.bind('task.load', function (trans, loadViews) {
    logCall('task.load', loadViews);
    state.loaded = true;
    loadedMarker.hidden = false;
    loadedMarker.setAttribute('aria-hidden', 'false');
    statusEl.textContent = 'Ready';
    statusEl.className = 'ready';
    return delayedComplete(trans, true, config.loadDelay);
  });

  chan.bind('task.unload', function () {
    logCall('task.unload', []);
    state.loaded = false;
    loadedMarker.hidden = true;
    loadedMarker.setAttribute('aria-hidden', 'true');
    return true;
  });

  chan.bind('task.getHeight', function () {
    logCall('task.getHeight', []);
    return document.body.scrollHeight;
  });

  chan.bind('task.updateToken', function (trans, token) {
    logCall('task.updateToken', token);
    state.token = String(token);
    // a token received after the task is loaded (i.e. not the initial load token) may grant new permissions,
    // such as access to the solution once the item has been validated
    if (config.solutionOnTokenUpdate && state.loaded) state.solutionGranted = true;
    syncInputsFromState();
    return delayedComplete(trans, true, 0);
  });

  chan.bind('task.getAnswer', function () {
    logCall('task.getAnswer', []);
    state.answer = answerInput.value;
    syncInputsFromState();
    return state.answer;
  });

  chan.bind('task.reloadAnswer', function (trans, answer) {
    logCall('task.reloadAnswer', answer);
    state.answer = String(answer);
    syncInputsFromState();
    return delayedComplete(trans, true, 0);
  });

  chan.bind('task.reloadAnswerWithOptions', function (trans, callParams) {
    var answer = Array.isArray(callParams) ? callParams[0] : callParams;
    var options = Array.isArray(callParams) ? callParams[1] : {};
    logCall('task.reloadAnswerWithOptions', [answer, options]);
    state.answer = String(answer);
    syncInputsFromState();
    return delayedComplete(trans, true, 0);
  });

  chan.bind('task.getState', function () {
    logCall('task.getState', []);
    state.taskState = stateInput.value;
    syncInputsFromState();
    return state.taskState;
  });

  chan.bind('task.reloadState', function (trans, taskState) {
    logCall('task.reloadState', taskState);
    state.taskState = String(taskState);
    syncInputsFromState();
    return delayedComplete(trans, true, 0);
  });

  chan.bind('task.getViews', function () {
    logCall('task.getViews', []);
    return getCurrentViews();
  });

  chan.bind('task.showViews', function (trans, shown) {
    logCall('task.showViews', shown);
    state.shownViews = shown || {};
    syncInputsFromState();
    return delayedComplete(trans, true, 0);
  });

  chan.bind('task.gradeAnswer', function (trans, callParams) {
    var answer = Array.isArray(callParams) ? callParams[0] : '';
    var answerToken = Array.isArray(callParams) ? callParams[1] : '';
    logCall('task.gradeAnswer', [answer, answerToken]);
    if (config.failGrade) {
      trans.delayReturn(true);
      window.setTimeout(function () {
        trans.error('runtime_error', 'Simulated grade failure');
      }, config.gradeDelay);
      return;
    }
    var score = parseGradeScore(answer);
    // scoreToken is null: a real token is a JWS signed with the task platform's private key,
    // which this static page cannot produce. The platform then sends the raw score to save-grade;
    // the backend accepts it only for items whose platform does not require tokens.
    var result = [score, 'Graded by test task', null];
    return delayedComplete(trans, result, config.gradeDelay);
  });

  chan.bind('task.getResources', function () {
    logCall('task.getResources', []);
    return {};
  });

  chan.bind('task.getHistory', function (trans, options) {
    logCall('task.getHistory', options || {});
    return filterEditorHistory(options);
  });

  chan.bind('task.reloadHistory', function (trans, options) {
    logCall('task.reloadHistory', options || {});
    var elementId = Number(options && options.elementId);
    if (!config.readOnly) {
      var nextId = editorHistory.reduce(function (max, el) { return Math.max(max, el.id); }, 0) + 1;
      var answer = answerInput.value;
      // A checkpoint so the saved state shows in the History list, which lists checkpoints until a span is opened.
      editorHistory.push({
        id: nextId,
        datetime: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
        tags: [{ identifier: 'autosave', i18nText: 'Autosave' }],
        idUser: 'test-user',
        isCheckpoint: true,
        sinceEarlier: { charsAdded: answer.length, charsRemoved: 0 },
        sinceEarlierCheckpoint: { charsAdded: answer.length, charsRemoved: 0, elementsCount: 0 },
        activeTab: { name: 'main.py', length: answer.length, progLang: 'python' },
        answer: answer,
      });
    }
    var target = null;
    for (var i = 0; i < editorHistory.length; i++) {
      if (editorHistory[i].id === elementId) target = editorHistory[i];
    }
    if (!target) {
      trans.error('not_found', 'Unknown history element ' + elementId);
      return;
    }
    state.answer = target.answer || '';
    syncInputsFromState();
    return true;
  });

  function logPlatformCall(method, callParams, status, detail) {
    var entry = {
      method: '→ ' + method,
      params: { request: callParams, status: status, detail: detail },
      timestamp: Date.now(),
    };
    calls.push(entry);
    var item = document.createElement('li');
    item.dataset.method = method;
    item.dataset.direction = 'out';
    item.textContent = entry.method + ' ' + JSON.stringify(entry.params);
    callLogEl.appendChild(item);
    window.testTaskCalls = calls;
  }

  function formatError(err, message) {
    if (message && typeof message === 'string') return message;
    if (typeof err === 'string') return err;
    try {
      return JSON.stringify(err);
    } catch (jsonError) {
      return String(err);
    }
  }

  function platformCall(method, callParams) {
    logCall('_outgoing.' + method, callParams);
    chan.call({
      method: method,
      params: callParams,
      timeout: 5000,
      success: function (result) {
        logPlatformCall(method, callParams, 'ok', result);
      },
      error: function (err, message) {
        var detail = formatError(err, message);
        logPlatformCall(method, callParams, 'error', detail);
        statusEl.textContent = method + ' failed: ' + detail;
        statusEl.className = 'error';
      },
    });
  }

  function invokePlatform(method, callParams) {
    return new Promise(function (resolve, reject) {
      chan.call({
        method: method,
        params: callParams,
        timeout: 5000,
        success: function (result) {
          logPlatformCall(method, callParams, 'ok', result);
          resolve(result);
        },
        error: function (err, message) {
          var detail = formatError(err, message);
          logPlatformCall(method, callParams, 'error', detail);
          reject(new Error(detail));
        },
      });
    });
  }

  // Exposed before the button wiring below so test instrumentation is available
  // even if a DOM lookup fails; e2e uses this to detect partial setup.
  window.testTaskCalls = calls;
  window.testTaskState = getPublicState();
  window.invokePlatform = invokePlatform;
  window.testTask = {
    getCalls: function () { return calls.slice(); },
    setAnswer: function (value) {
      state.answer = String(value);
      answerInput.value = state.answer;
      window.testTaskState = getPublicState();
    },
    setState: function (value) {
      state.taskState = String(value);
      stateInput.value = state.taskState;
      window.testTaskState = getPublicState();
    },
    waitForCall: function (method) {
      return calls.some(function (entry) { return entry.method === method; });
    },
    invokePlatform: invokePlatform,
  };

  document.getElementById('validate-btn').addEventListener('click', function () {
    // The platform requires a string mode (zod-validated); calling without one is rejected.
    var mode = document.getElementById('validate-mode').value;
    platformCall('platform.validate', mode);
  });

  document.getElementById('update-display-btn').addEventListener('click', function () {
    var height = Number(document.getElementById('display-height').value);
    platformCall('platform.updateDisplay', { height: height });
  });

  document.getElementById('update-height-btn').addEventListener('click', function () {
    var height = Number(document.getElementById('display-height').value);
    platformCall('platform.updateHeight', height);
  });

  document.getElementById('open-url-btn').addEventListener('click', function () {
    var target = document.getElementById('open-url-target').value;
    platformCall('platform.openUrl', { path: target });
  });

  document.getElementById('show-view-btn').addEventListener('click', function () {
    var view = document.getElementById('show-view').value;
    platformCall('platform.showView', view);
  });

  document.getElementById('get-task-params-btn').addEventListener('click', function () {
    invokePlatform('platform.getTaskParams', []).then(function (result) {
      document.getElementById('task-params-result').textContent = JSON.stringify(result);
    }).catch(function (error) {
      document.getElementById('task-params-result').textContent = 'Error: ' + error.message;
    });
  });

  document.getElementById('ask-hint-btn').addEventListener('click', function () {
    platformCall('platform.askHint', 'test-hint-token');
  });

  document.getElementById('log-btn').addEventListener('click', function () {
    platformCall('platform.log', ['test-task log message']);
  });

  document.getElementById('bluetooth-request-btn').addEventListener('click', function () {
    var resultEl = document.getElementById('bluetooth-result');
    resultEl.textContent = 'pending…';
    DeviceProxyTask.bluetooth.requestDevice({ filters: [{ services: ['battery_service'] }] })
      .then(function (device) {
        resultEl.textContent = 'ok: ' + (device.name || device.id);
      })
      .catch(function (error) {
        resultEl.textContent = 'error: ' + error.message;
      });
  });

  document.getElementById('websocket-connect-btn').addEventListener('click', function () {
    var url = document.getElementById('websocket-url').value;
    var resultEl = document.getElementById('websocket-result');
    resultEl.textContent = 'pending…';
    var ws = new DeviceProxyTask.websocket.WebSocket(url);
    var settled = false;
    function finish(text) {
      if (settled) return;
      settled = true;
      resultEl.textContent = text;
    }
    ws.addEventListener('open', function () { finish('open'); });
    ws.addEventListener('error', function () { finish('error'); });
    ws.addEventListener('close', function (event) {
      finish('close: ' + event.code + ' ' + (event.reason || ''));
    });
  });

  answerInput.addEventListener('input', function () {
    state.answer = answerInput.value;
    window.testTaskState = getPublicState();
  });

  stateInput.addEventListener('input', function () {
    state.taskState = stateInput.value;
    window.testTaskState = getPublicState();
  });

  syncInputsFromState();
  statusEl.textContent = 'Waiting for platform…';
})();
