function displace(attrs) {
  let tag = 'script'
  if (attrs?.rel === 'stylesheet') {
    tag = 'link'
  }

  let ret = [];
  if (tag === 'script') {
    ret = document.querySelectorAll('script[hid="' + attrs.hid + '"]');
  } else {
    ret = document.querySelectorAll('link[hid="' + attrs.hid + '"]');
  }
  if (ret) {
    for (let i = 0; i < ret.length; i++) {
      ret[i].remove();
    }
  }
}

async function inject(link, attrs) {
  let tag = "script";
  if (link.slice(link.length - 4) === '.css' || attrs?.rel === 'stylesheet' || attrs?.as === 'style') {
    tag = "link";
  }

  let exists = false;
  if (tag === "script") {
    exists = document.querySelector('script[src="' + link + '"]') !== null;
  } else {
    exists = document.querySelector('link[href="' + link + '"]') !== null;
  }

  if (!exists) {
    const script = document.createElement(tag);
    for (const key in attrs) {
      if (Object.hasOwnProperty.call(attrs, key)) {
        const attr = attrs[key];
        script.setAttribute(key, attr);
      }
    }

    if (tag === "script") {
      script.setAttribute("src", link);
      script.setAttribute("type", "text/javascript");
      document.body.appendChild(script);
    } else {
      script.setAttribute("href", link);
      document.head.appendChild(script);
    }
    return new Promise((resolve, reject) => {
      script.onload = () => {
        console.log(`[quailjs.util.inject] inject <${tag}>`, link);
        resolve(null);
      };
    });
  } else {
    return new Promise((resolve, reject) => {
      resolve(null);
    });
  }
}

async function wait(readyFn, finishFn, timeoutMs, maxTry) {
  if (maxTry <= 0) {
    return;
  }
  maxTry = maxTry || 30;
  timeoutMs = timeoutMs || 100;
  if (await readyFn()) {
    finishFn();
  } else {
    setTimeout(() => {
      wait(readyFn, finishFn, timeoutMs, maxTry - 1);
    }, timeoutMs);
  }
}

function debounce(func, delay) {
  let toHandler;
  return function () {
    const context = this;
    const args = arguments;

    clearTimeout(toHandler);

    toHandler = setTimeout(function () {
      func.apply(context, args);
    }, delay);
  };
}

function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    // Navigator clipboard API method
    navigator.clipboard.writeText(text).then(function() {}, function(err) {
      console.error("[quailjs.util.copyToClipboard] Could not copy text: ", err);
    });
  } else {
    // Fallback method for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        document.execCommand('copy');
    } catch (err) {
        console.error("[quailjs.util.copyToClipboard] Could not copy text: ", err);
      }
    document.body.removeChild(textArea);
  }
}

function getQueryParams() {
  const params = {};
  const query = document.location.search.substring(1);
  const pairs = query.split("&");
  for (let i = 0; i < pairs.length; i++) {
    const pos = pairs[i].indexOf("=");
    if (pos === -1) continue;
    const name = pairs[i].substring(0, pos);
    let value = pairs[i].substring(pos + 1);
    value = decodeURIComponent(value);
    params[name] = value;
  }

  return params;
}


export {
  displace,
  inject,
  wait,
  debounce,
  copyToClipboard,
  getQueryParams,
};