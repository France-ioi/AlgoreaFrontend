/* eslint-disable no-var, vars-on-top, no-console */
(function () {
  'use strict';

  var params = new URLSearchParams(window.location.search);
  var config = {
    apiVersion: Number(params.get('apiVersion') || '2'),
    minApiVersion: Number(params.get('minApiVersion') || '1'),
    usesTokens: params.get('usesTokens') === '1',
    autoHeight: params.get('autoHeight') === '1',
    loadDelay: Number(params.get('loadDelay') || '0'),
    gradeDelay: Number(params.get('gradeDelay') || '0'),
    failGrade: params.get('failGrade') === '1',
    fixedScore: params.get('score'),
  };

  var calls = [];
  var state = {
    answer: '',
    taskState: '',
    token: '',
    shownViews: {},
    loaded: false,
  };

  var statusEl = document.getElementById('status');
  var callLogEl = document.getElementById('call-log');
  var answerInput = document.getElementById('answer-input');
  var stateInput = document.getElementById('state-input');
  var lastTokenEl = document.getElementById('last-token');
  var shownViewsEl = document.getElementById('shown-views');
  var loadedMarker = document.getElementById('loaded-marker');

  var views = {
    task: { includes: ['editor'] },
    editor: {},
    solution: {},
    hints: {},
    grader: {},
    metadata: {},
  };

  function logCall(method, callParams) {
    var entry = { method: method, params: callParams, timestamp: Date.now() };
    calls.push(entry);
    var item = document.createElement('li');
    item.dataset.method = method;
    item.textContent = method + ' ' + JSON.stringify(callParams);
    callLogEl.appendChild(item);
    window.testTaskCalls = calls;
    window.testTaskState = getPublicState();
  }

  function getPublicState() {
    return {
      answer: state.answer,
      state: state.taskState,
      token: state.token,
      shownViews: state.shownViews,
      loaded: state.loaded,
    };
  }

  function syncInputsFromState() {
    answerInput.value = state.answer;
    stateInput.value = state.taskState;
    lastTokenEl.textContent = state.token || '—';
    shownViewsEl.textContent = Object.keys(state.shownViews).length ? JSON.stringify(state.shownViews) : '—';
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

  chan.bind('task.getMetaData', function () {
    logCall('task.getMetaData', []);
    return {
      autoHeight: config.autoHeight,
      usesTokens: config.usesTokens,
      apiVersion: config.apiVersion,
      minApiVersion: config.minApiVersion,
      fullFeedback: true,
      minWidth: 'auto',
    };
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
  });

  chan.bind('task.getHeight', function () {
    logCall('task.getHeight', []);
    return document.body.scrollHeight;
  });

  chan.bind('task.updateToken', function (trans, token) {
    logCall('task.updateToken', token);
    state.token = String(token);
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
    return views;
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

  answerInput.addEventListener('input', function () {
    state.answer = answerInput.value;
    window.testTaskState = getPublicState();
  });

  stateInput.addEventListener('input', function () {
    state.taskState = stateInput.value;
    window.testTaskState = getPublicState();
  });

  statusEl.textContent = 'Waiting for platform…';
})();
