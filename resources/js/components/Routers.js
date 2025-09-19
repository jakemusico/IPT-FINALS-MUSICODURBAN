import React from 'react';
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Example from "./Example";
import Home from './Home';
import ProfileManager from './ProfileManager';

export default function Routers() {
  return (
    <Router>
        <Routes>
            <Route path="/" element={<ProfileManager/>} />
            <Route path="/home" element={<Home/>} />
            <Route path="/example" element={<Example/>} />
        </Routes>
    </Router>
  )
}

if(document.getElementById("root")) {
    ReactDOM.render(<Routers />, document.getElementById("root"));
}