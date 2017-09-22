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

function Room(data) {
  this.createURL = data.create_url;
  this.name = data.name;
  this.id = data.id;
  this.until = data.until;
  // TODO: image
}

function randomChoice(ary) {
  return ary[Math.floor(Math.random() * ary.length)];
}

document.addEventListener('DOMContentLoaded', () => {
  new Vue({
    el: '#app',
    data: {
      free: [],
      busy: [],
      featured: null,
    },
    mounted() {
      fetchJSON('/api/', { credentials: 'include' })
        .then((json) => {
          if (json.free.length) {
            // Choose a random room that is not a phone booth
            this.featured = new Room(randomChoice(
              json.free.filter((each) => !each.name.startsWith('Phone Booth'))
            ));
          }
          // More free rooms
          const moreFree = this.featured ? json.free.filter((each) => each.name !== this.featured.name) : json.free;
          this.free = moreFree.map((each) => new Room(each));
          this.busy = json.busy.map((each) => new Room(each));
        });
    },
    methods: {
      distance: dateFns.distanceInWordsToNow,
    },
  });
});
