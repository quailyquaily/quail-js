
function crackError(err) {
  let errorInfo = {};
  if (err.constructor === String) {
    errorInfo = {
      message: err,
    };
  } else if (err.constructor === Error) {
    let parts = err.message.split("|");
    parts = parts.map((p) => p.trim());

    if (parts.length >= 3) {
      let code = "0";
      if (parts.length > 0) {
        code = parts[0];
      }

      let message = "";
      if (code !== "0") {
        message = `error.msg.${code}`;
      }

      let rawMessage = "";
      if (parts.length > 1) {
        rawMessage = parts[1];
      }

      errorInfo = {
        message: message || rawMessage || `error.msg.unknown`,
        code,
        httpCode: "",
        apiPath: parts[2] || "",
        rawMessage,
      };
    } else {
      errorInfo = {
        message: err.message || err.msg,
      };
    }
  } else {
    errorInfo = {
      message: err.message || err.msg,
    };
  }

  return errorInfo;
}

function buildError(code, message) {
  return {
    message: message || `error.msg.${code}`,
    code,
    httpCode: "",
    apiPath: "",
    rawMessage: "",
  };
}


export {
  crackError,
  buildError,
};