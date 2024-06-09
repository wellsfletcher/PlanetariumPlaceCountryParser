import React from 'react';
import ReactDOM from 'react-dom';

import ParserPage from './ParserPage';

export class App extends React.Component {
    render() {
        return (<>
            <h1>Hello there.</h1>
            <ParserPage> </ParserPage>
        </>);
    }
}
