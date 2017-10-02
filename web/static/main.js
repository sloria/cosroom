import React from 'react';
import { render } from 'react-dom';
import distanceInWordsToNow from 'date-fns/distance_in_words_to_now';
import { createSkeletonProvider, createSkeletonElement } from '@trainline/react-skeletor';

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

const STRONG = createSkeletonElement('strong');
const A = createSkeletonElement('a');
const P = createSkeletonElement('p');
const SPAN = createSkeletonElement('span');
const DIV = createSkeletonElement('div');
const H2 = createSkeletonElement('h2');

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

function FeaturedRoom({ room }) {
  const style = {
    width: '700px',
    height: '393px',
  };
  if (room.image) {
    style.backgroundImage = `url("${room.image}")`;
  }
  return (
    <div>
      <H2 className="featured-alt visible-sm">{ room.name } is available
        {room.until ? <span> for { distanceInWordsToNow(room.until) }</span> : ''}
      </H2>
      <DIV className="featured-image hidden-sm" style={style}>
        <H2 className="featured">{ room.name } is available
        {room.until ? <span> for { distanceInWordsToNow(room.until) }</span> : ''}
        </H2>
      </DIV>
      <div>
        <A className="btn" href={room.createURL} title={`Reserve ${room.name}`}>Reserve now</A>
      </div>
    </div>
  );
}

function BusyList({ rooms }) {
  const roomsElem = rooms.length ? (
    rooms.map((room) => {
      return (
        <li key={room.name}>
          <STRONG>{ room.name }</STRONG>
          {room.until ? <SPAN> (available in { distanceInWordsToNow(room.until) })</SPAN> : ''}
          <A className="btn btn-room-list" href={room.createURL} title={`Reserve ${room.name}`}>Reserve next opening</A>
        </li>
      )
    })
  ) : '';
  return (
    <div>
      { rooms.length ?  <P>The following rooms are not yet available:</P> : '' }
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
          <STRONG>{ room.name }</STRONG>
          {room.until ? <SPAN> is available for { distanceInWordsToNow(room.until) }</SPAN> : ''}
          <A className="btn btn-room-list" href={room.createURL} title={`Reserve ${room.name}`}>Reserve now</A>
        </li>
      )
    })
  ) : '';
  return (
    <div>
      {featured ? <FeaturedRoom room={featured} /> : ''}
      { rooms.length ?  <P>The following rooms are available now:</P> : '' }
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

function App({ free, busy, lastUpdated }) {
    return (
      <div>
        <Header />
        <div className="content">
          {free.length ? <FreeList rooms={free} /> : ''}
          {busy.length ? <BusyList rooms={busy} /> : ''}
          <div>
            <A rel="noopener noreferrer" target="_blank" href="https://gist.github.com/sloria/12f7e0dfc6e5d1c6c480bbe5f1f3cb15">Add more rooms</A>
          </div>
          {lastUpdated ? <small>Last updated {lastUpdated.toLocaleString()}</small> : ''}
        </div>
      </div>
    );
}

const createDummyRoom = (name) => new Room({
  name: name,
  until: new Date().toISOString(),
});


const dummyData = {
    free: [createDummyRoom('1___'), createDummyRoom('2___')],
    busy: [createDummyRoom('3____'), createDummyRoom('4____')],
};

const WrappedApp = createSkeletonProvider(
  dummyData,
  // Whether to show skeleton screen
  (props) => !props.loaded,
  // CSS class to apply when loading
  () => 'loading-skeleton',
)(App);

class StatefulApp extends React.Component {
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
    return <WrappedApp {...this.state} />;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  render(<StatefulApp/>, document.getElementById('app'));
});
