# Custom Multi-Select List Control

### Abstract
The idea behind this control is to overcome some of the limitations that Wix's List controls have.
Although the control's API cannot be exactly the same as of the original Wix List Control, (since it's implemented
inside an IFrame), the data structures of the rows and the columns, are compatible with Wix's JSONs, 
to allow almost seamless migration of your existing code.

### Usage:
Embed this code in IFrame.
Communicate via the window.post(msg, '\*'). See the API and Events Specifications
To get events from this control, register the IFrame to handle message using addEventListener for it.

### API:
#### Initializing columns
msg = 'setCols'
data = JSON of columns, compatible with Wix.

#### Setting rows data
msg = 'setRows'
data = JSON of rows, compatible with Wix.
Setting the rows will overwrite the current rows and clear the selections.

#### Getting rows data
It is impossible to just get data from the control since it's implemented in an IFrame.
Your rows data must be kept and managed in your own code.
You can modify the rows however you like, and update the list control by sending the rows data
to the control.

### Events:

#### onSelectChanged
The data structure contain data of all rows that were selected by the user
This event will be triggered when the user selects or deselects one or more rows.

#### onDblClick
TBD
