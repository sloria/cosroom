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

const images = {
  Aberto: '/static/images/aberto.jpg',
  Bukas: '/static/images/bukas.jpg',
  Offnen: '/static/images/offnen.jpg',
  Aperi: '/static/images/aperi.jpg',
  Furan: '/static/images/furan.jpg',
}

function Room(data) {
  this.createURL = data.create_url;
  this.name = data.name;
  this.id = data.id;
  this.until = data.until;
  this.image = images[data.name];
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
      loaded: false,
      lastUpdated: null,
    },
    mounted() {
      this.update();
    },
    computed: {
      featuredStyle: function() {
        return {
          width: '797px',
          height: '448px',
          'background-image':'url("' + this.featured.image + '")',
        }
      }
    },
    methods: {
      distance: dateFns.distanceInWordsToNow,
      update: function() {
        fetchJSON('/api/', { credentials: 'include' })
          .then((json) => {
            if (json.free.length) {
              // Choose a random room that is not a phone booth
              this.featured = new Room(randomChoice(
                json.free.filter((each) => !each.name.startsWith('Phone Booth'))
              ));
            }
            this.free = json.free.map((each) => new Room(each));
            this.busy = json.busy.map((each) => new Room(each));
            this.lastUpdated = new Date();
            this.loaded = true;
          });
      }
    },
  });
});
