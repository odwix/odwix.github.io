// API Reference: https://www.wix.com/velo/reference/api-overview/introduction
// “Hello, World!” Example: https://learn-code.wix.com/en/article/1-hello-world

import wixWindow from 'wix-window';

$w.onReady(function () {
	// Write your JavaScript here

	// To select an element by ID use: $w('#elementID')

	// Click 'Preview' to run your code
	let context = wixWindow.lightbox.getContext();
	$w("#input1").value = context.data.section_name;
	$w("#input2").value = context.data.item_description;
	$w("#input3").value = context.data.price;

	context.showDeleteButton ? $w('#button3').show() : $w('#button3').hide();

});

/**
*	Adds an event handler that runs when the element is clicked.
	[Read more](https://www.wix.com/corvid/reference/$w.ClickableMixin.html#onClick)
*	 @param {$w.MouseEvent} event
*/
export function button1_click(event) {
	// This function was added from the Properties & Events panel. To learn more, visit http://wix.to/UcBnC-4
	// Add your code for this event here: 
	let res = {
		section_name: $w("#input1").value,
		item_description: $w("#input2").value,
		price: $w("#input3").value,
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
		section_name: null,
		item_description: null,
		price: null,
	};
	wixWindow.lightbox.close(res); 
}
