//import { response } from 'express';

export class FetchWrapper {
    constructor(baseURL) {
        this.baseURL = baseURL;
        console.log('FetchWrapper made');
        console.log(baseURL);
    }

get(endpoint) {
    console.log('hello cunt');
   /*return fetch(this.baseURL + endpoint, {
        method: "get",
        headers: {
            "Content-Type": "application/json"
        }
    }).then(response => response.json());*/
    return 'kaka';
}
post(endpoint, data) {
    return fetch(this.baseURL + endpoint, {
        method: "post",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    }).then(response => response.json());
}
put(endpoint, data) {
    return fetch(this.baseURL + endpoint, {
        method: "put",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    }).then(response => response.json());
}
delete(endpoint, data) {
    return fetch(this.baseURL + endpoint, {
        method: "delete",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    }).then(response => response.json());
}

//end of class
}
