import React from 'react';
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Example from "./Example";
import Home from './Home';
import StudentsManager from './StudentsManager';
import Reports from './Reports';
import DashboardLayout from './DashboardLayout';
import FacultyManager from './FacultyManager';
import DepartmentManager from './DepartmentManager';
import DepartmentDetail from './DepartmentDetail';
import CourseDetails from './CourseDetails';
import Settings from './Settings';
import MyProfile from './MyProfile';
import Login from './Login';

// Simple Error Boundary to catch render errors and show a helpful message
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null, info: null }
  }

  componentDidCatch(error, info) {
    console.error('Uncaught render error:', error, info)
    this.setState({ error, info })
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
          <h2 style={{ color: '#b00020' }}>Application error</h2>
          <div style={{ marginTop: 12, color: '#333' }}>
            <div><strong>Error:</strong> {this.state.error && this.state.error.toString()}</div>
            <details style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>
              {this.state.info && this.state.info.componentStack}
            </details>
            <div style={{ marginTop: 12 }}>
              Try opening your browser console for the full stack trace. If you paste the error here I can fix it.
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default function Routers() {
  return (
  <Router>
    <ErrorBoundary>
    <Routes>
      <Route path="/login" element={<Login/>} />
      <Route path="/" element={<DashboardLayout/>}>
                <Route index element={<Home/>} />
                <Route path="students" element={<StudentsManager/>} />
                <Route path="faculty" element={<FacultyManager/>} />
                <Route path="department" element={<DepartmentManager/>} />
                <Route path="department/:id" element={<DepartmentDetail/>} />
                <Route path="courses/details/:id" element={<CourseDetails/>} />
                <Route path="reports" element={<Reports/>} />
                <Route path="settings" element={<Settings/>} />
                <Route path="profile" element={<MyProfile/>} />
                <Route path="example" element={<Example/>} />
      </Route>
    </Routes>
  </ErrorBoundary>
  </Router>
  )
}

if(document.getElementById("root")) {
    ReactDOM.render(<Routers />, document.getElementById("root"));
}