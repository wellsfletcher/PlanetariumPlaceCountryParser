import React from 'react';
// import ReactDOM from 'react-dom';
import { useState } from 'react';

import { countries } from '../assets/countries';
import { states } from '../assets/states';
import Table from './Table';

// npm i @turf/turf
import * as turf from '@turf/turf';

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

var isFloat = function(n) {
    return isNumber(n) && parseInt(n) !== n; // parseInt may not work the way I think idk
    // return isNumber(n) && parseInt("" + n) !== "" + n;
};

// BRK_GROUP is an all null column
const keysToRemove = ["BRK_GROUP", "FCLASS_TLC", "TLC_DIFF", "FCLASS_US", "FCLASS_FR", "FCLASS_RU", "FCLASS_ES", "FCLASS_CN", "FCLASS_TW", "FCLASS_IN", "FCLASS_NP", "FCLASS_PK", "FCLASS_DE", "FCLASS_GB", "FCLASS_BR", "FCLASS_IL", "FCLASS_PS", "FCLASS_SA", "FCLASS_EG", "FCLASS_MA", "FCLASS_PT", "FCLASS_AR", "FCLASS_JP", "FCLASS_KO", "FCLASS_VN", "FCLASS_TR", "FCLASS_ID", "FCLASS_PL", "FCLASS_GR", "FCLASS_IT", "FCLASS_NL", "FCLASS_SE", "FCLASS_BD", "FCLASS_UA"];

const getKeys = function(data) {
    return Object.keys(data[0]);
}

function json2array(json) {
    // this works but I think I'd like to transpose it (for view purposes at least)
    var result = [];
    var keys = Object.keys(json);
    keys.forEach(function(key){
        result.push({property: key, ...json[key]});
    });
    return result;
}

const parseNaturalEarthGeojson = (json) => {
    return 0;
}

const getPropertyInfos = (countryProps) => { // propertyDescriptions
    // the best way to do this is probably to iterate through each cell and update our understanding of the column as we go
    // this is kinda of weird to thing about though because it is technically not a table, it is json object
    // structure it like this
    /*
[
    columnName {
        type: "int", // I thing I'm just gonna store them as int or string
        max: 3, // int
        // size: 3, // int (same as maxAmount, unless I want to add some wiggle room)
        canBeNull: true
    }
]
    */

    // first extract the headers (columnNames)
    var columnNames = getKeys(countryProps);
    var columnMaxes;
    var columnSizes;
    var columnCanNull;

    // initialize property types table
    var propertyInfos = {};
    columnNames.forEach((item, index, arr) => {
        const property = item;
        propertyInfos[property] = {
            isNumber: true,
            isFloat: true,
            isArray: true,
            isObject: true,
            max: 0,
            canBeNull: false,
            isAllNull: true // has duplicates
        }
    });


    // determine the property type by iterating through the first row
    // (will then have to do something special in order to account for null columns)

    // determine the sizes of the properties data values
    // do this by counting the number of characters in each table column
    // var propertyMaxes = [];
    countryProps.forEach((countryInfo) => {
        // delete datum.properties[item];
        columnNames.forEach((propertyName) => {
            var propertyValue = countryInfo[propertyName]; // should be a string or integer
            var currentPropertyInfoValue = propertyInfos[propertyName]; // // mapping from propertyDescriptor to value // {isNumber: false, max: 0, canBeNull: false}
            var isNull = propertyValue === undefined || propertyValue === null;
            // this obviously fails if all the columns are null, but that is a stupid edge case
            // only fails in the sense that if all the columns are null it will think it's suppose to be a number
            var mightBeNum = isNull || isNumber(propertyValue); // need to also consider if it's null
            var isNum = currentPropertyInfoValue["isNumber"] && mightBeNum;
            var mightBeFloat = isNull || isFloat(propertyValue); // could be optimized perhaps // true if contains period and is a number
            var mightBeArray = isNull || isArray(propertyValue);
            var mightBeObject = isNull || isObject(propertyValue);
            var propertyLength = JSON.stringify(propertyValue).length;
            var updatedPropertyInfoValue = {
                isNumber: isNum, // currentPropertyInfoValue["isNumber"] && mightBeNum,
                isFloat: currentPropertyInfoValue["isFloat"] && mightBeFloat, // isFloat: isNum && (isFloat || containsPeriod),
                isArray: currentPropertyInfoValue["isArray"] && mightBeArray,
                isObject: currentPropertyInfoValue["isObject"] && mightBeObject,
                max: Math.max(currentPropertyInfoValue["max"], propertyLength),
                canBeNull: currentPropertyInfoValue["canBeNull"] || isNull,
                isAllNull: currentPropertyInfoValue["isAllNull"] && isNull
            };
            propertyInfos[propertyName] = updatedPropertyInfoValue;
        });
    });

    // also determine whether or not the column can be null or not
    return propertyInfos;
}

function withLn(str) {
    return str + "\n";
}

function withParens(str) {
    return "(" + str + ")";
}
function withQuotes(str) {
    return "\"" + str + "\"";
}
function removeSurroundingQuotes() {

}

function withSemicolon(str) {
    return str + ";";
}
function withLnSemicolon(str) {
    return withLn(str + ";");
}
function getAttributeDescription(name, type, size, canBeNull, isPrimaryKey) {
    var result = "";
    name = name.toLowerCase();

    result += name + " " + type;
    if (size >= 0) {
        result += withParens(size);
    }
    if (!canBeNull) {
        result += " NOT NULL";
    }
    if (isPrimaryKey) {
        result += " PRIMARY KEY";
    }

    return result;
}

const generateSql = (countryInfos, propertyInfos, tableName) => {
    var result = "";
    const TABLE_NAME = tableName; // "country";
    const DATABASE_NAME = "PlaceDB";
    const INDENT_CHAR = "\t";


    var attributeNames = getKeys(countryInfos); // .map(function(x){ return x.toUpperCase(); })
    var attributesCSV = attributeNames.join(", ").toLowerCase();
    // iterate through each property and create their declaration
    var attributeDescriptionsCSV;
    var attributeDescriptions = [];
    attributeNames.forEach((propertyName) => {
        var propertyInfo = propertyInfos[propertyName];
        const {isNumber, isFloat, isArray, isObject, max, canBeNull, isAllNull} = propertyInfo;
        var name = propertyName;
        var type = "VARCHAR";
        if (isFloat) {
            type = "FLOAT";
        } else if (isNumber) {
            type = "INTEGER";
        } else if (isArray || isObject) {
            type = "TEXT";
        }
        var size = max;
        if (isNumber) {
            size = -1;
        } else if (isArray || isObject) { // these are hardcoded lol
            size = 161550;
        } else {
            size = 129;
        }
        // var canBeNull;
        var isPrimaryKey = false; // the user can just add this lol
        if (propertyName == "NAME_LONG") {
            isPrimaryKey = true;
        }
        var attributeDescription = getAttributeDescription(name, type, size, canBeNull, isPrimaryKey);
        attributeDescriptions.push(attributeDescription);
    });
    attributeDescriptionsCSV = attributeDescriptions.join(",\n" + INDENT_CHAR);

    // iterate through each country and create a list of their properties' values
    var valuesCSV;
    var valuesStrings = [];
    countryInfos.forEach((countryInfo) => {
        // delete datum.properties[item];
        var propertyValues = [];
        attributeNames.forEach((propertyName) => {
            var propertyValue = countryInfo[propertyName]; // should be a string or integer
            var propertyInfo = propertyInfos[propertyName];
            const {isNumber, isFloat, isArray, isObject, max, canBeNull, isAllNull} = propertyInfo;
            var isNull = propertyValue === undefined || propertyValue === null;

            var valueStr;
            if (isNumber) {
                valueStr = "" + propertyValue;
            } else if (isNull) {
                valueStr = "NULL";
            } else if (isArray || isObject) {
                valueStr = withQuotes(JSON.stringify(propertyValue));
            } else {
                valueStr = JSON.stringify(propertyValue);
            }

            propertyValues.push(valueStr);
        });
        var propertyValuesCSV = propertyValues.join(", ");
        valuesStrings.push(withParens(propertyValuesCSV));
    });
    valuesCSV = valuesStrings.join(",\n" + INDENT_CHAR);

    var useDatabaseCommand = withLnSemicolon("use " + DATABASE_NAME);
    result += withLn(useDatabaseCommand);

    var dropTableCommand = withLnSemicolon("DROP TABLE IF EXISTS " + TABLE_NAME);
    result += dropTableCommand;

    // table declaration part
    var tableDeclarationCommand;
    // var attributeDescriptionsCSV = "";
    var createTableExpression = "CREATE TABLE " + TABLE_NAME + withParens("\n" + INDENT_CHAR + attributeDescriptionsCSV + "\n");

    tableDeclarationCommand = withLnSemicolon(createTableExpression);
    result += tableDeclarationCommand;

    // table initialization part
    var tableInsertionCommand;
    // var attributesCSV = "";
    var insertIntoExpression = "INSERT INTO " + TABLE_NAME + withParens(attributesCSV);
    var valuesExpression = "VALUES\n" + INDENT_CHAR;
    // var valuesCSV = "";
    valuesExpression += valuesCSV;

    tableInsertionCommand = withLnSemicolon(insertIntoExpression + " " + valuesExpression);
    result += tableInsertionCommand;

    var selectCommand = withLnSemicolon("select * from " + TABLE_NAME);
    result += selectCommand;

    return result;
}

function getFlattenedGeojson(data) {
    var countries = data.features;
    // console.log(countries);

    // should probably remove columns that are all null as well here
    var countryInfos = countries.map((datum, idx) => {
        keysToRemove.forEach((item, index, arr) => {
            delete datum.properties[item];
        });
        // delete datum.properties['FCLASS_TLC'];

        var polygon;
        var geometryType = datum.geometry.type.toLowerCase();
        if (geometryType == "polygon") {
            polygon = turf.polygon(datum.geometry.coordinates);
        } else if (geometryType == "multipolygon") {
            polygon = turf.multiPolygon(datum.geometry.coordinates);
        } else {
            console.log("Error: Non polygon-like geometry type");
        }
        var area = turf.area(polygon) / 1000000; // convert to square kilometers
        area = Math.round(area * 100) / 100; // adjust the precision
        // console.log(polygon);
        // console.log("area = ");
        // console.log(area);

        return {...datum.properties,
            "bbox": datum.bbox,
            "area": area,
            "geometry_type": datum.geometry.type,
            "geometry_coordinates": datum.geometry.coordinates
        };
    });

    return countryInfos;
}

function geojson2sql(data, tableName) {
    /*
    var polygon = turf.polygon([[[125, -15], [113, -22], [154, -27], [144, -15], [125, -15]]]);
    var area = turf.area(polygon);
    console.log("area = ");
    console.log(area);
    */

    var countryProps = getFlattenedGeojson(data);

    var propertyInfos = getPropertyInfos(countryProps);
    // console.log(propertyTypes);

    var sqlString = generateSql(countryProps, propertyInfos, tableName);
    // console.log(sqlString);

    return {rows: countryProps, attribute2datatype: propertyInfos, sql: sqlString};
}

const ParserPage = (props) => {

    // const {countryProps, propertyInfos, sqlString} = parseGeojson(states);
    // const state = geojson2sql(states, "state");
    // const country = geojson2sql(states, "state");
    const country = geojson2sql(countries, "country");


    return (
        <>
            <pre>
                {country.sql}
            </pre>
            <Table data={json2array(country.attribute2datatype)}/>
            <Table data={country.rows}/>
        </>
    );
};

export default ParserPage;
