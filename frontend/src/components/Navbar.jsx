import React from "react";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="logo">QRClass</div>
      <ul className="nav-links">
        <li><a href="#features">Features</a></li>
        <li><a href="#about">About</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </nav>
  );
}