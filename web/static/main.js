import React from 'react';
import { render } from 'react-dom';
import StatefulApp from './App';

document.addEventListener('DOMContentLoaded', () => {
  render(<StatefulApp />, document.getElementById('app'));
});
