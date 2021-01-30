import React, { Component } from 'react';
import axios from 'axios';

class Stonks extends Component {
    state = {

    }

    componentDidMount () {
        axios.get("http://localhost:4567/").then(response => {
            console.log(response);
        });
    }

    render () {
        return (
            <div className="Stonks">
               <h1>Stonks!</h1>
            </div>
        );
    }
}

export default Stonks;