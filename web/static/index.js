function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }
  const error = new Error(response.statusText);
  error.response = response;
  throw error;
}
function parseJSON(response) {
  return response.json();
}
function fetchJSON(...args) {
  return fetch(...args).then(checkStatus).then(parseJSON);
}

document.addEventListener('DOMContentLoaded', () => {
  new Vue({
    el: '#app',
    data: {
      free: [],
      busy: [],
    },
    mounted() {
      fetchJSON('/api/', { credentials: 'include' })
        .then((json) => {
          Object.assign(this, json);
        });
    },
    methods: {
      distance: dateFns.distanceInWordsToNow,
    },
  });
});
