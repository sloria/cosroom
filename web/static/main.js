import React from 'react';
import { render } from 'react-dom';
import distanceInWordsToNow from 'date-fns/distance_in_words_to_now';
import {
  createSkeletonProvider,
  createSkeletonElement,
} from '@trainline/react-skeletor';
import microfeedback from 'microfeedback-button';

import fetchJSON from './fetch-json';

const MICROFEEDBACK_URL = 'https://cosroom-microfeedback.now.sh/';
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

const randomChoice = ary => ary[Math.floor(Math.random() * ary.length)];

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
          <li>
            <a className="btn" href="/logout">
              Log out
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}

function FeaturedRoom({ room, loaded, free }) {
  const style = {
    width: '700px',
    height: '393px',
  };
  if (loaded && room.image) {
    style.backgroundImage = `url("${room.image}")`;
  }
  return (
    <div>
      <H2 className="featured-alt visible-sm">
        {room.name} is available
        {room.until ? <span> for {distanceInWordsToNow(room.until)}</span> : ''}
      </H2>
      <DIV className="featured-image hidden-sm" style={style}>
        <H2 className="featured">
          {room.name} {free ? 'is available' : 'will be available'}
          {room.until ? (
            <span>
              {' '}
              {free ? 'for' : 'in'} {distanceInWordsToNow(room.until)}
            </span>
          ) : (
            ''
          )}
        </H2>
      </DIV>
      <div>
        <A className="btn" href={room.createURL} title={`Reserve ${room.name}`}>
          Reserve {free ? 'now' : 'next opening'}
        </A>
      </div>
    </div>
  );
}

function BusyList({ rooms, onClickRoom }) {
  const roomsElem = rooms.length
    ? rooms.map(room => {
        const roomName =
          room.name in images ? (
            <a
              className="room-name"
              onClick={onClickRoom.bind(this, room, false)}
            >
              {room.name}
            </a>
          ) : (
            room.name
          );
        return (
          <li key={room.name}>
            <STRONG>{roomName}</STRONG>
            {room.until ? (
              <SPAN> (available in {distanceInWordsToNow(room.until)})</SPAN>
            ) : (
              ''
            )}
            <A
              className="btn btn-room-list"
              href={room.createURL}
              title={`Reserve ${room.name}`}
            >
              Reserve next opening
            </A>
          </li>
        );
      })
    : '';
  return (
    <div>
      {rooms.length ? <P>The following rooms are not yet available:</P> : ''}
      {rooms.length ? <ul className="room-list">{roomsElem}</ul> : ''}
    </div>
  );
}

function FreeList({ rooms, onClickRoom }) {
  const roomsElem = rooms.length
    ? rooms.map(room => {
        const roomName =
          room.name in images ? (
            <a
              className="room-name"
              onClick={onClickRoom.bind(this, room, true)}
            >
              {room.name}
            </a>
          ) : (
            room.name
          );
        return (
          <li key={room.name}>
            <STRONG>{roomName}</STRONG>
            {room.until ? (
              <SPAN> is available for {distanceInWordsToNow(room.until)}</SPAN>
            ) : (
              ''
            )}
            <A
              className="btn btn-room-list"
              href={room.createURL}
              title={`Reserve ${room.name}`}
            >
              Reserve now
            </A>
          </li>
        );
      })
    : '';
  return (
    <div>
      {rooms.length ? <P>The following rooms are available now:</P> : ''}
      {rooms.length ? <ul className="room-list">{roomsElem}</ul> : ''}
    </div>
  );
}

function NextEvent({ nextEvent }) {
  return nextEvent ? (
    <DIV className="NextEvent">
      <p>
        Your next meeting is in {distanceInWordsToNow(nextEvent.start.dateTime) + ' '}
        (<a href={nextEvent.htmlLink}>{nextEvent.summary}</a>)
        {nextEvent.location ? ` in ${nextEvent.location}` : ''}
      </p>
    </DIV>
  ) : '';
}

function App({
  free,
  busy,
  nextEvent,
  lastUpdated,
  onUpdate,
  loaded,
  onClickRoom,
  selectedRoom,
  selectedRoomFree,
}) {
  return (
    <div>
      <Header />
      <div className="content">
        <NextEvent nextEvent={nextEvent} />
        {selectedRoom ? (
          <FeaturedRoom
            loaded={loaded}
            room={selectedRoom}
            free={selectedRoomFree}
          />
        ) : (
          ''
        )}
        {free.length ? (
          <FreeList
            selectedRoom={selectedRoom}
            loaded={loaded}
            rooms={free}
            onClickRoom={onClickRoom}
          />
        ) : (
          ''
        )}
        {busy.length ? (
          <BusyList loaded={loaded} rooms={busy} onClickRoom={onClickRoom} />
        ) : (
          ''
        )}
        <div>
          <a
            rel="noopener noreferrer"
            target="_blank"
            href="https://gist.github.com/sloria/12f7e0dfc6e5d1c6c480bbe5f1f3cb15"
          >
            Add more rooms
          </a>
        </div>
        {lastUpdated ? (
          <small>
            Last updated {lastUpdated.toLocaleString()}
            {'  '}
            <a className="btn" onClick={onUpdate}>
              Update
            </a>
          </small>
        ) : (
          ''
        )}
      </div>
    </div>
  );
}

const createDummyRoom = name =>
  new Room({
    name: name,
    until: new Date().toISOString(),
  });

const dummyData = {
  free: [createDummyRoom('1___'), createDummyRoom('2___')],
  busy: [createDummyRoom('3____'), createDummyRoom('4____')],
  nextEvent: {
    summary: 'abcdefg',
    start: { dateTime: new Date().toISOString() },
  },
  selectedRoom: createDummyRoom('5___'),
};

const WrappedApp = createSkeletonProvider(
  props => (props.free.length || props.busy.length ? props : dummyData),
  // Whether to show skeleton screen
  props => !props.loaded,
  // (props) => true,
  // CSS class to apply when loading
  () => 'loading-skeleton',
)(App);

function selectFeatured(free, busy) {
  // Choose a random room that is not a phone booth
  const mainFreeRooms = free.filter(rm => !rm.name.startsWith('Phone Booth'));
  const mainBusyRooms = busy.filter(rm => !rm.name.startsWith('Phone Booth'));
  let featured = null;
  let isFree = false;
  if (mainFreeRooms.length) {
    featured = randomChoice(mainFreeRooms);
    isFree = true;
  } else if (mainBusyRooms.length) {
    featured = randomChoice(mainBusyRooms);
    isFree = false;
  }
  return { room: featured, isFree };
}

class StatefulApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      free: [],
      busy: [],
      loaded: true,
      lastUpdated: null,
      selectedRoom: null,
    };
    this.handleUpdate = this.handleUpdate.bind(this);
    this.handleClickRoom = this.handleClickRoom.bind(this);
  }
  update() {
    this.setState({ loaded: false });
    fetchJSON('/api/', { credentials: 'include' }).then(json => {
      const free = json.free.map(each => new Room(each));
      const busy = json.busy.map(each => new Room(each));
      const nextEvent = json.next_event;
      const { room, isFree } = selectFeatured(free, busy);
      this.setState({
        free,
        busy,
        nextEvent,
        lastUpdated: new Date(),
        loaded: true,
        selectedRoom: room,
        selectedRoomFree: isFree,
      });
    });
  }
  componentDidMount() {
    this.update();
  }
  handleClickRoom(room, isFree) {
    this.setState({ selectedRoom: room, selectedRoomFree: isFree });
  }
  handleUpdate() {
    this.update();
  }
  render() {
    return (
      <WrappedApp
        {...this.state}
        onClickRoom={this.handleClickRoom}
        onUpdate={this.handleUpdate}
      />
    );
  }
}

document.addEventListener('DOMContentLoaded', () => {
  microfeedback({
    url: MICROFEEDBACK_URL,
    onSubmit: () => {
      // TODO: Improve this feedback
      alert('Thanks for the feedback! A GitHub issue will be posted on the sloria/cosroom Issue Tracker.');
    }
  });
  render(<StatefulApp />, document.getElementById('app'));
});
