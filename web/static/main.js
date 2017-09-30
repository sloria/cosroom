import React from 'react';
import { render } from 'react-dom';
import distanceInWordsToNow from 'date-fns/distance_in_words_to_now';

import fetchJSON from './fetch-json';

const images = {
  Aberto: '/static/images/aberto.jpg',
  Bukas: '/static/images/bukas.jpg',
  Offnen: '/static/images/offnen.jpg',
  Aperi: '/static/images/aperi.jpg',
  Furan: '/static/images/furan.jpg',
};

function Room(data) {
  this.createURL = data.create_url;
  this.name = data.name;
  this.id = data.id;
  this.until = data.until;
  this.image = images[data.name];
}

const randomChoice = (ary) => ary[Math.floor(Math.random() * ary.length)];

function Header() {
  return (
    <header>
      <nav>
        <ul>
          <li><a className="btn" href="/logout">Log out</a></li>
        </ul>
      </nav>
    </header>
  );
}

function Loader() {
  return <div> Finding a room...</div>;
}


function FeaturedRoom({ room }) {
  const style = {
    width: '700px',
    height: '393px',
    backgroundImage: `url("${room.image}")`,
  };
  return (
    <div>
      <h2 className="featured-alt visible-sm">{ room.name } is available
        {room.until ? <span> for { distanceInWordsToNow(room.until) }</span> : ''}
      </h2>
      <div className="featured-image hidden-sm" style={style}>
        <h2 className="featured">{ room.name } is available
        {room.until ? <span> for { distanceInWordsToNow(room.until) }</span> : ''}
        </h2>
      </div>
      {room.createURL ?
        <div>
          <a className="btn" href={room.createURL} title={`Reserve ${room.name}`}>Reserve now</a>
        </div>
        : ''
      }
    </div>
  );
}

function BusyList({ rooms }) {
  const roomsElem = rooms.length ? (
    rooms.map((room) => {
      return (
        <li key={room.name}>
          <strong>{ room.name }</strong>
          {room.until ? <span> (available in { distanceInWordsToNow(room.until) })</span> : ''}
          <a className="btn btn-room-list" href={room.createURL} title={`Reserve ${room.name}`}>Reserve next opening</a>
        </li>
      )
    })
  ) : '';
  return (
    <div>
      { rooms.length ?  <p>The following rooms are not yet available:</p> : '' }
      {
        rooms.length ?
        <ul className="room-list">
          {roomsElem}
        </ul>
        : ''
      }
    </div>
  );
}

function FreeList({ rooms }) {
  const mainRooms = rooms.filter(each => !each.name.startsWith('Phone Booth'));
  let featured = null;
  if (mainRooms.length) {
    // Choose a random room that is not a phone booth
    featured = randomChoice(mainRooms);
  }
  const roomsElem = rooms.length ? (
    rooms.map((room) => {
      return (
        <li key={room.name}>
          <strong>{ room.name }</strong>
          {room.until ? <span> is available for { distanceInWordsToNow(room.until) }</span> : ''}
          <a className="btn btn-room-list" href={room.createURL} title={`Reserve ${room.name}`}>Reserve now</a>
        </li>
      )
    })
  ) : '';
  return (
    <div>
      {featured ? <FeaturedRoom room={featured} /> : ''}
      { rooms.length ?  <p>The following rooms are available now:</p> : '' }
      {
        rooms.length ?
        <ul className="room-list">
          {roomsElem}
        </ul>
        : ''
      }
    </div>
  );
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      free: [],
      busy: [],
      loaded: false,
      lastUpdated: null,
    };
  }
  componentDidMount() {
    fetchJSON('/api/', { credentials: 'include' })
      .then((json) => {
        this.setState({
          free: json.free.map(each => new Room(each)),
          busy: json.busy.map(each => new Room(each)),
          lastUpdated: new Date(),
          loaded: true,
        });
      });
  }
  render() {
    const { loaded, free, busy, lastUpdated } = this.state;
    return (
      <div>
        <Header />
        <div className="content">
          {loaded || <Loader />}
          {free.length ? <FreeList rooms={free} /> : ''}
          {busy.length ? <BusyList rooms={busy} /> : ''}
          {loaded ?
              <div>
                <a rel="noopener noreferrer" target="_blank" href="https://gist.github.com/sloria/12f7e0dfc6e5d1c6c480bbe5f1f3cb15">Add more rooms</a>
              </div>
          : ''}
          {lastUpdated ? <small>Last updated {lastUpdated.toLocaleString()}</small> : ''}
        </div>
      </div>
    );
  }
}

document.addEventListener('DOMContentLoaded', () => {
  render(<App/>, document.getElementById('app'));
});
