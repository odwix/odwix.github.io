// API Reference: https://www.wix.com/velo/reference/api-overview/introduction
// “Hello, World!” Example: https://learn-code.wix.com/en/article/1-hello-world
import {fetch} from 'wix-fetch';
import {extractMenu, getMenuAnnotations, extractMenuFromCoords, uploadImage, exportMenu} from 'backend/main'
import wixData from 'wix-data';
import wixWindow from 'wix-window';
import wixLocation from 'wix-location';

let g_state = {
	debugMode: false,
	msid: '',
	analayzing: false,
	analayzingFailed: false,
	analyzingFailedMsgLine: '',
	fetchingWordsInfo: false,
	dataDirty: false,
	lastValidImgUrl: '',	
	uploadingExternalImage: false,
	uploadingExternalImageMsg: '',
	idGeneratorVal: 0,
	exporting: false,
	exportingFailed: false,
	exportingMsgLine:'',
	price_warnings: 0,
	name_warnings: 0,
	extracted_sections: [],
}

let g_selectedRowData = null;

$w.onReady(function () {
	if(!g_state.debugMode) {
		if(wixLocation.query["id"] === undefined || wixLocation.query["id"] === '') {
			wixLocation.to('https://www.wix.com/eureka/site-selector?t=Select%20Restaurant&b=Import&u=https://alphap8-sites.wixsite.com/auto-menu');
		} else {
			g_state.msid = wixLocation.query["id"];
		}
		if(wixLocation.query["url"] !== undefined && wixLocation.query["url"] !== '') {
			$w('#input1').value = wixLocation.query["url"];
		} else {
			g_state.msid = wixLocation.query["id"];
		}
	} else {
		console.log('**** DEBUG MODE ON!!! ****');
	}
	$w('#table1').rows = [];
	g_selectedRowData = null;
	
	initTableCols();

	$w('#image1').src = $w('#input1').value;
	$w('#image1').link = $w('#input1').value;
	$w('#image1').target = '_blank';

	$w('#button2').link = $w('#input1').value;
	$w('#button2').target = '_blank';

	$w('#text1').text = '';

	$w("#input1").onCustomValidation( (value, reject) => {
		g_state.uploadingExternalImage = false;
		g_state.uploadingExternalImageFailed = false;
		let curUrl = $w('#input1').value;
		if(curUrl.indexOf('https://static.wixstatic.com/media') === - 1) {
			g_state.uploadingExternalImage = true;
			updateAllControls();
			console.log('uploading image...');
			uploadImage(curUrl)
			.then(res => {
				let fileUrl = res.fileUrl;
				fileUrl = fileUrl.replace('wix:image://v1', 'https://static.wixstatic.com/media');
				let n = fileUrl.lastIndexOf('/');
				fileUrl = fileUrl.substring(0, n);
				$w('#input1').value = fileUrl;
				g_state.uploadingExternalImage = false;
				updateAllControls();
			})
			.catch(err => {
				g_state.uploadingExternalImage = false;
				g_state.uploadingExternalImageFailed = true;
				g_state.uploadingExternalImageMsg = `Invalid Specified url {${err}}`;
				updateAllControls();
			})
		}

		if(g_state.dataDirty) {
			showDirtyWarningDialog()
			.then( res => {
				if(!res.result) {
					reject("Menu is modified....");
				} else {
					let imgUrl = $w('#input1').value;	
					resetAllControls();
					setMenuCtrlImage(imgUrl);
					doExtractMenu();
				}
			})
		} else {
			let imgUrl = $w('#input1').value;	
			resetAllControls();
			setMenuCtrlImage(imgUrl);
		}
	} );

	setMenuCtrlImage($w('#input1').value);

	setNavigatorConfig();

	updateAllControls();

});

function getNewRowId() {
	return g_state.idGeneratorVal++;
}

function initTableCols(colWidth1=140, colWidth2=480, colWidth3=50) {
	$w('#table1').columns = [
		{
			"id": "col0",
			"dataPath": "_item_name",
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
		let name =rows[i].item_name;
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
	validateTableMenuItems();

	let msgLine = '';	
	let msgTextColor = '#0000FF';
	let but1_enabled = false;
	let but2_enabled = false;
	let but3_enabled = false;
	let but4_enabled = false;
	let inp1_enabled = false;
	let html1_enabled = false;
	let upload_but_enabled = false;
	let properties_but_enabled = false;
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
		html1_enabled = true;
		upload_but_enabled = true;
		properties_but_enabled = true;
	} else if(g_state.uploadingExternalImage) {
		msgLine = 'uploading url, please wait...';
	} else if(g_state.uploadingExternalImageFailed) {
		msgTextColor = '#FF0000';
		msgLine = g_state.uploadingExternalImageMsg;
		inp1_enabled = true;
	} else if(g_state.exporting) {
		msgLine = 'Exporting menu, please wait...';
	} else if(g_state.exportingFailed) {
		msgTextColor = '#FF0000';
		msgLine = g_state.exportingMsgLine;
		but1_enabled = true;
		but2_enabled = true;
		but3_enabled = true;
		but4_enabled = true;
		inp1_enabled = true;
		html1_enabled = true;
		upload_but_enabled = true;
		properties_but_enabled = true;
	}
	else {
		let totalWarnings = g_state.price_warnings + g_state.name_warnings;
		let msgWarning = totalWarnings > 0 ? `<span style="font-size:12px;padding-left:10px;">${totalWarnings}x</span><span style="font-size:12px;color:red;background:yellow;">&#9888;</span>` : ''
		msgLine = `Dishes count: ${$w('#table1').rows.length} ${msgWarning}`;
		msgTextColor = '#000000';
		but1_enabled = true;
		but2_enabled = true;
		but3_enabled = true;
		but4_enabled = true;
		inp1_enabled = true;
		html1_enabled = true;
		upload_but_enabled = true;
		properties_but_enabled = true;
	}

	g_state.debugMode ? $w('#text8').show() : $w('#text8').hide();

	$w("#text1").html = `<p style="text-align:center; color: ${msgTextColor}; font-size: 16px; font-weight:bold">${msgLine}</p>`;

	let tableNotEmpty = $w('#table1').rows.length > 0;

	but1_enabled ? $w('#button1').enable() : $w('#button1').disable();
	but2_enabled ? $w('#button2').enable() : $w('#button2').disable();
	but3_enabled ? $w('#button3').enable() : $w('#button3').disable();
	but4_enabled && tableNotEmpty && g_state.msid !== '' ? $w('#button4').enable() : $w('#button4').disable();
	inp1_enabled ? $w('#input1').enable() : $w('#input1').disable();
	upload_but_enabled ? $w('#uploadButton1').enable() : $w('#uploadButton1').disable();
	properties_but_enabled ? $w('#button7').enable() : $w('#button7').disable();
	// html1_enabled ? enabeMenuleNavigator() : disableMenuNavigator();
	
}

function resetAllControls() {
	g_state.analayzing = false;
	g_state.analayzingFailed = false;
	g_state.analyzingFailedMsgLine = '';
	g_state.fetchingWordsInfo = false;
	
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

function enabeMenuleNavigator() {
	let msg = {
		msg: 'enable',
	};
	$w('#html1').postMessage(msg);
}

function disableMenuNavigator() {
	let msg = {
		msg: 'disable',
	};
	$w('#html1').postMessage(msg);
}

function setMenuCtrlImage(imgUrl) {
	let fixedImgUrl = imgUrl; //imgUrl.indexOf('https://static.wixstatic.com/media/') === 0 ? `${imgUrl}/v1/fit/w_2000,h_2000/img.png` : '';
	let msg = {
		msg: 'setImage',
		src: fixedImgUrl,
	}
	
	$w('#html1').postMessage(msg);
}

function setMenuMarkedArea(x,y,w,h) {
	if(w > 1 && h > 1) {
		let msg = {
			msg: 'markArea',
			markArea: {x,y,w,h},
		}
		$w('#html1').postMessage(msg);
	}
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
			// console.log(`selected row id: ${rows[i].id} index: ${i}`);
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
		// console.log(`\nmenuAnnotations:\n${JSON.stringify(res)}`);
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
		// console.log(JSON.stringify(wordsInfo));
		$w("#html1").postMessage(msg);
	})
	.finally( () => {
		g_state.fetchingWordsInfo = false;
		updateAllControls();
	});
	
}

function rowsFromMenuData(data) {
	if(data.groups === undefined) {
		throw({res: 'No valid grouping found', data});
	}

	let rows = [];
	data.groups.map((v,i) => {
			let name = '';
			let description = '';
			let price = '';
			let x = v.poly !== undefined ? v.poly.x : -1;
			let y = v.poly !== undefined ? v.poly.y : -1;
			let w = v.poly !== undefined ? v.poly.w : -1;
			let h = v.poly !== undefined ? v.poly.h : -1;
			let nx = parseInt(x/50)*50;
			let ny = parseInt(y/50)*50;

			v.texts.map((gv, gi) => {
				x = x === -1 ? gv.pos.x : x;
				y = y === -1 ? gv.pos.y : y;
				w = w === -1 ? gv.pos.w : w;
				h = h === -1 ? gv.pos.h : h;
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
				id: `id_${getNewRowId()}`,
				_color: 'Black',
				_item_name: name,
				item_name: name,
				_item_description: description,
				item_description: description,
				_section:  '',
				section: '',
				_price: price,
				price: price,
				x, y, w, h, nx, ny
				// nx: parseInt(x/50)*50,
				// ny:	parseInt(y/50)*50,
			}

			rows.push(item);
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

function updateExtractedSections(section) {
	if(section !== undefined && section.trim().length > 0) {
		console.log(`extracted sections:${g_state.extracted_sections} section:${section}`);
		let found = g_state.extracted_sections.find((v,i) => v.toLowerCase() === section.toLowerCase());
		if(found === undefined) {
			g_state.extracted_sections.push(section);
		}
	}
}

function doModal_YesNoDialog(title, message) {
	let context = {
		title,
		text: message,
	};
	return wixWindow.openLightbox('yes_no_dialog', context);
}

function doModal_OkDialog(title, message) {
	let context = {
		title,
		text: message,
	};
	return wixWindow.openLightbox('ok_dialog', context);
}

function showDirtyWarningDialog() {
	let title = '<p style="padding:5px; border:1px solid black; border-radius:3px; color:black; background:red; font-weight:bold">Warning!</p>';
	let msg = '<div style="padding:5px; font-size: 16px;">The changes that you have made to the menu will be lost<br/>if you continue!</div><div style="padding:5px; font-size:16px;">Continue anyway?</div>';
	return doModal_YesNoDialog(title, msg)
}

function showAddNewItemFailedDialog() {
	let title = '<p style="padding:5px; border:1px solid black; border-radius:3px; color:black; background:red; font-weight:bold">Menu Item Analysis Failed...</p>';
	let msg = '<div style="padding:5px; font-size: 16px;">Would you like to add a new menu item manually?</div>';
	return doModal_YesNoDialog(title, msg)
}

function showAddMultipleNewItemsDialog(itemsCount) {
	let title = `<p style="padding:5px; border:1px solid black; color:white; background:DarkBlue; border-radius:3px; font-weight:bold;">${itemsCount} New Menu Items Found!</p>`;
	let msg = `<div style="padding:5px; font-size: 16px;">Would you like to add them to the menu?</div>`;
	return doModal_YesNoDialog(title, msg);
}

function showOkDialog(title, message) {
	let formattedTitle = `<p style="padding:5px; border:1px solid black; color:white; background:DarkBlue; border-radius:3px; font-weight:bold;">${title}</p>`;
	let formattedMessage = `<div style="padding:5px; font-size: 16px;">${message}</div>`;
	return doModal_OkDialog(formattedTitle, formattedMessage);
}

function showErrorDialog(title, message) {
	let formattedTitle = `<p style="padding:5px; border:1px solid black; color:white; background:DarkRed; border-radius:3px; font-weight:bold;">${title}</p>`;
	let formattedMessage = `<div style="padding:5px; font-size: 16px;">${message}</div>`;
	return doModal_OkDialog(formattedTitle, formattedMessage);
}

function showPropertiesDialog() {
	let context = {
		title: `<p style="padding:5px; border:1px solid black; color:white; background:black; border-radius:3px; font-weight:bold;">Menu Properties</p>`,
		sections: [],
		tax_global: 0,
	};

	wixWindow.openLightbox("properties_dialog", context) 
	.then(res => {
		if(res !== undefined && res !== null && res.result !== null) {
			//TODO:...
		}
	})
}

function doExtractMenu() {
	g_state.dataDirty = false;
	g_state.lastValidImgUrl = $w('#input1').value;

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
	
	console.log(`extractedMenu url: ${imageUrl}`);

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

		g_state.extracted_sections = ["Starters", "Mains", "Sides", "Deserts"];

		if(data.sections !== undefined) {
			g_state.extracted_sections = data.sections.map((v,i) => v.texts.map((t,i) => t.text).join(' '));
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

		// tryBuildMenuAnnotations(imageUrl);

		updateAllControls();
		
	})
	.catch(error => {
		//console.log(JSON.stringify(error));
		g_state.analayzing = false;
		g_state.analayzingFailed = true;
		let msgLengthLimit = 100;
		g_state.analyzingFailedMsgLine = error.res !== undefined ? error.res : JSON.stringify(error);
		g_state.analyzingFailedMsgLine = getTruncatedText(g_state.analyzingFailedMsgLine, msgLengthLimit, '...');
		
		updateAllControls();
	})
	.finally(() => {
		g_state.analayzing = false;

		$w('#button1').enable();
		$w('#button2').link = imageUrl;
		$w('#button2').enable();
		$w('#input1').enable();

		tryBuildMenuAnnotations(imageUrl);

		updateAllControls();
		
	})
}

function getTruncatedText(text, limit, termination) {
	return text.length < limit ? text : text.substring(0, limit).concat(termination);
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
	// console.log(JSON.stringify(item));
	let context = {
		title: 'Update Dish (from marked region)',
		showDeleteButton: false,
		showReproduceButton: true,
		data: {
			item_name:item.item_name,
			item_description: item.item_description,
			section: item.section,
			price: item.price,
		},
		sections:g_state.extracted_sections,
	};
	// console.log(JSON.stringify(context));
	wixWindow.openLightbox("dish_editor", context)
	.then( res => {
		if(res !== null) {
			console.log(`res = ${JSON.stringify(res)}`);
			updateExtractedSections(res.section);
			g_state.dataDirty = true;
			let rows = $w('#table1').rows;
			if(res.doReproduce) {
				let color = 'Purple';
				let newRow = {
					id: `id_${getNewRowId()}`,	
					_color: color,			
					_item_name: `<span style="color:${color};">${res.item_name}</span>`,				
					_item_description: `<span style="color:${color};">${res.item_description}</span>`,
					_price: `<span style="color:${color};">${res.price}</span>`,
					item_name: res.item_name,
					item_description: res.item_description,
					_section: `<span style="color:${color};">${res.section}</span>`,
					section: res.section,
					price: res.price,
					x: item.x,
					y: item.y,
					w: item.w,
					h: item.h,
				};
				rows.push(newRow);
			} else {
				for(let i=0; i<rows.length; i++) {
					let color = 'Blue';
					if(rows[i].id === id) {
						rows[i]._color = color;
						rows[i]._item_name = `<span style="color:${color};">${res.item_name}</span>`;					
						rows[i]._item_description = `<span style="color:${color};">${res.item_description}</span>`;
						rows[i]._price = `<span style="color:${color};">${res.price}</span>`;
						rows[i].item_name = res.item_name;
						rows[i].item_description = res.item_description;	
						rows[i]._section = `<span style="color:${color};">${res.section}</span>`;
						rows[i].section = res.section;			
						rows[i].price = res.price;
						rows[i].x = item.x;
						rows[i].y = item.y;
						rows[i].w = item.w;
						rows[i].h = item.h;
						break;
					}
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

function rectIntersect(r1_x, r1_y, r1_cx, r1_cy, r2_x, r2_y, r2_cx, r2_cy, tx=0, ty=5) {
            let intersection = !(
                (r1_x > r2_cx)   ||
                (r1_cx < r2_x)   ||
                (r1_y+ty > r2_cy)   ||
                (r1_cy < r2_y+ty)
                );
            return intersection;
        }

function checkOverlaps(newRows, existingRows) {
	// console.log('\nCHECKING OVERLAPPS\n');
	let count = 0;
	for(let ni=0; ni<newRows.length; ni++) {
		for(let ei=0; ei<existingRows.length; ei++) {
			let newRow = newRows[ni];
			let existingRow = existingRows[ei];
			let rcNewRow = {x:newRow.x, y:newRow.y, cx:newRow.x+newRow.w, cy:newRow.y+newRow.h};
			let rcexistingRow = {x:existingRow.x, y:existingRow.y, cx:existingRow.x+existingRow.w, cy:existingRow.y+existingRow.h};
			// console.log(`nr:${JSON.stringify(rcNewRow)} er:${JSON.stringify(rcexistingRow)}\n`);
			let foundIntersect = rectIntersect(rcNewRow.x, rcNewRow.y, rcNewRow.cx, rcNewRow.cy, rcexistingRow.x, rcexistingRow.y, rcexistingRow.cx, rcexistingRow.cy);
			if(foundIntersect) {
				//console.log(`FOUND INTERSECTION: nr:${JSON.stringify(rcNewRow)} er:${JSON.stringify(rcexistingRow)}\n`);
				count++;
			}
		}
	}
	return count > 1;
}

function addMultipleNewMenuItemByUserSelectionRect(extracted) {
	if(extracted.groups !== undefined && extracted.groups.length > 1) {
		//Check for overlapps with existing items.
		let rows = $w('#table1').rows;
		let extractedRows = rowsFromMenuData(extracted);

		showAddMultipleNewItemsDialog(extractedRows.length)
		.then(res => {
			if(res.result) {
				g_state.analayzing = false;
				g_state.analayzingFailed = false;
				updateAllControls();
				
					for(let i=0; i<extractedRows.length; i++) {
					let item = extractedRows[i];			
					//console.log(JSON.stringify(item));
					g_state.dataDirty = true;	
					let color = 'DarkGreen';		
					let newRow = {
						id: `id_${getNewRowId()}`,
						_color: color,				
						_item_name: `<span style="color:${color};">${item.item_name}</span>`,				
						_item_description: `<span style="color:${color};">${item.item_description}</span>`,
						_price: `<span style="color:${color};">${item.price}</span>`,
						item_name: item.item_name,
						item_description: item.item_description,
						price: item.price,
						x: item.x,
						y: item.y,
						w: item.w,
						h: item.h,
					};
					//console.log(`added newRow id:${newRow.id}`);
					rows.push(newRow);			
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
}

function isPrice(price) {
	let _price = price.trim();
	if(_price.trim().length < 1) {
		return false;
	}

	const regex = /^([$€£¥]?\x20{0,}?\d{0,}(?:[.,]\d{0,2})?)$|^(\d?[.,]\d{0,2}[a-zA-Z]{3})$|(^\d+([.,]\d{0,2})?)\x20{0,}([usd|USD|Usd|eur|EUR|Eur]{3})?$/ug;
	let res = _price.match(regex);
	
	return res !== null && res.length === 1;
}

function isValidProductName(name) {
	return name.trim().length > 0;
}

function countOfProductsWithNames(rows) {
	return rows.filter(v => v.item_name.length > 0).length;
}

function validateTableMenuItems() {
	let warningCount = 0;
	let nameWarningCount = 0;
	let rows = $w('#table1').rows;
	const productsWithName = countOfProductsWithNames(rows);
	const productsWithNamesPercentag = productsWithName / rows.length * 100.0;
	// console.log(`productsWithNamesPercentag:${productsWithNamesPercentag} named:${productsWithName} length:${rows.length}`);
	for(let i=0; i<rows.length; i++) {
		let row = rows[i];
		let color = row._color;

		if(isPrice(row.price)) {
			row._price = `<span style="color:${color};">${row.price}</span>`;
		} else {
			warningCount++;
			
			row._price = `<span style="font-size:11px;color:red;background:yellow;">&#9888;</span><span style="color:${color};">${row.price}</span>`
		} 	

		if(!isValidProductName(row.item_name) && row.item_description.length < 1) {
			nameWarningCount += 2;
			row._item_name = `<span style="font-size:11px;color:red;background:yellow;">&#9888;</span>`;
			row._item_description = row._item_name;
		} else {
			if(productsWithNamesPercentag > 50) {
				if(isValidProductName(row.item_name)) {
					row._item_name = `<span style="color:${color};">${row.item_name}</span>`;
				} else {
					nameWarningCount++;
					row._item_name = `<span style="font-size:11px;color:red;background:yellow;">&#9888;</span><span style="color:${color};">${row.item_name}</span>`;
				}
			} else {
				row._item_name = `<span style="color:${color};">${row.item_name}</span>`;
			}
		}
	}
	$w('#table1').rows = rows;
	g_state.price_warnings = warningCount;
	g_state.name_warnings = nameWarningCount;
}

function createSingleGroupFromItems(items) {
	let rcLeft = Number.MAX_SAFE_INTEGER;
	let rcRight = Number.MIN_SAFE_INTEGER;
	let rcTop = Number.MAX_SAFE_INTEGER;
	let rcBottom = Number.MIN_SAFE_INTEGER;
	for(let i=0; i < items.length; i++) {
		let item = items[i];
		if(item.pos.x < rcLeft) rcLeft = item.pos.x;
		if(item.pos.x + item.pos.w > rcRight) rcRight = item.pos.x + item.pos.w;
		if(item.pos.y < rcTop) rcTop = item.pos.y;
		if(item.pos.y + item.pos.h > rcBottom) rcBottom = item.pos.y + item.pos.h;

		if(item.type === undefined) {
			item.type = 'item_name';
		}
		if(item.text === undefined) {
			item.text = '';
		}
	}
	let poly = {x:rcLeft, y:rcTop, w:rcRight-rcLeft, h:rcBottom-rcTop};
	// console.log(`poly: ${JSON.stringify(poly)}`);
	// console.log(JSON.stringify(items));
	let item_names = items.filter((v) => v.type === 'item_name').map((v) => v.text).join(' ');
	//let item_names = items.filter((v) => v.type === 'item_name').map((v) => v.text).join(' ');
	let item_descriptions = items.filter((v) => v.type === 'item_description').map((v) => v.text).join(' ');
	let item_prices = items.filter((v) => v.type === 'price').map((v) => v.text).join(' ');

	let group = {
		texts: [
			{
				text: `${item_names} ${item_names}`,
				type: 'item_name',
				pos: {x:0, y:0, w:0, h:0},
			},
			{
				text: item_descriptions,
				type: 'item_description',
				pos: {x:0, y:0, w:0, h:0},
			},
			{
				text: item_prices,
				type: 'price',
				pos: {x:0, y:0, w:0, h:0},
			}
		],
		poly: poly,
	}
	// console.log(JSON.stringify(group));
	return group;
}


function addNewMenuItemByUserSelectionRect(_extracted) {
	console.log(`addNewMenuItemByUserSelectionRect: ${JSON.stringify(_extracted)}`);
	let extracted = _extracted
	if(extracted.groups === undefined || extracted.groups.length < 1) { 
		if(extracted.items !== undefined && extracted.items.length > 0) {			
			let items = extracted.items;
			let group = createSingleGroupFromItems(items);
			extracted.groups = [group];
			// console.log(`no groups! created single group from items: ${JSON.stringify(extracted)}`);
		}		 
	} 

	if(extracted.groups !== undefined && extracted.groups.length > 1) {	
		addMultipleNewMenuItemByUserSelectionRect(extracted);
	} else if(extracted.groups !== undefined && extracted.groups.length == 1) {
		g_state.analayzing = false;
		g_state.analayzingFailed = false;
		updateAllControls();

		let item = rowsFromMenuData(extracted)[0];
		// console.log(JSON.stringify(item));
		let context = {
			showDeleteButton: false,
			showReproduceButton: false,
			title: 'Add New Dish',
			data: {			
				item_name:item.item_name,
				item_description: item.item_description,
				section: item.section,
				price: item.price,
			},
			sections: g_state.extracted_sections,
		};

		wixWindow.openLightbox("dish_editor", context)
		.then( res => {
			if(res !== null) {				
				updateExtractedSections(res.section);
				g_state.dataDirty = true;
				let rows = $w('#table1').rows;
				let color = 'DarkGreen';
				let newRow = {
					id: `id_${getNewRowId()}`,
					_color: color,				
					_item_name: `<span style="color:${color};">${res.item_name}</span>`,				
					_item_description: `<span style="color:${color};">${res.item_description}</span>`,
					_section: `<span style="color:${color};">${res.section}</span>`,
					_price: `<span style="color:${color};">${res.price}</span>`,
					item_name: res.item_name,
					item_description: res.item_description,
					section: res.section,
					price: res.price,
					x: item.x,
					y: item.y,
					w: item.w,
					h: item.h,
				};
				// console.log(`new row: ${JSON.stringify(newRow)}`);

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
}

function manuallyAddNewItem(areadata, extracted) {
	let vDesc = extracted !== undefined && extracted.items !== undefined ? extracted.items.map((v) => v.text).join(' ') : '';
	let vExtracted = {
		"groups": [
		{
			"texts":[
				{
					"text":'',
					"type":"item_name",
					"pos":{"x":areadata.x,"y":areadata.y,"w":areadata.w,"h":areadata.h}
				},
				{
					"text":vDesc,
					"type":"item_description",
					"pos":{"x":areadata.x,"y":areadata.y,"w":areadata.w,"h":areadata.h}
				},
				{
					"text":'',
					"type":"price",
					"pos":{"x":areadata.x,"y":areadata.y,"w":areadata.w,"h":areadata.h}
				}
			]
		}
	]
	};
	addNewMenuItemByUserSelectionRect(vExtracted);
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
		//wixWindow.copyToClipboard(cellData);

		if(event.target !== null && event.target.rows !== null) {
			let rowData = event.target.rows[event.cellRowIndex];
			// console.log(JSON.stringify(rowData));
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
	// console.log(JSON.stringify(rowData));
	setMenuMarkedArea(rowData.x, rowData.y, rowData.w, rowData.h);
	//wixWindow.copyToClipboard(`${rowData.item_name} - ${rowData.item_description} - ${rowData.price}`);
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
	// console.log('htmlevent handler');
	if(event.data !== undefined ) {
		let data = event.data;
		if(data.msg === 'areaSelected') {
			if(data.areaDataValid) {
				let areaData = data.areaData;
				// console.log(areaData.id);
				selectTableRowById(areaData.id);
				if(data.userSelectedRectValid) {
					// console.log(`update item<${areaData.id}> from user rect: ${JSON.stringify(data.userSelectedRect)}`);
					//TODO: if data.userSelectedRectValid - call rescan menu with the coords and update the item with the returned values.
					let imageUrl = $w('#input1').value;
					let x = data.userSelectedRect.x;
					let y = data.userSelectedRect.y;
					let w = data.userSelectedRect.w;
					let h= data.userSelectedRect.h;
					let oevrlapped = checkOverlaps([data.userSelectedRect], $w('#table1').rows);
					if(!oevrlapped) {
						let url = `https://www.wix.com/eureka/content/img/ocr/extract?url=${imageUrl}&p=${x},${y},${w},${h}`;
						console.log(url);
						g_state.analayzing = true;
						g_state.analayzingFailed = false;
						updateAllControls();
						extractMenuFromCoords(imageUrl, x, y, w, h)
						.then(extracted => {	
							// console.log(`extracted: ${JSON.stringify(extracted)}`);					
							updateMenuItemFromUserSelectedRect(areaData.id, extracted);
						})
						.catch( (err) => {						
							g_state.analayzingFailed = true;
							g_state.analyzingFailedMsgLine = `Update item Failed - ${JSON.stringify(err.res)}`;
							updateAllControls();
						})
						.finally( () => {
							g_state.analayzing = false;
							updateAllControls();
						});
					} 
				}
			} else if(data.userSelectedRectValid) {
				// console.log(`add new item from user rect: ${JSON.stringify(data.userSelectedRect)}`);
				//TODO: call rescan menu with the coords and add a new item with the returned values to the menu and init the table and navigator .
				let imageUrl = $w('#input1').value;
					let x = data.userSelectedRect.x;
					let y = data.userSelectedRect.y;
					let w = data.userSelectedRect.w;
					let h= data.userSelectedRect.h;
					let oevrlapped = checkOverlaps([data.userSelectedRect], $w('#table1').rows);
					if(!oevrlapped) {
						let url = `https://www.wix.com/eureka/content/img/ocr/extract?url=${imageUrl}&p=${x},${y},${w},${h}`;
						console.log(url);
						g_state.analayzing = true;
						g_state.analayzingFailed = false;
						updateAllControls();
						extractMenuFromCoords(imageUrl, x, y, w, h)
						.then(extracted => {
							// console.log(`extracted: ${JSON.stringify(extracted)}`);
							addNewMenuItemByUserSelectionRect(extracted);						
						})
						.catch( err => {
							g_state.analayzingFailed = true;
							g_state.analyzingFailedMsgLine = `Add new item Failed - ${JSON.stringify(err.res)}`;						
							updateAllControls();
							manuallyAddNewItem(data.userSelectedRect, err.data);
							// showAddNewItemFailedDialog()						
							// .then( res => {
							// 	if(res.result) {
							// 		manuallyAddNewItem(err.data);
							// 	}
							// })
						})
						.finally( () => {
							g_state.analayzing = false;
							updateAllControls();
						});
					}
			}
		} else if(data.msg === 'areaSelected-dblclick') {
			let areaData = data.areaData;
				// console.log(areaData.id);
				selectTableRowById(areaData.id);
				updateSelectedRow();
		} else if(data.msg === 'imageUnloaded') {			
				$w('#button1').disable();
				$w('#button3').disable();
				$w('#button2').link = '';
				$w('#button2').disable();	
				$w('#button7').disable();		
		} else if(data.msg === 'imageLoaded') {
			if(!g_state.analayzing) {
				$w('#button1').enable();
				$w('#button2').link = $w('#input1').value;
				$w('#button2').enable();
				$w('#button3').enable();
				$w('#button7').enable();
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
			showReproduceButton: true,
			data: g_selectedRowData,
			sections: g_state.extracted_sections,
		}	
		wixWindow.openLightbox("dish_editor", data)
		.then(res => {
			if(res !== null) {				
				g_state.dataDirty = true;				
				if(res.item_name === null && res.item_description === null && res.price === null) {													
					deleteRowFromTable(g_selectedRowData.id, res);
				} else if(res.doReproduce) {
					updateExtractedSections(res.section);
					let color = 'Purple';
					let newRow = {
						id: `id_${getNewRowId()}`,	
						_color: color,			
						_item_name: `<span style="color:${color};">${res.item_name}</span>`,				
						_item_description: `<span style="color:${color};">${res.item_description}</span>`,
						_section: `<span style="color:${color};">${res.section}</span>`,
						_price: `<span style="color:${color};">${res.price}</span>`,
						item_name: res.item_name,
						item_description: res.item_description,
						section: res.section,
						price: res.price,
						x: 0,
						y: 0,
						w: 0,
						h: 0,
					};
					rows.push(newRow);
					$w('#table1').rows = rows;
					selectTableRowById(newRow.id);
				} else {
					updateExtractedSections(res.section);
					for(let i=0; i<rows.length; i++) {
						if(rows[i].id === g_selectedRowData.id) {
							let color = rows[i]._color === 'Black' ? 'DarkOrange' : rows[i]._color;
							rows[i]._color = color;
							rows[i].item_name = res.item_name;
							rows[i].item_description = res.item_description;
							rows[i].section = res.section;
							rows[i].price = res.price;
							rows[i]._item_name = `<span style="color:${color}">${res.item_name}</span>`;
							rows[i]._item_description = `<span style="color:${color}">${res.item_description}</span>`;
							rows[i]._section = `<span style="color:${color}">${res.section}</span>`;
							rows[i]._price = `<span style="color:${color}">${res.price}</span>`;
							$w('#table1').rows = rows;
							$w('#table1').selectRow(i);
							break;
						}
					}
					}
					updateAllControls();
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
	let areadata = {x:0, y:0, w:0, h:0};
	let extracted = {};
	manuallyAddNewItem({x:0, y:0, w:0, h:0}, extracted);
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
	updateAllControls();
	let rows = $w('#table1').rows;
	let exportRows = rows.map((v,i) => {
		return {
			item_name: v.item_name.length < 1 ? (`${v.item_name} ${v.item_description}`).trim() : v.item_name,
			item_description: v.item_name.length < 1 ? '' : v.item_description,
			section: v.section.length < 1 ? '' : v.section,
			price: v.price,
		}
	});	

	let context = {
		title: 'Export Menu',
		data: JSON.stringify(exportRows, null, 2),
		price_warnings: g_state.price_warnings,
		name_warnings: g_state.name_warnings,
	}
	wixWindow.openLightbox('exporter', context)
	.then(res => {
		if(res.result) {
			g_state.exporting = true;
			g_state.exportingFailed = false;	
			updateAllControls();		
			let imgUrl = g_state.lastValidImgUrl;
			exportMenu(g_state.msid, g_state.lastValidImgUrl, exportRows)
			.then(res => {	
				// console.log(`exportMenu result: ${JSON.stringify(res)}`);
				showOkDialog('Menu Exported Successfully!', '<p style="padding:5px;">Go visit your website dashboard menus section.</p><p style="padding:5px;">Note: If the menu does not show in the your website dashboard menus section, please refresh it.</p>')
				.then(res => {
					g_state.exporting = false;
					updateAllControls();
				})
			})
			.catch(err => {
				g_state.exporting = false;
				g_state.exportingFailed = true;
				updateAllControls();
				// console.log(`exportMenu error: ${JSON.stringify(err)}`);
				let errorMessage = getTruncatedText(JSON.stringify(err), 250, '...');
				showErrorDialog('Menu Export Failed!', `Reason:\n${errorMessage}`)
				.then(res => {
					g_state.exporting = false;
					g_state.exportingFailed = false;
					updateAllControls();
				})
			});			
		}
	});
}

/**
*	Adds an event handler that runs when the element is clicked.
	[Read more](https://www.wix.com/corvid/reference/$w.ClickableMixin.html#onClick)
*	 @param {$w.MouseEvent} event
*/
export function button5_click(event) {
	// This function was added from the Properties & Events panel. To learn more, visit http://wix.to/UcBnC-4
	// Add your code for this event here: 
	let msg = {
		msg: 'zoomIn',
	};	
	$w('#html1').postMessage(msg);
}

/**
*	Adds an event handler that runs when the element is clicked.
	[Read more](https://www.wix.com/corvid/reference/$w.ClickableMixin.html#onClick)
*	 @param {$w.MouseEvent} event
*/
export function button6_click(event) {
	// This function was added from the Properties & Events panel. To learn more, visit http://wix.to/UcBnC-4
	// Add your code for this event here: 
	let msg = {
		msg: 'zoomOut',
	};	
	$w('#html1').postMessage(msg);
}

/**
*	Adds an event handler that runs when an input element's value
 is changed.
	[Read more](https://www.wix.com/corvid/reference/$w.ValueMixin.html#onChange)
*	 @param {$w.Event} event
*/
export function uploadButton1_change(event) {
	// This function was added from the Properties & Events panel. To learn more, visit http://wix.to/UcBnC-4
	// Add your code for this event here: 
	// console.log(`upload:${JSON.stringify($w('#uploadButton1').value)}`);
	$w("#uploadButton1").uploadFiles()
      .then( (uploadedFiles) => {
		let fileUrl = uploadedFiles[0].fileUrl;
		fileUrl = fileUrl.replace('wix:image://v1', 'https://static.wixstatic.com/media');
		let n = fileUrl.lastIndexOf('/');
		fileUrl = fileUrl.substring(0, n);
		$w('#input1').value = fileUrl;
        $w("#input1").value = fileUrl;
		$w('#uploadButton1').resetValidityIndication();
      })
      .catch( (uploadError) => {
        console.log("File upload error: " + uploadError.errorCode);
        console.log(uploadError.errorDescription);
      });
}

/**
*	Adds an event handler that runs when the element is clicked.
	[Read more](https://www.wix.com/corvid/reference/$w.ClickableMixin.html#onClick)
*	 @param {$w.MouseEvent} event
*/
export function button7_click(event) {
	// This function was added from the Properties & Events panel. To learn more, visit http://wix.to/UcBnC-4
	// Add your code for this event here: 

	showPropertiesDialog();
}
