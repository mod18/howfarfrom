import React from 'react';
import './Header.css';

const Header = ({ title }) => {
    return (
        <div className="header-wrapper">
            <header className="header">
                <div className="header-content">
                    <h1>{title}</h1>
                    <nav className="nav-tabs">
                        <a href="http://localhost:5173/">Home</a>
                        <a href="#tab2">About</a>
                        <a href="#tab3">Privacy</a>
                    </nav>
                </div>
            </header>
        </div>
    );
};

export default Header;