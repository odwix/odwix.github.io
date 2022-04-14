// API Reference: https://www.wix.com/velo/reference/api-overview/introduction
// “Hello, World!” Example: https://learn-code.wix.com/en/article/1-hello-world
import {fetch} from 'wix-fetch';
import {extractMenu, getMenuAnnotations, extractMenuFromCoords} from 'backend/main'
import wixData from 'wix-data';
import wixWindow from 'wix-window';
import wixLocation from 'wix-location';

let g_state = {
	analayzing: false,
	analayzingFailed: false,
	analyzingFailedMsgLine: '',
	fetchingWordsInfo: false,
	dataDirty: false,
}

let g_selectedRowData = null;

$w.onReady(function () {
	$w('#table1').rows = [];
	g_selectedRowData = null;
	
	initTableCols();

	$w('#image1').src = $w('#input1').value;
	$w('#image1').link = $w('#input1').value;
	$w('#image1').target = '_blank';

	$w('#button2').link = $w('#input1').value;
	$w('#button2').target = '_blank';

	$w('#text1').text = '';

	setMenuCtrlImage($w('#input1').value);

	setNavigatorConfig();

	updateAllControls();

});

function initTableCols(colWidth1=140, colWidth2=480, colWidth3=50) {
	$w('#table1').columns = [
		{
			"id": "col0",
			"dataPath": "_section_name",
			"label": "Name",
			"width": colWidth1,
			"visible": true,
			"type": "richText",
			"linkPath": "link-field-or-property"
		},
		{
			"id": "col1",
			"dataPath": "_item_description",
			"label": "Description",
			"width": colWidth2,
			"visible": true,
			"type": "richText",
			"linkPath": "link-field-or-property"
		},
		{
			"id": "col2",
			"dataPath": "_price",
			"label": "Price",
			"width": colWidth3,
			"visible": true,
			"type": "richText",
			"linkPath": "link-field-or-property"
		}
	];
}

function recalcTableColWidthsByRowsContent() {
	let rows = $w("#table1").rows;

	let maxNameLegth = 0;
	let maxDescLength = 0;
	for(let i=0; i<rows.length; i++) {
		let name =rows[i].section_name;
		let desc = rows[i].item_description;
		maxNameLegth = name.length > maxNameLegth ? name.length : maxNameLegth;
		maxDescLength = desc.length > maxDescLength ? desc.length : maxDescLength;
	}
	if(maxNameLegth > maxDescLength) {
		initTableCols(480, 140, 50);
	} else {
		initTableCols();
	}
}

function updateAllControls() {
	let msgLine = '';
	let msgTextColor = '#0000FF';
	let but1_enabled = false;
	let but2_enabled = false;
	let but3_enabled = false;
	let but4_enabled = false;
	let inp1_enabled = false;
	if(g_state.analayzing) {
		msgLine = 'Analyzing image, please wait...';
	} else if(g_state.fetchingWordsInfo) {
		msgLine = 'Fetching words info, please wait...';
	} else if (g_state.analayzingFailed) {	
		msgTextColor = '#FF0000';	
		msgLine = g_state.analyzingFailedMsgLine;
		but1_enabled = true;
		but2_enabled = true;
		but3_enabled = true;
		but4_enabled = true;
		inp1_enabled = true;
	} else {
		msgLine = '';
		but1_enabled = true;
		but2_enabled = true;
		but3_enabled = true;
		but4_enabled = true;
		inp1_enabled = true;
	}

	$w("#text1").html = `<p style="text-align:center; color: ${msgTextColor}; font-size: 16px; font-weight:bold">${msgLine}</p>`;

	let tableNotEmpty = $w('#table1').rows.length > 0;

	but1_enabled ? $w('#button1').enable() : $w('#button1').disable();
	but2_enabled ? $w('#button2').enable() : $w('#button2').disable();
	but3_enabled ? $w('#button3').enable() : $w('#button3').disable();
	but4_enabled && tableNotEmpty ? $w('#button4').enable() : $w('#button4').disable();
	inp1_enabled ? $w('#input1').enable() : $w('#input1').disable();
}

function resetAllControls() {
	g_state = {
		analayzing: false,
		analayzingFailed: false,
		analyzingFailedMsgLine: '',
		fetchingWordsInfo: false,
	}
	
	clearMenuMarkArea();
	$w('#table1').rows = [];
	g_selectedRowData = null
	clearMenuNavigatorAreasData();	
	updateAllControls();
}

function setNavigatorConfig() {
	let msg = {
		msg: 'setConfig',
		config: {
			drawFullStats: false,
            drawCursorLabels: false,
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
	}
	
	$w('#html1').postMessage(msg);
}

function setMenuMarkedArea(x,y,w,h) {
	let msg = {
		msg: 'markArea',
		markArea: {x,y,w,h},
	}
	$w('#html1').postMessage(msg);
}

function clearMenuMarkArea() {
	let msg = {
		msg: 'clearMarkArea',		
	}
	$w('#html1').postMessage(msg);
}

function setMenuNavigatorAreasData(areasData) {
	let msg = {
		msg: 'setAllAreas',
		areasData,
	}
	$w('#html1').postMessage(msg);
}

function clearMenuNavigatorAreasData() {
	let msg = {
		msg: 'clearAllAreas',
	}
	$w('#html1').postMessage(msg);
}

function selectTableRowById(id) {
	let rows = $w('#table1').rows;
	for(let i=0; i<rows.length; i++) {
		if(rows[i].id === id) {
			console.log(`selected row id: ${rows[i].id} index: ${i}`);
			$w('#table1').selectRow(i);
			g_selectedRowData = rows[i];
			$w('#table1').refresh();
			return;
		}
	}
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

function rowsFromMenuData(data) {
	if(data.groups === undefined) {
		throw({res: 'No valid grouping found'});
	}

	let rows = [];
	let row_id = 0;
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
				_section_name: name,
				section_name: name,
				_item_description: description,
				item_description: description,
				_price: price,
				price: price,
				x, y, w, h,
				nx: parseInt(x/50)*50,
				ny:	parseInt(y/50)*50,
			}

			rows.push(item);
			row_id++;
			
		});
		return rows;
}

function sortRowsByMenuStructure(rows) {
	return rows.sort((a,b) => {
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
}

function doModal_YesNoDialog(title, message) {
	let context = {
		title,
		text: message,
	};
	return wixWindow.openLightbox('yes_no_dialog', context);
}

function showDirtyWarningDialog() {
	let title = '<p style="border:1px solid black; color:black; background:red; font-weight:bold">Warning!</p>';
	let msg = '<div style="padding:5px; font-size: 16px;">The changes that you have made to the menu will be lost<br/>if you continue!</div><div style="padding:5px; font-size:16px;">Continue anyway?</div>';
	return doModal_YesNoDialog(title, msg)
}

function doExtractMenu() {
	g_state.dataDirty = false;

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

	$w('#image1').src = imageUrl;
	$w('#image1').link = imageUrl;
	$w('#button2').link = imageUrl;
	

	setMenuCtrlImage(imageUrl);

	$w('#button1').disable();
	$w('#button2').disable();
	$w('#input1').disable();
	

	extractMenu(imageUrl)
	.then(data => {
		// console.log(data);

		clearMenuNavigatorAreasData();

		if(data.success !== undefined && !data.success && data.errorDescription !== undefined) {
			g_state.analayzing = false;
			g_state.analayzingFailed = true;
			g_state.analyzingFailedMsgLine = data.errorDescription;

			$w('#table1').rows = [];
			g_selectedRowData = null;				
			clearMenuNavigatorAreasData();

			updateAllControls();	
			
			return;
		}		

		let rows = rowsFromMenuData(data);
		rows = sortRowsByMenuStructure(rows);		

		//Set the table data:
		$w('#table1').rows = rows;
		g_selectedRowData = null;
		recalcTableColWidthsByRowsContent();	

		let areasData = rows.map((v,i) => {
			return {id:v.id, x:v.x, y:v.y, w:v.w, h:v.h};
		});
		//console.log(JSON.stringify(areasData));
		setMenuNavigatorAreasData(areasData);

		g_state.analayzing = false;
		updateAllControls();

		tryBuildMenuAnnotations(imageUrl);

		updateAllControls();
		
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
		$w('#button2').link = imageUrl;
		$w('#button2').enable();
		$w('#input1').enable();
		updateAllControls();
		
	})
}

/**
*	Adds an event handler that runs when the element is clicked.
	[Read more](https://www.wix.com/corvid/reference/$w.ClickableMixin.html#onClick)
*	 @param {MouseEvent} event
*/
export function button1_click(event) {
	// This function was added from the Properties & Events panel. To learn more, visit http://wix.to/UcBnC-4
	// Add your code for this event here: 
	if(g_state.dataDirty) {
		showDirtyWarningDialog()
		.then(res => {
			if(res.result) {
				doExtractMenu();
			}
		});
	} else {
		doExtractMenu();
	}	
}

function deleteRowFromTable(id, row) {
	g_state.analayzing = false;
	g_state.analayzingFailed = false;
	updateAllControls();
	let rows = $w('#table1').rows;
	let newRows = [];
	for(let i=0; i<rows.length; i++) {
		if(rows[i].id !== id) {
			newRows.push(rows[i]);
		} 
	}
	
	$w('#table1').rows = newRows;
	let areasData = newRows.map((v,i) => {
			return {id:v.id, x:v.x, y:v.y, w:v.w, h:v.h};
		});
	//console.log(JSON.stringify(areasData));
	clearMenuMarkArea();
	setMenuNavigatorAreasData(areasData);
	updateAllControls();

}

function updateMenuItemFromUserSelectedRect(id, extracted) {
	g_state.analayzing = false;
	g_state.analayzingFailed = false;
	updateAllControls();

	let item = rowsFromMenuData(extracted)[0];
	console.log(JSON.stringify(item));
	let context = {
		title: 'Update Dish (from marked region)',
		showDeleteButton: false,
		data: {
			section_name:item.section_name,
			item_description: item.item_description,
			price: item.price,
		},
	};
	console.log(JSON.stringify(context));
	wixWindow.openLightbox("dish_editor", context)
	.then( res => {
		if(res !== null) {
			g_state.dataDirty = true;
			let rows = $w('#table1').rows;
			for(let i=0; i<rows.length; i++) {
				if(rows[i].id === id) {
					rows[i]._section_name = `<span style="color:Blue;">${res.section_name}</span>`;					
					rows[i]._item_description = `<span style="color:Blue;">${res.item_description}</span>`;
					rows[i]._price = `<span style="color:Blue;">${res.price}</span>`;
					rows[i].section_name = res.section_name;
					rows[i].item_description = res.item_description;					
					rows[i].price = res.price;
					rows[i].x = item.x;
					rows[i].y = item.y;
					rows[i].w = item.w;
					rows[i].h = item.h;
					break;
				}
			}

			rows = sortRowsByMenuStructure(rows);
			$w('#table1').rows = rows;
			let areasData = rows.map((v,i) => {
				return {id:v.id, x:v.x, y:v.y, w:v.w, h:v.h};
				});
			clearMenuMarkArea();
			setMenuNavigatorAreasData(areasData);
			updateAllControls();
		}
	});
}

function addNewMenuItemByUserSelectionRect(extracted) {
	g_state.analayzing = false;
	g_state.analayzingFailed = false;
	updateAllControls();

	let item = rowsFromMenuData(extracted)[0];
	console.log(JSON.stringify(item));
	let context = {
		showDeleteButton: false,
		title: 'Add New Dish',
		data: {			
			section_name:item.section_name,
			item_description: item.item_description,
			price: item.price,
		},
	};

	wixWindow.openLightbox("dish_editor", context)
	.then( res => {
		if(res !== null) {
			g_state.dataDirty = true;
			let rows = $w('#table1').rows;
			let newRow = {
				id: `id_${rows.length+1}`,				
				_section_name: `<span style="color:DarkGreen;">${res.section_name}</span>`,				
				_item_description: `<span style="color:DarkGreen;">${res.item_description}</span>`,
				_price: `<span style="color:DarkGreen;">${res.price}</span>`,
				section_name: res.section_name,
				item_description: res.item_description,
				price: res.price,
				x: item.x,
				y: item.y,
				w: item.w,
				h: item.h,
			};
			console.log(`new row: ${JSON.stringify(newRow)}`);

			rows.push(newRow);
			rows = sortRowsByMenuStructure(rows);
			$w('#table1').rows = rows;
			let areasData = rows.map((v,i) => {
				return {id:v.id, x:v.x, y:v.y, w:v.w, h:v.h};
				});
			clearMenuMarkArea();
			setMenuNavigatorAreasData(areasData);
			updateAllControls();
		}
	});
}


/**
*	Adds an event handler that runs when a table cell is selected.
	[Read more](https://www.wix.com/corvid/reference/$w.Table.html#onCellSelect)
*	 @param {TableCellEvent} event
*/
export function table1_cellSelect_1(event) {
	// This function was added from the Properties & Events panel. To learn more, visit http://wix.to/UcBnC-4
	// Add your code for this event here: 
	try {
		let cellData = event.cellData;
		wixWindow.copyToClipboard(cellData);

		if(event.target !== null && event.target.rows !== null) {
			let rowData = event.target.rows[event.cellRowIndex];
			console.log(JSON.stringify(rowData));
			setMenuMarkedArea(rowData.x, rowData.y, rowData.w, rowData.h)
		}
	}catch(err) {
		console.log(err);
	}
}

/**
*	Adds an event handler that runs when a table row is selected.
	[Read more](https://www.wix.com/corvid/reference/$w.Table.html#onRowSelect)
*	 @param {TableRowEvent} event
*/
export function table1_rowSelect(event) {
	// This function was added from the Properties & Events panel. To learn more, visit http://wix.to/UcBnC-4
	// Add your code for this event here: 
	let rowData = event.rowData;
	g_selectedRowData = event.rowData;
	console.log(JSON.stringify(rowData));
	setMenuMarkedArea(rowData.x, rowData.y, rowData.w, rowData.h);
	wixWindow.copyToClipboard(`${rowData.section_name} - ${rowData.item_description} - ${rowData.price}`);
}

/**
*	Adds an event handler that runs when an input element's value
 is changed.
	[Read more](https://www.wix.com/corvid/reference/$w.ValueMixin.html#onChange)
*	 @param {Event} event
*/
export function input1_change(event) {
	// This function was added from the Properties & Events panel. To learn more, visit http://wix.to/UcBnC-4
	// Add your code for this event here: 
	$w('#image1').src = event.target.value;
	
	resetAllControls();
	setMenuCtrlImage(event.target.value);
}

/**
*	Adds an event handler that runs when the input element receives
input.
	[Read more](https://www.wix.com/corvid/reference/$w.TextInputMixin.html#onInput)
*	 @param {Event} event
*/
export function input1_input(event) {
	// This function was added from the Properties & Events panel. To learn more, visit http://wix.to/UcBnC-4
	// Add your code for this event here: 
	$w('#image1').src = event.target.value;
	$w('#image1').link = event.target.value;
	$w('#button2').link = event.target.value

	resetAllControls();
	setMenuCtrlImage(event.target.value);
	
}

/**
*	Adds an event handler that runs when the HTML Component
 sends a message.
	[Read more](https://www.wix.com/corvid/reference/$w.HtmlComponent.html#onMessage)
*	 @param {HtmlComponentMessageEvent} event
*/
export function html1_message(event) {
	// This function was added from the Properties & Events panel. To learn more, visit http://wix.to/UcBnC-4
	// Add your code for this event here: 
	console.log('htmlevent handler');
	if(event.data !== undefined ) {
		let data = event.data;
		if(data.msg === 'areaSelected') {
			if(data.areaDataValid) {
				let areaData = data.areaData;
				console.log(areaData.id);
				selectTableRowById(areaData.id);
				if(data.userSelectedRectValid) {
					console.log(`update item<${areaData.id}> from user rect: ${JSON.stringify(data.userSelectedRect)}`);
					//TODO: if data.userSelectedRectValid - call rescan menu with the coords and update the item with the returned values.
					let imageUrl = $w('#input1').value;
					let x = data.userSelectedRect.x;
					let y = data.userSelectedRect.y;
					let w = data.userSelectedRect.w;
					let h= data.userSelectedRect.h;
					let url = `https://www.wix.com/eureka/content/img/ocr/extract?url=${imageUrl}&l=3&c=true&g=true&a=&p=${x},${y},${w},${h}`;
					console.log(url);
					g_state.analayzing = true;
					g_state.analayzingFailed = false;
					updateAllControls();
					extractMenuFromCoords(imageUrl, x, y, w, h)
					.then(extracted => {	
						console.log(`extracted: ${JSON.stringify(extracted)}`);					
						updateMenuItemFromUserSelectedRect(areaData.id, extracted);
					})
					.catch( (err) => {						
						g_state.analayzingFailed = true;
						g_state.analyzingFailedMsgLine = `Update item Failed - ${JSON.stringify(err)}`;
						updateAllControls();
					})
					.finally( () => {
						g_state.analayzing = false;
						updateAllControls();
					});
				}
			} else if(data.userSelectedRectValid) {
				console.log(`add new item from user rect: ${JSON.stringify(data.userSelectedRect)}`);
				//TODO: call rescan menu with the coords and add a new item with the returned values to the menu and init the table and navigator .
				let imageUrl = $w('#input1').value;
					let x = data.userSelectedRect.x;
					let y = data.userSelectedRect.y;
					let w = data.userSelectedRect.w;
					let h= data.userSelectedRect.h;
					let url = `https://www.wix.com/eureka/content/img/ocr/extract?url=${imageUrl}&l=3&c=true&g=true&a=&p=${x},${y},${w},${h}`;
					console.log(url);
					g_state.analayzing = true;
					g_state.analayzingFailed = false;
					updateAllControls();
					extractMenuFromCoords(imageUrl, x, y, w, h)
					.then(extracted => {
						console.log(`extracted: ${JSON.stringify(extracted)}`);
						addNewMenuItemByUserSelectionRect(extracted);						
					})
					.catch( err => {
						g_state.analayzingFailed = true;
						g_state.analyzingFailedMsgLine = `Add new item Failed - ${JSON.stringify(err)}`;
						updateAllControls();
					})
					.finally( () => {
						g_state.analayzing = false;
						updateAllControls();
					});
			}
		} else if(data.msg === 'areaSelected-dblclick') {
			let areaData = data.areaData;
				console.log(areaData.id);
				selectTableRowById(areaData.id);
				updateSelectedRow();
		} else if(data.msg === 'imageUnloaded') {			
				$w('#button1').disable();
				$w('#button2').link = '';
				$w('#button2').disable();			
		} else if(data.msg === 'imageLoaded') {
			if(!g_state.analayzing) {
				$w('#button1').enable();
				$w('#button2').link = $w('#input1').value;
				$w('#button2').enable();
			}
		}
	}
}

function updateSelectedRow() {
	let rows = $w('#table1').rows;
	if(g_selectedRowData !== null) {
		let data = {
			title: 'Edit Selected Dish',
			showDeleteButton: true,
			data: g_selectedRowData,
		}	
		wixWindow.openLightbox("dish_editor", data)
		.then(res => {
			if(res !== null) {				
				g_state.dataDirty = true;				
				if(res.section_name === null && res.item_description === null && res.price === null) {													
					deleteRowFromTable(g_selectedRowData.id, res);
				} else {
					for(let i=0; i<rows.length; i++) {
						if(rows[i].id === g_selectedRowData.id) {
							rows[i].section_name = res.section_name;
							rows[i].item_description = res.item_description;
							rows[i].price = res.price;
							rows[i]._section_name = `<span style="color:DarkOrange">${res.section_name}</span>`;
							rows[i]._item_description = `<span style="color:DarkOrange">${res.item_description}</span>`;
							rows[i]._price = `<span style="color:DarkOrange">${res.price}</span>`;
							$w('#table1').rows = rows;
							$w('#table1').selectRow(i);
							break;
						}
					}
					}
			}
		})	
	}
}

/**
*	Adds an event handler that runs when the element is double-clicked.
	[Read more](https://www.wix.com/corvid/reference/$w.ClickableMixin.html#onDblClick)
*	 @param {$w.MouseEvent} event
*/
export function table1_dblClick(event) {
	// This function was added from the Properties & Events panel. To learn more, visit http://wix.to/UcBnC-4
	// Add your code for this event here:
	g_state.analayzing = false;
	g_state.analayzingFailed = false;
	updateAllControls();

	updateSelectedRow();	
}

/**
*	Adds an event handler that runs when the element is clicked.
	[Read more](https://www.wix.com/corvid/reference/$w.ClickableMixin.html#onClick)
*	 @param {$w.MouseEvent} event
*/
export function button3_click(event) {
	// This function was added from the Properties & Events panel. To learn more, visit http://wix.to/UcBnC-4
	// Add your code for this event here: 
	let vExtracted = {
		/*items:[
			{
				"text":"THE CRACK",
				"type":"item_name",
				"pos":{"x":59,"y":466,"w":151,"h":18}
			},
			{
				"text":"$ 12",
				"type":"price",
				"pos":{"x":304,"y":468,"w":39,"h":16}},
				{
					"text":"I'm A Dish Description. Click“ Edit Menu\" To Open The Restaurant Menu Editor And Change My Text.\r\nExtras/$ 2",
					"type":"item_description",
					"pos":{"x":58,"y":512,"w":299,"h":125}
				}
		],*/
		"groups": [
		{
			"texts":[
				{
					"text":"Dish Name",
					"type":"item_name",
					"pos":{"x":0,"y":0,"w":0,"h":0}
				},
				{
					"text":"Dish Description",
					"type":"item_description",
					"pos":{"x":0,"y":0,"w":0,"h":0}
				},
				{
					"text":"$ 0",
					"type":"price",
					"pos":{"x":0,"y":0,"w":0,"h":0}
				}
			]
		}
	]
	};

	addNewMenuItemByUserSelectionRect(vExtracted);
}

/**
*	Adds an event handler that runs when the element is clicked.
	[Read more](https://www.wix.com/corvid/reference/$w.ClickableMixin.html#onClick)
*	 @param {$w.MouseEvent} event
*/
export function button4_click(event) {
	// This function was added from the Properties & Events panel. To learn more, visit http://wix.to/UcBnC-4
	// Add your code for this event here:
	g_state.analayzing = false; 
	g_state.analayzingFailed = false;
	//g_state.analyzingFailedMsgLine = 'Not implemented yet...';
	updateAllControls();
	let rows = $w('#table1').rows;
	let exportRows = {
		msid: wixLocation.query["id"],
		items: rows.map((v,i) => {
		return {
			name: v.section_name,
			description: v.item_description,
			price: v.price,
			x: v.x,
			y: v.y,
			w: v.w,
			h: v.h,
		}
	})
	}

	let context = {
		title: 'Export Menu',
		data: JSON.stringify(exportRows, null, 2),
	}
	wixWindow.openLightbox('exporter', context)
	.then(res => {

	});
}
