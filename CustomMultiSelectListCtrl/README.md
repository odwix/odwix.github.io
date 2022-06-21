# Custom Multi-Select List Control

### Abstract
The idea behind this control is to overcome some of the limitations that Wix's List controls have.
Although the control's API cannot be exactly the same as of the original Wix List Control, (since it's implemented
inside an IFrame), the data structures of the rows and the columns, are compatible with Wix's JSONs, 
to allow almost seamless migration of your existing code.

### Usage:
Embed this code in IFrame.
Communicate by sending messages to the IFrame element by using the postMessage() method. Here's an example:
```js
 function selectItem() {
    let context = {
        msg: 'selectRow',
        rowIndex: 17,
    };
    let iframe = document.getElementById('host_frame');
    iframe.contentWindow.postMessage(context, '*');
}
```


To get events from this control, register the IFrame to handle message using addEventListener for it.
as in this example: 
```js
window.addEventListener(("message"), (event) => {
    let data = event.data;
    if(data.msg === 'onItemsSelected') {
        console.log(data.rows);
    } else if(data.msg === 'onDblClick') {
        console.log(`dblClick: ${JSON.stringify(data.rows)}`);
    }
}, false);
```

### API:
#### Initializing columns
- msg = 'setCols'
- data = JSON of columns, compatible with Wix.

#### Setting rows data
- msg = 'setRows'
- data = JSON of rows, compatible with Wix.
Setting the rows will overwrite the current rows and clear the selections.

A row data must include a 'id' field (just as it's forced by Wix's List) so you must generate, track and supply this id.
A simple technique for generating a unique ID it to use a global counter variable that increases its value by 1 whenever a new item is created.


#### Getting rows data
It is impossible to just get data from the control since it's implemented in an IFrame.
Your rows data must be kept and managed in your own code.
You can modify the rows however you like, and update the list control by sending the rows data
to the control.

#### Selecting row
Select a row in the list. This will hilight the entire row, and will also fire the onItemSelected event 
- msg = 'selectRow'
- rowIndex = the row index (not the row id)

### Events:

#### onItemSelected
The data structure contain data of all rows that were selected by the user
This event will be triggered when the user selects or deselects one or more rows.
The event fields are:
- msg = 'onItemSelected'
- rows = 

#### onDblClick
Currently, double-clicking an item will make this item the only selected item. The item
will be sent via notification to the host.
The event fields are:
- msg = 'onDblClick'
- rows = The selected row data (not just the row id)
