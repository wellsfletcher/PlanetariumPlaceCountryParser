import React from 'react';
// import ReactDOM from 'react-dom';
import { useState } from 'react';
// import './Table.css';

const borderStyle = {
    border: "1px solid black"
};
const paddingStyle = {
    padding: "5px"
};

/*

// format should look like

[
    {‘fruit’: ‘Apple’, ‘cost’: 100},
    {‘fruit’: ‘Orange’, ‘cost’: 50},
    {‘fruit’: ‘Banana’, ‘cost’: 35},
    {‘fruit’: ‘Mango’, ‘cost’: 70},
    {‘fruit’: ‘Pineapple’, ‘cost’: 45},
    {‘fruit’: ‘Papaya’, ‘cost’: 40},
    {‘fruit’: ‘Watermelon’, ‘cost’: 35}
]

// or

[
    {'Name': 'Abc', 'Age': 15, 'Location': 'Bangalore'},
    {'Name': 'Def', 'Age': 43, 'Location': 'Mumbai'},
    {'Name': 'Uff', 'Age': 30, 'Location': 'Chennai'},
    {'Name': 'Ammse', 'Age': 87, 'Location': 'Delhi'},
    {'Name': 'Yysse', 'Age': 28, 'Location': 'Hyderabad'}
]

*/

function isObject(obj) {
    return obj !== undefined && obj !== null && obj.constructor == Object;
}

function isArray(obj) {
    return obj !== undefined && obj !== null && obj.constructor == Array;
}

function isBoolean(obj) {
    return obj !== undefined && obj !== null && obj.constructor == Boolean;
}

function isFunction(obj) {
    return obj !== undefined && obj !== null && obj.constructor == Function;
}

function isNumber(obj) {
    return obj !== undefined && obj !== null && obj.constructor == Number;
}

function isString(obj) {
    return obj !== undefined && obj !== null && obj.constructor == String;
}

export default class Table extends React.Component {

    constructor(props){
        super(props);
        this.getHeader = this.getHeader.bind(this);
        this.getRowsData = this.getRowsData.bind(this);
        this.getKeys = this.getKeys.bind(this);
    }

    getKeys = function(){
        return Object.keys(this.props.data[0]);
    }

    getHeader = function(){
        var keys = this.getKeys();
        return keys.map((key, index) => {
            return <th style={{...borderStyle, ...paddingStyle}} key={key}>{key.toUpperCase()}</th>
        })
    }

    getRowsData = function(){
        var items = this.props.data;
        var keys = this.getKeys();
        //- console.log(keys);
        return items.map((row, index) => {
            return <tr key={index}>
                <RenderRow key={index} data={row} keys={keys}/>
            </tr>
        })
    }

    render() {
        return (
            <div>
                <table style={borderStyle}>
                    <thead>
                        <tr>{this.getHeader()}</tr>
                    </thead>
                    <tbody>
                        {this.getRowsData()}
                    </tbody>
                </table>
            </div>
        );
    }
}

const RenderRow = (props) => {
    return props.keys.map((key, index) => {
        // var value = JSON.stringify(props.data[key]);
        var datum = props.data[key];
        var value = JSON.stringify(props.data[key]);
        // if (isObject(datum)) {
        //     return <td style={{...borderStyle, ...paddingStyle}} key={props.data[key]}>
        //         <Table data={datum} />
        //     </td>;
        // }
        /* else {
            value = JSON.stringify(props.data[key]);
        }*/

        return <td style={{...borderStyle, ...paddingStyle}} key={props.data[key]}>{value}</td>;
    })
}
