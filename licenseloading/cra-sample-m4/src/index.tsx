import React from 'react';
import ReactDOM from 'react-dom/client';
import LicenseLoader from "./license/LicenseLoader"
import './index.css';

import reportWebVitals from './reportWebVitals';

LicenseLoader().then(({ default: App }) => {
        const root = ReactDOM.createRoot(
            document.getElementById('root') as HTMLElement
        );
        root.render(
            <React.StrictMode>
                <App />
            </React.StrictMode>
        );
        reportWebVitals();
})

