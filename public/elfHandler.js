//import express from 'express'
import {updateDataOnScreen} from './app.js'
import {connectionChange} from './app.js'
import {updateBotSettingsOnScreen} from './app.js'

export default class elfHandler{

    constructor(){
    }

/*async getCurrentPosition(){

    //console.log('Requesting current position');
	console.log('Requesting current balance');

    //const data = 'Requesting current position';
	const data = 'Requesting current balance';
	const options = {
		method:'POST',
		headers:{
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({data}) 
	};
	const response = await fetch('/api', options);
    const a = await response.json();
	console.log('received update, logging...');
	console.log(a);
	//updateDataOnScreen(a);
	return Promise.resolve();
}*/


async getUpdate(endpoint){
	//console.log('trying to get a new update');
	try{
		const response = await fetch(endpoint, {
			method: 'GET',
			headers: {
				"Content-Type": "application/json"
			}
		});
		const a = await response.json();
		connectionChange(1);
		updateDataOnScreen(a);
		
	}catch(e){
		console.log('An error occured in elfHandler getUpdate()');
		console.log('ERROR: '+JSON.stringify(e));
		connectionChange();
		return Promise.reject();
	}
	return Promise.resolve();
}

async getBotSettings(endpoint){
	try{
		const response = await fetch(endpoint, {
			method: 'GET',
			headers: {
				"Content-Type": "application/json"
			}
		});
		const a = await response.json();
		updateBotSettingsOnScreen(a);
	}catch(e){
		console.log('An error occured in elfHandler - getBotSettings');
		console.log('ERROR: '+e);
	}
	return Promise.resolve();
}

debug(input){
	const data = 'debug '+input;
	const options = {
		method:'POST',
		headers:{
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({data}) 
	};
	try{
		console.log('i am in the debug');
		const response = fetch('/api', options); // there is no await because i do not use the response or callback
		const a = response.json();
		return Promise.resolve();
	}catch(e){
		console.log('ERROR: '+e);
		return Promise.resolve();
	}
	//return Promise.resolve();
}

async changeBotSettings(endpoint, botsettings){
	//console.log(' checking botsettings in elfHandler '+JSON.stringify(botsettings));
	console.log(endpoint);

	try{
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(botsettings)
		});
		
		const a = await response.json();
		//console.log('eifijf'+a);
		
	}catch(e){
		console.log('An error occured in elfHandler - changeBotSettings');
		console.log('ERROR: '+e);
	}
	return Promise.resolve();
}

//end of class
}