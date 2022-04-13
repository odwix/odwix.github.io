// API Reference: https://www.wix.com/velo/reference/api-overview/introduction
// “Hello, World!” Example: https://learn-code.wix.com/en/article/1-hello-world

import {fetch} from 'wix-fetch';
import {extractMenu, getMenuAnnotations} from 'backend/main'
import wixData from 'wix-data';
import wixWindow from 'wix-window';

let g_state = {
	analayzing: false,
	analayzingFailed: false,
	analyzingFailedMsgLine: '',
	fetchingWordsInfo: false,
}

$w.onReady(function () {
	// Write your JavaScript here

	// To select an element by ID use: $w('#elementID')

	// Click 'Preview' to run your code
	setMenuCtrlImage($w('#input1').value);
	setNavigatorConfig();
	updateAllControls();
});

function updateAllControls() {
	let butExtractMenuEnabled = false;
	let inputImageUrlCtrlEnabled = false;
	let msgLine = '';
	if(g_state.analayzing) {
		msgLine = 'Analyzing image, please wait...';
		butExtractMenuEnabled = false;
		inputImageUrlCtrlEnabled = false;
	} else if(g_state.fetchingWordsInfo) {
		msgLine = 'Fetching words info, please wait...';
		butExtractMenuEnabled = false;
		inputImageUrlCtrlEnabled = false;
	} else if (g_state.analayzingFailed) {		
		msgLine = g_state.analyzingFailedMsgLine;
		butExtractMenuEnabled = true;
		inputImageUrlCtrlEnabled = true;
	} else {
		msgLine = '';
		butExtractMenuEnabled = true;
		inputImageUrlCtrlEnabled = true;
	}

	$w("#text1").text = msgLine;

	butExtractMenuEnabled ? $w("#button1").enable() : $w("#button1").disable();
	inputImageUrlCtrlEnabled ? $w("#input1").enable() : $w("#input1").disable();

}

function resetAllControls() {
	g_state = {
		analayzing: false,
		analayzingFailed: false,
		analyzingFailedMsgLine: '',
		fetchingWordsInfo: false,
	}
	updateAllControls();

	clearMenuMarkArea();
	
	clearMenuNavigatorAreasData();	
}

function setNavigatorConfig() {
	let msg = {
		msg: 'setConfig',
		config: {
			drawFullStats: false,
            drawCursorLabels: true,
            drawPartitions: false,
			drawUserSelection: true,
			drawAllAreas: true,
		}
	};
	$w('#html1').postMessage(msg);
}

function setMenuCtrlImage(imgUrl) {
	let fixedImgUrl = imgUrl.indexOf('https://static.wixstatic.com/media/') === 0 ? `${imgUrl}/v1/fit/w_2000,h_2000/img.png` : imgUrl;
	let msg = {
		msg: 'setImage',
		src: fixedImgUrl,
	};	
	$w('#html1').postMessage(msg);
}

function setMenuMarkedArea(x,y,w,h) {
	let msg = {
		msg: 'markArea',
		markArea: {x,y,w,h},
	};
	$w('#html1').postMessage(msg);
}

function clearMenuMarkArea() {
	let msg = {
		msg: 'clearMarkArea',		
	};
	$w('#html1').postMessage(msg);
}

function setMenuNavigatorAreasData(areasData) {
	let msg = {
		msg: 'setAllAreas',
		areasData,
	};
	$w('#html1').postMessage(msg);
}

function clearMenuNavigatorAreasData() {
	let msg = {
		msg: 'clearAllAreas',
	};
	$w('#html1').postMessage(msg);
}

function tryBuildMenuAnnotations(imageUrl) {
	g_state.fetchingWordsInfo = true;
	updateAllControls();

	getMenuAnnotations(imageUrl)
	.then(res => {
		let wordsInfo = res.map((rv, ri) => {
			return rv.paragraphs.map((pv, pi) => {
				return pv.words.map((wv, wi) => {
					return {word: wv.word, poly: wv.poly};
				})
			})
		}).flat(2);
		let msg = {
			msg: 'setWordsInfo',
			wordsInfo,
		}
		$w("#html1").postMessage(msg);
	})
	.finally( () => {
		g_state.fetchingWordsInfo = false;
		updateAllControls();
	});
	
}

/**
*	Adds an event handler that runs when the element is clicked.
	[Read more](https://www.wix.com/corvid/reference/$w.ClickableMixin.html#onClick)
*	 @param {$w.MouseEvent} event
*/
export function button1_click(event) {
	// This function was added from the Properties & Events panel. To learn more, visit http://wix.to/UcBnC-4
	// Add your code for this event here: 
	resetAllControls();	

	let imageUrl = $w('#input1').value;
	if(imageUrl.length < 1) {		
		g_state.analayzing = false;
		g_state.analayzingFailed = true;
		g_state.analyzingFailedMsgLine = 'Invalid image or image url';
		updateAllControls();
		return;
	}		

	g_state.analayzing = true;
	updateAllControls();

	setMenuCtrlImage(imageUrl);

	
	$w('#input1').disable();
	

	extractMenu(imageUrl)
	.then(data => {
		// console.log(data);

		let rows = [];
		let row_id = 0;
		clearMenuNavigatorAreasData();

		if(data.success !== undefined && !data.success && data.errorDescription !== undefined) {
			g_state.analayzing = false;
			g_state.analayzingFailed = true;
			g_state.analyzingFailedMsgLine = data.errorDescription;

			// $w('#table1').rows = [];				
			clearMenuNavigatorAreasData();

			updateAllControls();	
			
			return;
		}
		
		data.groups.map((v,i) => {
			let name = "-";
			let description = "-";
			let price = "-";
			let x = 0;
			let y = 0;
			let w = 0;
			let h = 0;
			let nx = 0;
			let ny = 0;
			v.texts.map((gv, gi) => {
				x = gv.pos.x;
				y = gv.pos.y;
				w = gv.pos.w;
				h = gv.pos.h;
				let text = gv.text;
				let type = gv.type;			
				if( type === 'item_name' || type === 'section_name' ) {
					name = text;
				} else if( type === 'item_description') {
					description = text;
				} else if( type === 'price') {
					price = text;
				} 									
			})

			let item = {
				id: `id_${row_id}`,
				section_name: name,
				item_description: description,
				price: price,
				x, y, w, h,
				nx: parseInt(x/50)*50,
				ny:	parseInt(y/50)*50,
			}

			rows.push(item);
			row_id++;
			
		});
		
		// rows = rows.sort((a,b) => {
			 
		// 	if(a.x < b.x) {
		// 		return 1;
		// 	} else if( a.x > b.x) {
		// 		return -1;
		// 	}
		// 	return 0;
		// })

		rows = rows.sort((a,b) => {
			if(a.ny < b.ny && a.nx < b.nx) {
				return -1;
			} else if(a.ny < b.ny && a.nx > b.nx) {
				return 1; 
			} else if(a.ny > b.ny && a.nx < b.nx) {
				return -1;
			} else if(a.ny < b.ny) {
				return -1;
			} else if( a.ny > b.ny) {
				return 1;
			} 
			return 0;
		})

		//Set the table data:
		// $w('#table1').rows = rows;

		let areasData = rows.map((v,i) => {
			return {id:v.id, x:v.x, y:v.y, w:v.w, h:v.h};
		});
		//console.log(JSON.stringify(areasData));
		setMenuNavigatorAreasData(areasData);


		//console.log(rows);

		g_state.analayzing = false;
		updateAllControls();

		tryBuildMenuAnnotations(imageUrl);

		
	})
	.catch(error => {
		console.log(JSON.stringify(error));
		g_state.analayzing = false;
		g_state.analayzingFailed = true;
		g_state.analyzingFailedMsgLine = JSON.stringify(error);
		
		updateAllControls();
	})
	.finally(() => {
		g_state.analayzing = false;

		$w('#button1').enable();
		
		$w('#input1').enable();
		updateAllControls();
		
	})
}

/**
*	Adds an event handler that runs when an input element's value
 is changed.
	[Read more](https://www.wix.com/corvid/reference/$w.ValueMixin.html#onChange)
*	 @param {$w.Event} event
*/
export function input1_change(event) {
	// This function was added from the Properties & Events panel. To learn more, visit http://wix.to/UcBnC-4
	// Add your code for this event here: 
	
	
	resetAllControls();
	setMenuCtrlImage(event.target.value);
}

/**
*	Adds an event handler that runs when the input element receives
input.
	[Read more](https://www.wix.com/corvid/reference/$w.TextInputMixin.html#onInput)
*	 @param {$w.Event} event
*/
export function input1_input(event) {
	// This function was added from the Properties & Events panel. To learn more, visit http://wix.to/UcBnC-4
	// Add your code for this event here: 
	resetAllControls();
	setMenuCtrlImage(event.target.value);
}
