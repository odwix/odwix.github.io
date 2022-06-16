// API Reference: https://www.wix.com/velo/reference/api-overview/introduction
// “Hello, World!” Example: https://learn-code.wix.com/en/article/1-hello-world

import wixWindow from 'wix-window';

let g_state = {
	func_rename_section: null,
	func_move_dishes: null,
}

$w.onReady(function () {
	// Write your JavaScript here

	// To select an element by ID use: $w('#elementID')

	// Click 'Preview' to run your code
	let context = wixWindow.lightbox.getContext();
	$w('#text1').html = context.title;
	$w('#dropdown1').options = context.sections;

	let sections = context.sections !== undefined ? context.sections : [];

	let rows = sections.map((v,i) => {
		return {label:v, value:v};
	});

	$w('#dropdown1').options = rows;
	$w('#dropdown2').options = rows;
	$w('#dropdown3').options = rows;

	$w('#text9').text = ``;

	g_state.func_rename_section = context.func_rename_section;
	g_state.func_move_dishes = context.func_move_dishes;

	updateAllControls();

});

function updateAllControls() {
	let enableDropDowns = $w('#dropdown1').options.length > 0;

	enableDropDowns ? $w('#dropdown1').enable() : $w('#dropdown1').disable();
	enableDropDowns ? $w('#dropdown2').enable() : $w('#dropdown2').disable();
	
	$w('#dropdown1').selectedIndex === undefined ? $w('#input1').disable() : $w('#input1').enable();

	$w('#dropdown1').selectedIndex !== undefined && $w('#input1').value.length > 0 && validateSelectedDishRename() ? $w('#button3').enable() : $w('#button3').disable();

	$w('#dropdown2').options.length < 2 ? $w('#dropdown2').disable() : $w('#dropdown2').enable();

	$w('#dropdown2').selectedIndex === undefined || $w('#dropdown2').options.length < 2 ? $w('#dropdown3').disable() : $w('#dropdown3').enable();

	$w('#dropdown2').selectedIndex === undefined || $w('#dropdown3').selectedIndex === undefined ? $w('#button7').disable() : $w('#button7').enable();

	

}

function validateSelectedDishRename() {
	let idx = $w('#dropdown1').selectedIndex;
	let rows = $w('#dropdown1').options;
	let nameTo = $w('#input1').value;

	let found = rows.find((v, i) => v.value.toLowerCase() === nameTo.toLowerCase());
	found = rows[idx].value.toLowerCase() === nameTo.toLocaleLowerCase() && rows[idx].value !== nameTo ? undefined : found;

	return found === undefined;
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
}

/**
*	Adds an event handler that runs when the element is clicked.
	[Read more](https://www.wix.com/corvid/reference/$w.ClickableMixin.html#onClick)
*	 @param {$w.MouseEvent} event
*/
export function button4_click(event) {
	// This function was added from the Properties & Events panel. To learn more, visit http://wix.to/UcBnC-4
	// Add your code for this event here: 
}

/**
*	Adds an event handler that runs when the element is clicked.
	[Read more](https://www.wix.com/corvid/reference/$w.ClickableMixin.html#onClick)
*	 @param {$w.MouseEvent} event
*/
export function button3_click_1(event) {	
	// Apply - Rename:

	let idx = $w('#dropdown1').selectedIndex;	
	let nameTo = $w('#input1').value.trim();
	if(idx !== undefined && nameTo.length > 0) {
		let rows = $w('#dropdown1').options;		
		let nameFrom = rows[idx].value;

		let found = validateSelectedDishRename();
		if(found) {
		
			rows[idx] = {label:nameTo, value:nameTo};

			$w('#dropdown1').options = rows;
			$w('#dropdown2').options = rows;
			$w('#dropdown3').options = rows;			

			$w('#dropdown1').selectedIndex = undefined;
			$w('#dropdown2').selectedIndex = undefined;
			$w('#dropdown3').selectedIndex = undefined;			

			if(g_state.func !== null) {
				g_state.func_rename_section(nameFrom, nameTo);
				$w('#text9').text = `Section "${nameFrom}" was renamed "${nameTo}"`;
			}

			updateAllControls();
		}
	}

}

/**
*	Adds an event handler that runs when an input element's value
 is changed.
	[Read more](https://www.wix.com/corvid/reference/$w.ValueMixin.html#onChange)
*	 @param {$w.Event} event
*/
export function dropdown1_change(event) {
	//Rename - clear input:
	$w('#input1').value = ''; 
	updateAllControls();
}

/**
*	Adds an event handler that runs when an input element's value
 is changed.
	[Read more](https://www.wix.com/corvid/reference/$w.ValueMixin.html#onChange)
*	 @param {$w.Event} event
*/
export function dropdown2_change(event) {
	// This function was added from the Properties & Events panel. To learn more, visit http://wix.to/UcBnC-4
	// Add your code for this event here: 
	$w('#dropdown3').selectedIndex = undefined;
	$w('#text9').text = ``;
	updateAllControls();

	let rows = $w('#dropdown2').options;
	let selectedIndex = $w('#dropdown2').selectedIndex;
	if(selectedIndex === undefined) {
		$w('#dropdown3').options = rows;
	} else {
		let selectedValue = rows[selectedIndex].value;
		let filtered = rows.filter((v,i) => v.value !== selectedValue);
		$w('#dropdown3').options = filtered;
	}
	updateAllControls();
}

/**
*	Adds an event handler that runs when the element is clicked.
	[Read more](https://www.wix.com/corvid/reference/$w.ClickableMixin.html#onClick)
*	 @param {$w.MouseEvent} event
*/
export function button7_click(event) {
	//Convert - apply move dishes from section to section	
	
	if(g_state.func_move_dishes !== null) {
		let fromRows = $w('#dropdown2').options;
		let fromIndex = $w('#dropdown2').selectedIndex;
		let toRows = $w('#dropdown3').options;
		let toIndex = $w('#dropdown3').selectedIndex;
		let fromSection = fromRows[fromIndex].label;
		let toSection = toRows[toIndex].label;
		g_state.func_move_dishes(fromSection, toSection);
		let msg = `All dishes in "${fromSection}" section were moved into "${toSection}" section.`;
		$w('#text9').text = msg;

		let rows = $w('#dropdown2').options;
		$w('#dropdown3').options = rows;
		$w('#dropdown2').selectedIndex = undefined;
		$w('#dropdown3').selectedIndex = undefined;
	}
	updateAllControls();
}


/**
*	Adds an event handler that runs when an input element's value
 is changed.
	[Read more](https://www.wix.com/corvid/reference/$w.ValueMixin.html#onChange)
*	 @param {$w.Event} event
*/
export function input1_change(event) {
	updateAllControls();
}

/**
*	Adds an event handler that runs when the input element receives
input.
	[Read more](https://www.wix.com/corvid/reference/$w.TextInputMixin.html#onInput)
*	 @param {$w.Event} event
*/
export function input1_input(event) {
	updateAllControls();
}

/**
*	Adds an event handler that runs when an input element's value
 is changed.
	[Read more](https://www.wix.com/corvid/reference/$w.ValueMixin.html#onChange)
*	 @param {$w.Event} event
*/
export function dropdown3_change(event) {
	// This function was added from the Properties & Events panel. To learn more, visit http://wix.to/UcBnC-4
	// Add your code for this event here: 
	updateAllControls();
}
