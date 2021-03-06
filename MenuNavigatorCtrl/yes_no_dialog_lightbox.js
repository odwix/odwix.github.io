// API Reference: https://www.wix.com/velo/reference/api-overview/introduction
// “Hello, World!” Example: https://learn-code.wix.com/en/article/1-hello-world

import wixWindow from 'wix-window';

$w.onReady(function () {
	// Write your JavaScript here

	// To select an element by ID use: $w('#elementID')

	// Click 'Preview' to run your code
	let context = wixWindow.lightbox.getContext();
	let title = (context.title !== undefined && context.title.length > 0) ? context.title : "Yes/No Dialog";
	$w('#text1').html = title;

	let text = (context.text !== undefined && context.text.length > 0) ? context.text : "";	
	$w('#text2').html = text;
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
		result: true,
	};
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
	let res = {
		result: false,
	};
	wixWindow.lightbox.close(res);
}
