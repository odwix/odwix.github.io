// API Reference: https://www.wix.com/velo/reference/api-overview/introduction
// “Hello, World!” Example: https://learn-code.wix.com/en/article/1-hello-world

import wixWindow from 'wix-window';

let g_other_section_id = 'df9d5f8a-e740-11ec-8fea-0242ac120002';

$w.onReady(function () {
	let context = wixWindow.lightbox.getContext();
	let title = (context.title !== undefined && context.title.length > 0) ? context.title : "Dish Editor";
	$w('#text1').text = title;
	$w("#input1").value = context.data.item_name;
	$w("#input2").value = context.data.item_description;
	$w("#input3").value = context.data.price;
	$w('#input4').value = context.data.section;

	context.showDeleteButton ? $w('#button3').show() : $w('#button3').hide();
	context.showReproduceButton ? $w('#button4').show() : $w('#button4').hide();

	resetSections(context);	

	selectSection(context);

	updateAllControls();

});

function selectSection(context) {
	console.log(`selectSection: ${context.data.section}`);
	let foundSectionNameIdx = 0;
	if(context.data.section !== undefined) {		
		let ddSections = $w('#dropdown1').options;		
		for(let i=0; i<ddSections.length; i++) {
			if(ddSections[i].label === context.data.section) {
				foundSectionNameIdx = i;			
				break;
			}
		}
	}
	$w('#dropdown1').selectedIndex = foundSectionNameIdx;
}

function updateAllControls() {
	if($w('#dropdown1').value === g_other_section_id) {
		$w('#input4').value = '';
		$w('#input4').show();
	} else {		
		$w('#input4').hide();
		$w('#input4').value = $w('#dropdown1').value;
	}	
}

function resetSections(context) {	
	let sections = [{label:'Other:', value:`${g_other_section_id}`}];
	if(context.sections !== undefined && context.sections.length > 0) {
		let cs = context.sections.map((v,i) => {return {label:v, value:v};});
		sections.push(...cs);		
	}
	$w('#dropdown1').options = sections;
	updateAllControls();
}

/**
*	Adds an event handler that runs when the element is clicked.
	[Read more](https://www.wix.com/corvid/reference/$w.ClickableMixin.html#onClick)
*	 @param {$w.MouseEvent} event
*/
export function button1_click(event) {
	// This function was added from the Properties & Events panel. To learn more, visit http://wix.to/UcBnC-4
	// Add your code for this event here: 
	let res = {
		item_name: $w("#input1").value,
		item_description: $w("#input2").value,
		price: $w("#input3").value,
		section: $w("#input4").value,
		doReproduce: false,
	}
	wixWindow.lightbox.close(res);
}

/**
*	Adds an event handler that runs when the element is clicked.
	[Read more](https://www.wix.com/corvid/reference/$w.ClickableMixin.html#onClick)
*	 @param {$w.MouseEvent} event
*/
export function button2_click(event) {
	// This function was added from the Properties & Events panel. To learn more, visit http://wix.to/UcBnC-4
	// Add your code for this event here: 
	wixWindow.lightbox.close(null);
}

/**
*	Adds an event handler that runs when the element is clicked.
	[Read more](https://www.wix.com/corvid/reference/$w.ClickableMixin.html#onClick)
*	 @param {$w.MouseEvent} event
*/
export function button3_click(event) {
	// This function was added from the Properties & Events panel. To learn more, visit http://wix.to/UcBnC-4
	// Add your code for this event here:
	let context = wixWindow.lightbox.getContext();
	let res = {		
		item_name: null,
		item_description: null,
		price: null,
		section: null,
		doReproduce: false,
	};
	wixWindow.lightbox.close(res); 
}

/**
*	Adds an event handler that runs when the element is clicked.
	[Read more](https://www.wix.com/corvid/reference/$w.ClickableMixin.html#onClick)
*	 @param {$w.MouseEvent} event
*/
export function button4_click(event) {
	// This function was added from the Properties & Events panel. To learn more, visit http://wix.to/UcBnC-4
	// Add your code for this event here: 
	let res = {
		item_name: $w("#input1").value,
		item_description: $w("#input2").value,
		price: $w("#input3").value,	
		section: $w('#input4').value,
		doReproduce: true,
	}
	wixWindow.lightbox.close(res);
}

/**
*	Adds an event handler that runs when an input element's value
 is changed.
	[Read more](https://www.wix.com/corvid/reference/$w.ValueMixin.html#onChange)
*	 @param {$w.Event} event
*/
export function dropdown1_change(event) {
	updateAllControls();
}
