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

const mockdata = {
  "free": [
    {
      "id": "cos.io_2d3533363939393236383535@resource.calendar.google.com",
      "name": "Furan"
    },
    {
      "id": "cos.io_3830313933323932393138@resource.calendar.google.com",
      "name": "Aberto",
      "until": "2017-09-19T22:00:00Z"
    },
    {
      "id": "cos.io_2d35303834303832363133@resource.calendar.google.com",
      "name": "Phone Booth 4"
    },
    {
      "id": "cos.io_2d3334323739333033333030@resource.calendar.google.com",
      "name": "Bukas"
    }
  ],
  "busy": [{ name: 'Aperi', 'until': '2017-09-19T21:43:36Z' }]
};

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
