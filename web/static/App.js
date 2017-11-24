import React from 'react';
import distanceInWordsToNow from 'date-fns/distance_in_words_to_now';
import addMinutes from 'date-fns/add_minutes';
import {
  createSkeletonProvider,
  createSkeletonElement,
} from '@trainline/react-skeletor';
import NProgress from 'nprogress';
import microfeedback from 'microfeedback-button';

import { randomChoice } from './utils';
import fetchJSON from './fetch-json';

const MICROFEEDBACK_URL = 'https://microfeedback-github.now.sh/sloria/cosroom';
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


const STRONG = createSkeletonElement('strong');
const A = createSkeletonElement('a');
const P = createSkeletonElement('p');
const SPAN = createSkeletonElement('span');
const DIV = createSkeletonElement('div');
const H2 = createSkeletonElement('h2');
const LI = createSkeletonElement('li');

function Header({ email }) {
  return (
    <header>
      <nav>
        <ul>
          <li>
            <a className="btn" href="/logout">
              Log out
            </a>
          </li>
          <LI>{email}</LI>
          <li className="brand">
            <a href="/">
              COS Room Finder
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
  const locations = nextEvent && nextEvent.location ? nextEvent.location.split(',') : [];
  const linkifiedLocations = locations.map((each, i) => {
    const location = each.trim();
    const isLast = i === (locations.length - 1);
    return location.startsWith('http') ?
      <span><a href={location}>{location}</a>{ !isLast ? ', ' : '' }</span> : location + (!isLast ? ', ' : '');
  });
  return nextEvent ? (
    <DIV className="NextEvent">
      <p>
        Your next meeting is in <strong>{distanceInWordsToNow(nextEvent.start.dateTime) + ' '}</strong>
        (<a href={nextEvent.htmlLink}>{nextEvent.summary}</a>)
        {nextEvent.location ? <span> in <strong>{linkifiedLocations}</strong></span> : ''}
      </p>
    </DIV>
  ) : '';
}


const Error = () => (
  <div>
    An unexpected error occurred. Go bug Steve about it.
  </div>
)

export function App({
  free,
  busy,
  nextEvent,
  email,
  lastUpdated,
  onUpdate,
  loaded,
  onClickRoom,
  selectedRoom,
  selectedRoomFree,
  error,
}) {
  if (error) {
    console.error(error);  // eslint-disable-line
    return <Error error={error} />;
  }

  return (
    <div>
      <div className="content">
        <Header email={email} />
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
            href="https://calendar.google.com/calendar/b/1/r/settings/browseresources"
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

export const createDummyRoom = name =>
  new Room({
    name: name,
    until: new Date().toISOString(),
  });

export const dummyData = {
  free: [createDummyRoom('1___'), createDummyRoom('2___')],
  busy: [createDummyRoom('3____'), createDummyRoom('4____')],
  nextEvent: {
    summary: 'abcdefg',
    start: { dateTime: new Date().toISOString() },
  },
  selectedRoom: createDummyRoom('5___'),
  email: 'steve@cos.io',
};

const AppWithSkeletons = createSkeletonProvider(
  props => (props.free.length || props.busy.length ? props : dummyData),
  // Whether to show skeleton screen
  props => !props.loaded,
  // (props) => true,
  // CSS class to apply when loading
  () => 'loading-skeleton',
)(App);

function selectFeatured(free, busy) {
  const fifteenMinFromNow = addMinutes(new Date(), 15);
  // Choose a random room that is not a phone booth
  const mainFreeRooms = free.filter(rm => !rm.name.startsWith('Phone Booth'));
  const mainBusyRooms = busy.filter(rm => !rm.name.startsWith('Phone Booth'));

  const bestFreeRooms = mainFreeRooms.filter(rm => new Date(rm.until) >= fifteenMinFromNow);
  const bestBusyRooms = mainBusyRooms.filter(rm => new Date(rm.until) <= fifteenMinFromNow);

  let featured = null;
  let isFree = false;
  // First try rooms that are free for at least 15 minutes
  if (bestFreeRooms.length) {
    featured = randomChoice(bestFreeRooms);
    isFree = true;
  } else if (mainFreeRooms.length) { // Then try any other free rooms
    featured = randomChoice(mainFreeRooms);
    isFree = true;
  } else if (bestBusyRooms.length) { // then try busy rooms that will be free soon
    featured = randomChoice(bestBusyRooms);
    isFree = false;
  } else if (mainBusyRooms.length) { // then try any other busy rooms
    featured = randomChoice(mainBusyRooms);
    isFree = false;
  }
  return { room: featured, isFree };
}

export default class StatefulApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      free: [],
      busy: [],
      nextEvent: null,
      email: null,
      loaded: true,
      lastUpdated: null,
      selectedRoom: null,
      error: null,
    };
    this.handleUpdate = this.handleUpdate.bind(this);
    this.handleClickRoom = this.handleClickRoom.bind(this);
  }
  update() {
    NProgress.start();
    return fetchJSON('/api/', { credentials: 'include' }).then(json => {
      const free = json.free.map(each => new Room(each));
      const busy = json.busy.map(each => new Room(each));
      const nextEvent = json.next_event;
      const { room, isFree } = selectFeatured(free, busy);
      this.setState({
        free,
        busy,
        nextEvent,
        email: json.email,
        lastUpdated: new Date(),
        loaded: true,
        selectedRoom: room,
        selectedRoomFree: isFree,
        error: null,
      });
      NProgress.done();
    }).catch((error) => {
      const { response } = error;
      NProgress.done();
      // Credentials expired
      if (response.status === 401) {
        // need to re-auth
        window.location.reload(false);
      }
      this.setState({ loaded: true, error });
    });
  }
  componentDidMount() {
    this.setState({ loaded: false });
    this.update().then(() => {
      this.setState({ loaded: true });
    });
    // Force a render every 10 seconds to update relative times
    this.ticker = window.setInterval(this.forceUpdate.bind(this), 10 * 1000);
    // Feedback button
    microfeedback({
      url: MICROFEEDBACK_URL,
      onSubmit: () => {
        // TODO: Improve this feedback
        alert('Thanks for the feedback! An issue will be posted on the sloria/cosroom Issue Tracker on GitHub.');
      },
      placeholder: 'Report a bug, share an idea, or just say thanks',
      help: `
      <small>
        Your feedback will be posted on the <a target="_blank" href="https://github.com/sloria/cosroom/issues">sloria/cosroom Issue Tracker</a>
      </small>`,
    });
  }
  componentWillUnmount() {
    this.ticker && window.clearInterval(this.ticker);
  }
  componentDidUpdate() {
    const { free, busy, nextEvent, error } = this.state;
    // If any of the start times are expired, we need to force a refresh
    const now = new Date();
    const nextEventNeedsUpdate = nextEvent && new Date(nextEvent.start.dateTime) < now;
    const freeRoomsNeedUpdate = free.length && free.filter(room => new Date(room.until) < now).length;
    const busyRoomsNeedUpdate = busy.length && busy.filter(room => new Date(room.until) < now).length;
    if (!error && (nextEventNeedsUpdate || freeRoomsNeedUpdate || busyRoomsNeedUpdate)) {
      this.update();
    }
  }
  handleClickRoom(room, isFree) {
    this.setState({ selectedRoom: room, selectedRoomFree: isFree });
  }
  handleUpdate() {
    this.setState({ loaded: false });
    this.update().then(() => {
      this.setState({ loaded: true });
    });
  }
  render() {
    return (
      <AppWithSkeletons
        {...this.state}
        onClickRoom={this.handleClickRoom}
        onUpdate={this.handleUpdate}
      />
    );
  }
}
