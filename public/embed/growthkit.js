/**
 * GrowthKit Embed Script
 * 
 * Usage:
 * <script 
 *   src="https://growth.fenixblack.ai/embed/growthkit.js"
 *   data-public-key="pk_xxx"
 *   async>
 * </script>
 * 
 * The widget automatically shows the appropriate UI based on your app config:
 * - Chat widget (if chat is enabled)
 * - Waitlist form (if waitlist is enabled and user hasn't joined)
 * 
 * Optional attributes:
 * - data-theme: 'light' | 'dark' | 'auto' (default: 'auto')
 * - data-language: 'en' | 'es' (default: 'en')
 * - data-position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' (default: 'bottom-right')
 * 
 * @version 1.1.0
 */
(function() {
  'use strict';

  if (window.GrowthKit && window.GrowthKit._initialized) {
    console.warn('[GrowthKit] Already initialized');
    return;
  }

  var VERSION = '1.1.0';

  // Find the current script tag
  var currentScript = document.currentScript || (function() {
    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].src && scripts[i].src.indexOf('growthkit.js') !== -1) {
        return scripts[i];
      }
    }
    return null;
  })();
  
  // Detect base URL from script src
  var BASE_URL = (function() {
    if (currentScript && currentScript.src) {
      var urlParts = currentScript.src.split('/');
      urlParts.pop(); // remove 'growthkit.js'
      urlParts.pop(); // remove 'embed'
      return urlParts.join('/');
    }
    return 'https://growth.fenixblack.ai';
  })();

  // Read config from data attributes
  function getConfig() {
    if (!currentScript) {
      console.error('[GrowthKit] Could not find script tag');
      return null;
    }

    var publicKey = currentScript.getAttribute('data-public-key');
    if (!publicKey) {
      console.error('[GrowthKit] Missing data-public-key attribute');
      return null;
    }

    return {
      publicKey: publicKey,
      theme: currentScript.getAttribute('data-theme') || 'auto',
      language: currentScript.getAttribute('data-language') || 'en',
      position: currentScript.getAttribute('data-position') || 'bottom-right',
    };
  }

  // Build iframe URL
  function buildIframeUrl(config) {
    var params = new URLSearchParams();
    params.set('pk', config.publicKey);
    params.set('theme', config.theme);
    params.set('lang', config.language);
    params.set('position', config.position);
    return BASE_URL + '/embed?' + params.toString();
  }

  // Current mode (set by iframe via postMessage)
  var currentMode = 'loading';
  var container = null;
  var iframe = null;

  // Create container and iframe
  function createEmbed(config) {
    // Create container - starts as inline, switches to fixed for chat
    container = document.createElement('div');
    container.id = 'growthkit-container';
    container.style.cssText = 'width:100%;';
    
    // Insert after script tag
    if (currentScript && currentScript.parentNode) {
      currentScript.parentNode.insertBefore(container, currentScript.nextSibling);
    } else {
      document.body.appendChild(container);
    }

    // Create iframe
    iframe = document.createElement('iframe');
    iframe.src = buildIframeUrl(config);
    iframe.id = 'growthkit-iframe';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('allowtransparency', 'true');
    iframe.style.cssText = 'width:100%;min-height:400px;border:none;';
    
    container.appendChild(iframe);
    return iframe;
  }

  // Adjust container/iframe based on widget mode
  function setMode(mode) {
    if (mode === currentMode) return;
    currentMode = mode;

    if (!container || !iframe) return;

    if (mode === 'chat') {
      // Chat mode: full viewport, fixed position
      container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
      iframe.style.cssText = 'width:100%;height:100%;border:none;pointer-events:auto;';
    } else if (mode === 'waitlist') {
      // Waitlist mode: inline, reasonable height for form
      container.style.cssText = 'width:100%;';
      iframe.style.cssText = 'width:100%;min-height:400px;border:none;';
    } else if (mode === 'none') {
      // Nothing to show - hide
      container.style.cssText = 'display:none;';
    }
  }

  // Event handlers
  var eventHandlers = {};

  // Handle messages from iframe
  function handleMessage(event) {
    // Accept messages from same origin or from BASE_URL
    var iframeOrigin = new URL(BASE_URL).origin;
    if (event.origin !== iframeOrigin && event.origin !== window.location.origin) {
      return;
    }
    
    var data = event.data;
    if (!data || !data.type) return;

    // Handle mode changes
    if (data.type === 'growthkit:mode') {
      setMode(data.mode);
      return;
    }

    // Handle resize
    if (data.type === 'growthkit:resize' && currentMode === 'waitlist') {
      if (iframe) {
        iframe.style.height = data.height + 'px';
      }
      return;
    }

    // Emit to handlers
    if (data.type.startsWith('growthkit:')) {
      var eventType = data.type.replace('growthkit:', '');
      if (eventHandlers[eventType]) {
        eventHandlers[eventType].forEach(function(handler) {
          try { handler(data.data); } catch (e) { console.error('[GrowthKit]', e); }
        });
      }
    }
  }

  // Public API
  window.GrowthKit = {
    _initialized: false,
    _config: null,
    version: VERSION,

    init: function(config) {
      if (this._initialized) return this;
      
      this._config = Object.assign({}, getConfig() || {}, config);
      if (!this._config.publicKey) {
        console.error('[GrowthKit] Missing publicKey');
        return this;
      }

      createEmbed(this._config);
      window.addEventListener('message', handleMessage);
      this._initialized = true;
      return this;
    },

    on: function(event, handler) {
      if (!eventHandlers[event]) eventHandlers[event] = [];
      eventHandlers[event].push(handler);
      return this;
    },

    off: function(event, handler) {
      if (!eventHandlers[event]) return this;
      if (handler) {
        eventHandlers[event] = eventHandlers[event].filter(function(h) { return h !== handler; });
      } else {
        delete eventHandlers[event];
      }
      return this;
    },

    destroy: function() {
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
      window.removeEventListener('message', handleMessage);
      this._initialized = false;
      container = null;
      iframe = null;
      return this;
    },

    getConfig: function() {
      return this._config;
    },

    getMode: function() {
      return currentMode;
    }
  };

  // Auto-init on DOM ready
  function autoInit() {
    var config = getConfig();
    if (config && config.publicKey) {
      window.GrowthKit.init(config);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

})();
