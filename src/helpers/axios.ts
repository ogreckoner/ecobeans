import axios from "axios";

// Interceptor to retry failed requests
axios.interceptors.response.use(undefined, err => {
  const { config } = err;
  if (!config || !config.retry) {
    return Promise.reject(err);
  }
  config.retry -= 1;
  const delayRetryRequest = new Promise<void>(resolve => {
    setTimeout(() => {
      console.log("retrying request", config.url);
      resolve();
    }, config.retryDelay || 1000);
  });
  return delayRetryRequest.then(() => axios(config));
});
