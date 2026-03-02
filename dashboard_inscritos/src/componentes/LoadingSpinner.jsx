import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ message = "Cargando datos..." }) => {
    return (
        <div className="loading-spinner-container">
            <div className="loading-spinner-content">
                <div className="spinner-wrapper">
                    <div className="spinner"></div>
                    <div className="spinner-inner"></div>
                </div>
                <p className="loading-message">{message}</p>
                <div className="loading-dots">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                </div>
            </div>
        </div>
    );
};

export default LoadingSpinner;
